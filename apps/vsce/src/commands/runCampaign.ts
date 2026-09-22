import type { ExecuteCampaignRequest } from "@automa/types/api";
import * as vscode from "vscode";
import { createStorageCampaign, executeCampaign } from "../core/api/client";
import { DaemonService } from "../core/daemon/DaemonService";
import { formatApiError } from "../utils/errorUtils";
import { resolveEntityTarget, resolveTarget } from "../utils/targetResolver";

export async function runCampaignCommand(
	nodeOrUri?:
		| vscode.Uri
		| { fsPath?: string; element?: { id?: string; name?: string } }
		| unknown,
): Promise<void> {
	if (!DaemonService.isRunning()) {
		await DaemonService.start();
	}

	let campaignId: string | undefined;
	let displayName: string | undefined;
	let targetPath: string | undefined;

	const entityTarget = resolveEntityTarget(nodeOrUri);
	if (entityTarget?.id) {
		campaignId = entityTarget.id;
		displayName = entityTarget.name || entityTarget.id;
	}

	if (!campaignId) {
		const target = await resolveTarget(
			nodeOrUri,
			[".campaign.json", ".campaigns.json"],
			"Select Campaign",
		);
		if (!target) return;
		targetPath = target.targetPath;
		displayName = target.displayName;
	}

	const config = vscode.workspace.getConfiguration("automa");
	const gridSystem = config.get<boolean>("run.campaignGridSystem", true);

	const payload: ExecuteCampaignRequest = {
		campaignId: campaignId || undefined,
		campaignPath: targetPath || undefined,
		runNow: true,
		useGrid: gridSystem,
	};

	try {
		const res = await executeCampaign({
			body: payload,
		});

		if (res.error) throw new Error(formatApiError(res.error));

		vscode.window.showInformationMessage(
			`Campaign "${displayName}" started successfully. Campaign ID: ${res.data?.campaignId}`,
		);
	} catch (e: unknown) {
		vscode.window.showErrorMessage(
			`Failed to start campaign: ${formatApiError(e)}`,
		);
	}
}

/**
 * Creates a new Campaign directly in SQLite Database.
 */
export async function createCampaignCommand(): Promise<void> {
	if (!DaemonService.isRunning()) {
		await DaemonService.start();
	}

	const campaignName = await vscode.window.showInputBox({
		prompt: "Enter Campaign Name",
		placeHolder: "e.g. Daily Batch Processing",
		validateInput: (value) => {
			if (!value || value.trim() === "") {
				return "Campaign name cannot be empty";
			}
			return null;
		},
	});

	if (!campaignName) return;

	try {
		const res = await createStorageCampaign({
			body: {
				name: campaignName.trim(),
				description: "",
				version: "1.0.0",
				cron: "",
				data: {
					workflows: [],
					browsers: [],
					settings: {
						concurrency_mode: "queue",
					},
				},
			},
		});

		if (res.error) {
			const err = res.error as { message?: string };
			vscode.window.showErrorMessage(
				`Failed to create campaign: ${err?.message || "Unknown error"}`,
			);
			return;
		}

		vscode.window.showInformationMessage(
			`Campaign '${campaignName}' created successfully in SQLite Database.`,
		);
		await vscode.commands.executeCommand("automa.refreshWorkspace");
	} catch (error: unknown) {
		const message = error instanceof Error ? error.message : String(error);
		vscode.window.showErrorMessage(`Failed to create campaign: ${message}`);
	}
}
