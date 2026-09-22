import * as fs from "node:fs";
import type {
	BrowserResponse,
	SubmitJobOptions,
	SubmitJobPayload,
} from "@automa/types/api";
import * as vscode from "vscode";
import { getBrowsers } from "../core/api/client";
import { DaemonService } from "../core/daemon/DaemonService";
import { Logger } from "../core/Logger";
import { TaskRunner } from "../core/TaskRunner";
import { resolveEntityTarget, resolveTarget } from "../utils/targetResolver";

function buildRunOptions(
	config: vscode.WorkspaceConfiguration,
	keepBrowserOpen: boolean,
	params?: Record<string, unknown>,
): SubmitJobOptions {
	const globalVariables =
		config.get<Record<string, unknown>>("run.globalVariables") ?? {};
	const mergedVariables = { ...globalVariables, ...(params || {}) };

	return {
		headless: config.get<boolean>("run.headless", false),
		debug: config.get<boolean>("run.debug", true),
		defaultBrowser: config.get<string>("run.defaultBrowser"),
		closeBrowserOnFinish: !keepBrowserOpen,
		variables:
			Object.keys(mergedVariables).length > 0 ? mergedVariables : undefined,
	};
}

async function resolveBrowserId(
	config: vscode.WorkspaceConfiguration,
): Promise<string | null> {
	const configured = config.get<string>("run.defaultBrowser");

	if (configured && configured.trim().length > 0) {
		return configured.trim();
	}

	// If no default browser is configured in settings, check DB for is_default or ask user
	try {
		if (!DaemonService.isRunning()) {
			await DaemonService.start();
		}
		const res = await getBrowsers();
		const data = (res.data || []) as BrowserResponse[];

		const defaultBrowser = data.find(
			(b) =>
				(b as unknown as { is_default?: boolean; isDefault?: boolean })
					.is_default ||
				(b as unknown as { is_default?: boolean; isDefault?: boolean })
					.isDefault,
		);
		if (defaultBrowser?.id) {
			return defaultBrowser.id;
		}

		const items: vscode.QuickPickItem[] = [
			{
				label: "Default Worker (Automa Core)",
				description: "daemon_worker",
				detail: "Isolated background Chromium worker",
			},
			...data.map((p) => ({
				label: p.name || p.id || "Unknown Browser",
				description: p.id || undefined,
				detail: "Browser Instance",
			})),
		];

		const selected = await vscode.window.showQuickPick(items, {
			placeHolder: "Select a Browser to execute this workflow",
			title: "Automa Run: Select Browser",
		});

		if (!selected) {
			Logger.warn("Workflow execution cancelled: No browser selected.");
			return null;
		}

		return selected.description || selected.label;
	} catch (e: unknown) {
		const msg = e instanceof Error ? e.message : String(e);
		Logger.warn(`Failed to list browsers: ${msg}, fallback to daemon_worker`);
		return "daemon_worker";
	}
}

export interface RunWorkflowCommandOptions extends Partial<SubmitJobOptions> {
	keepBrowserOpen?: boolean;
}

export async function runWorkflowCommand(
	nodeOrUri?:
		| vscode.Uri
		| {
				resourceUri?: vscode.Uri;
				fsPath?: string;
				element?: {
					id?: string;
					name?: string;
					rawData?: Record<string, unknown>;
				};
		  }
		| unknown,
	params?: Record<string, unknown>,
	runOptions?: RunWorkflowCommandOptions,
): Promise<void> {
	const outputChannel = Logger.getOutputChannel();
	if (outputChannel) {
		outputChannel.show(false);
	}
	Logger.info("[Run Workflow] Triggered execution request");

	if (!DaemonService.isRunning()) {
		await DaemonService.start();
	}

	let workflowId: string | undefined;
	let displayName: string | undefined;
	let workflowData: Record<string, unknown> | undefined;

	const entityTarget = resolveEntityTarget(nodeOrUri);
	if (entityTarget?.id) {
		workflowId = entityTarget.id;
		displayName = entityTarget.name || entityTarget.id;
		workflowData = entityTarget.rawData;
	}

	// Fallback to active editor or file resolution
	if (!workflowId) {
		const target = await resolveTarget(nodeOrUri, ".json", "Select Workflow");
		if (!target) {
			Logger.warn("[Run Workflow] Target resolution cancelled or failed.");
			TaskRunner.telemetryEmitter?.emit("telemetry", {
				message: "[Runner] Target resolution cancelled or failed.",
			});
			return;
		}
		const { targetPath, displayName: name } = target;
		displayName = name;
		workflowId = displayName.replace(/\.workflow\.json$|\.json$/, "");

		try {
			const raw = await fs.promises.readFile(targetPath, "utf-8");
			const parsed = JSON.parse(raw);
			if (parsed && typeof parsed === "object") {
				if (typeof parsed.id === "string" && parsed.id.trim()) {
					workflowId = parsed.id.trim();
				}
				workflowData = parsed;
			}
		} catch (_e) {
			// Fallback to workflowId from filename
		}
	}

	Logger.info(
		`[Run Workflow] Target resolved: ${displayName} (ID: ${workflowId})`,
	);
	TaskRunner.telemetryEmitter?.emit("telemetry", {
		message: `[Runner] Target resolved: ${displayName}`,
	});

	const config = vscode.workspace.getConfiguration("automa");
	const browserId = runOptions?.browserId || (await resolveBrowserId(config));
	if (!browserId) {
		Logger.warn("[Run Workflow] Execution aborted: No browser selected.");
		TaskRunner.telemetryEmitter?.emit("telemetry", {
			message: "[Runner] Execution aborted: No browser selected.",
		});
		return;
	}
	Logger.info(`[Run Workflow] Browser selected: ${browserId}`);
	TaskRunner.telemetryEmitter?.emit("telemetry", {
		message: `[Runner] Browser: ${browserId}`,
	});

	const keepBrowserOpen =
		runOptions?.keepBrowserOpen ??
		!config.get<boolean>("run.closeBrowserOnFinish", true);

	const baseOptions = buildRunOptions(config, keepBrowserOpen, params);
	const options: SubmitJobOptions = {
		...baseOptions,
		...runOptions,
		browserId,
		closeBrowserOnFinish: !keepBrowserOpen,
	};

	const payload: SubmitJobPayload = {
		workflowId,
		workflowData,
		options,
	};

	await TaskRunner.submitJob(payload, {
		id: `workflow-${Date.now()}`,
		name: `Workflow: ${displayName}`,
		source: "Automa",
		startMessage: `Running Workflow: ${displayName} (ID: ${workflowId})`,
		successMessage: `Workflow finished: ${displayName}`,
		errorMessage: `Workflow failed: ${displayName}`,
		statusBarText: `Running: ${displayName}`,
		useTelemetry: false,
	});
}

async function openStudioUrl(route = ""): Promise<void> {
	try {
		if (!DaemonService.isRunning()) {
			await DaemonService.start();
		}
		const port = DaemonService.getPort();
		const url = `http://localhost:${port}/studio${route}`;
		await vscode.env.openExternal(vscode.Uri.parse(url));
	} catch (e: unknown) {
		const msg = e instanceof Error ? e.message : String(e);
		vscode.window.showErrorMessage(`Failed to open Automa Studio: ${msg}`);
	}
}

export async function createWorkflowCommand(): Promise<void> {
	await openStudioUrl();
}

export async function createPackageCommand(): Promise<void> {
	await openStudioUrl("/packages");
}
