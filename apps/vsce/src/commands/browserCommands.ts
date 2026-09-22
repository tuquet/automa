import * as fs from "node:fs/promises";
import * as vscode from "vscode";
import {
	type BrowserResponse,
	createBrowser,
	deleteBrowser,
	getBrowserDetail,
	getBrowsers,
	importBrowsersCsv,
	killAllBrowsers,
	sideloadBrowserExtension,
	startBrowser,
	stopBrowserSession,
	submitJob,
} from "../core/api/client";
import { DaemonService } from "../core/daemon/DaemonService";
import { formatApiError } from "../utils/errorUtils";

/**
 * Creates a new browser profile directly in SQLite Database.
 */
export async function createBrowserCommand(): Promise<void> {
	if (!DaemonService.isRunning()) {
		await DaemonService.start();
	}

	const browserName = await vscode.window.showInputBox({
		prompt: "Enter Browser Display Name",
		placeHolder: "e.g. Marketing Account 1",
		validateInput: (value) => {
			if (!value || value.trim() === "") return "Browser name cannot be empty";
			return null;
		},
	});

	if (!browserName) return;

	const trimmedName = browserName.trim();
	const id =
		trimmedName
			.toLowerCase()
			.replace(/[^a-z0-9_-]/g, "_")
			.replace(/_+/g, "_")
			.replace(/^_|_$/g, "") || `browser_${Date.now()}`;

	try {
		const res = await createBrowser({
			body: {
				id,
				name: trimmedName,
			},
		});

		if (res.error) {
			const err = res.error as { message?: string };
			vscode.window.showErrorMessage(
				`Failed to create browser: ${err?.message || "Unknown error"}`,
			);
			return;
		}

		// Auto-set as default if no default or default is daemon_worker
		const currentDefault = vscode.workspace
			.getConfiguration("automa.run")
			.get<string>("defaultBrowser");
		if (!currentDefault || currentDefault === "daemon_worker") {
			await vscode.workspace
				.getConfiguration("automa.run")
				.update("defaultBrowser", id, vscode.ConfigurationTarget.Global);
			vscode.window.showInformationMessage(
				`Created Browser "${trimmedName}" in Database and set as Default ⭐`,
			);
		} else {
			vscode.window.showInformationMessage(
				`Created Browser "${trimmedName}" successfully in SQLite Database.`,
			);
		}

		await vscode.commands.executeCommand("automa.refreshBrowsers");
	} catch (e: unknown) {
		const msg = e instanceof Error ? e.message : String(e);
		vscode.window.showErrorMessage(
			`Failed to create browser in database: ${msg}`,
		);
	}
}

/**
 * Resolves a browser ID from argument or prompts user via QuickPick.
 */
async function resolveBrowserId(
	item?: { id?: string },
	predicate?: (b: BrowserResponse) => boolean,
	placeholder = "Select a Browser Profile",
): Promise<string | undefined> {
	if (item?.id) return item.id;

	if (!DaemonService.isRunning()) {
		await DaemonService.start();
	}

	const res = await getBrowsers();
	if (res.error) throw new Error(formatApiError(res.error));
	let browsers = res.data || [];
	if (predicate) {
		browsers = browsers.filter(predicate);
	}

	if (browsers.length === 0) {
		vscode.window.showInformationMessage(
			"No matching browser profiles found in database.",
		);
		return undefined;
	}

	interface BrowserQuickPickItem extends vscode.QuickPickItem {
		browserId: string;
	}

	const qpItems: BrowserQuickPickItem[] = browsers.map((b) => ({
		label: b.name || b.id,
		description: `${b.isOnline ? "Online" : "Offline"} • ${b.id}`,
		browserId: b.id,
	}));

	const picked = await vscode.window.showQuickPick(qpItems, {
		placeHolder: placeholder,
	});

	return picked?.browserId;
}

/**
 * Launches an anti-detect browser instance via Daemon API.
 */
export async function launchBrowserCommand(item?: {
	id?: string;
}): Promise<void> {
	const browserId = await resolveBrowserId(
		item,
		(b) => !b.isOnline,
		"Select an Offline Browser to Launch",
	);
	if (!browserId) return;

	const res = await startBrowser({ path: { id: browserId } });
	if (res?.error) throw new Error(formatApiError(res.error));
	vscode.window.showInformationMessage(`Browser '${browserId}' launched.`);
	await vscode.commands.executeCommand("automa.refreshBrowsers");
}

/**
 * Stops an active anti-detect browser instance.
 */
export async function stopBrowserCommand(item?: {
	id?: string;
}): Promise<void> {
	const browserId = await resolveBrowserId(
		item,
		(b) => Boolean(b.isOnline),
		"Select a Running Browser to Stop",
	);
	if (!browserId) return;

	const res = await stopBrowserSession({ path: { id: browserId } });
	if (res?.error) throw new Error(formatApiError(res.error));
	vscode.window.showInformationMessage(`Browser '${browserId}' stopped.`);
	await vscode.commands.executeCommand("automa.refreshBrowsers");
}

/**
 * Deletes a browser profile from SQLite Database.
 */
export async function deleteBrowserCommand(item?: {
	id?: string;
}): Promise<void> {
	const browserId = await resolveBrowserId(
		item,
		undefined,
		"Select a Browser to Delete",
	);
	if (!browserId) return;

	const confirm = await vscode.window.showWarningMessage(
		`Are you sure you want to delete browser profile '${browserId}'?`,
		{ modal: true },
		"Yes",
		"No",
	);
	if (confirm !== "Yes") return;

	const res = await deleteBrowser({ path: { id: browserId } });
	if (res?.error) throw new Error(formatApiError(res.error));
	vscode.window.showInformationMessage(
		`Browser '${browserId}' profile deleted.`,
	);
	await vscode.commands.executeCommand("automa.refreshBrowsers");
}

/**
 * Opens browser configuration JSON in an editor.
 */
export async function editBrowserCommand(item?: {
	id?: string;
}): Promise<void> {
	const browserId = await resolveBrowserId(
		item,
		undefined,
		"Select a Browser to View / Edit",
	);
	if (!browserId) return;

	const res = await getBrowserDetail({ path: { id: browserId } });
	if (res?.error) throw new Error(formatApiError(res.error));
	const doc = await vscode.workspace.openTextDocument({
		content: JSON.stringify(res.data, null, 2),
		language: "json",
	});
	await vscode.window.showTextDocument(doc);
}

/**
 * Kills all active browser processes.
 */
export async function killAllBrowsersCommand(): Promise<void> {
	const confirm = await vscode.window.showWarningMessage(
		"Kill ALL active browser sessions?",
		{ modal: true },
		"Yes",
	);
	if (confirm !== "Yes") return;
	const res = await killAllBrowsers();
	if (res?.error) throw new Error(formatApiError(res.error));
	vscode.window.showInformationMessage("All browser sessions terminated.");
}

/**
 * Imports browser profiles from a CSV file via Daemon API.
 */
export async function importBrowsersFromCsvCommand(): Promise<void> {
	const uris = await vscode.window.showOpenDialog({
		canSelectMany: false,
		filters: { "CSV Files": ["csv"] },
		title: "Select Browsers CSV",
	});

	if (!uris || uris.length === 0 || !uris[0]) return;
	const selectedUri = uris[0];

	if (!DaemonService.isRunning()) {
		vscode.window.showWarningMessage(
			"Automa Core is offline. Cannot import browsers.",
		);
		return;
	}

	try {
		const csvString = await fs.readFile(selectedUri.fsPath, "utf-8");
		const port = DaemonService.getPort();
		const res = await importBrowsersCsv({
			baseUrl: `http://127.0.0.1:${port}`,
			body: { csv_string: csvString },
		});

		if (res.error) {
			const err = res.error as { message?: string };
			vscode.window.showErrorMessage(
				`Failed to import browsers: ${err?.message || "Unknown error"}`,
			);
			return;
		}

		vscode.window.showInformationMessage("Browsers CSV imported successfully!");
		await vscode.commands.executeCommand("automa.refreshBrowsers");
	} catch (e: unknown) {
		const msg = e instanceof Error ? e.message : String(e);
		vscode.window.showErrorMessage(`Failed to import browsers: ${msg}`);
	}
}

/**
 * Sideload an extension directory into a browser instance.
 */
export async function sideloadExtensionCommand(browserItem?: {
	id?: string;
}): Promise<void> {
	let browserId = browserItem?.id;
	if (!browserId) {
		browserId = await vscode.window.showInputBox({
			prompt: "Enter Browser ID to sideload extension into",
		});
		if (!browserId) return;
	}

	const uris = await vscode.window.showOpenDialog({
		canSelectMany: false,
		canSelectFiles: false,
		canSelectFolders: true,
		title: "Select Extension Directory to Sideload",
	});

	if (!uris || uris.length === 0 || !uris[0]) return;
	const selectedUri = uris[0];

	if (!DaemonService.isRunning()) {
		vscode.window.showWarningMessage(
			"Automa Core is offline. Cannot sideload extension.",
		);
		return;
	}

	try {
		const extensionPath = selectedUri.fsPath;
		const port = DaemonService.getPort();
		const res = await sideloadBrowserExtension({
			baseUrl: `http://127.0.0.1:${port}`,
			path: { id: browserId },
			body: { extension_path: extensionPath },
		});

		if (res.error) {
			const err = res.error as { message?: string };
			vscode.window.showErrorMessage(
				`Failed to sideload extension: ${err?.message || "Unknown error"}`,
			);
			return;
		}

		vscode.window.showInformationMessage(
			`Extension sideloaded successfully into browser '${browserId}'!`,
		);
		await vscode.commands.executeCommand("automa.refreshBrowsers");
	} catch (e: unknown) {
		const msg = e instanceof Error ? e.message : String(e);
		vscode.window.showErrorMessage(`Failed to sideload extension: ${msg}`);
	}
}

/**
 * Executes a workflow on a specific browser profile via submitJob.
 */
export async function executeWorkflowOnBrowserCommand(browserItem?: {
	id?: string;
}): Promise<void> {
	let browserId = browserItem?.id;
	if (!browserId) {
		browserId = await vscode.window.showInputBox({
			prompt: "Enter Browser ID",
		});
		if (!browserId) return;
	}

	const workflowUris = await vscode.window.showOpenDialog({
		canSelectMany: false,
		filters: { "Workflow Files": ["json"] },
		title: "Select Workflow File to Execute",
	});

	if (!workflowUris || workflowUris.length === 0 || !workflowUris[0]) return;
	const selectedWorkflowUri = workflowUris[0];

	if (!DaemonService.isRunning()) {
		vscode.window.showWarningMessage(
			"Daemon is offline. Cannot execute workflow.",
		);
		return;
	}

	try {
		const raw = await fs.readFile(selectedWorkflowUri.fsPath, "utf-8");
		let workflowId =
			selectedWorkflowUri.path
				.split("/")
				.pop()
				?.replace(/\.workflow\.json$|\.json$/, "") || "workflow";
		let workflowData: Record<string, unknown> | undefined;
		try {
			const parsed = JSON.parse(raw);
			if (parsed && typeof parsed === "object") {
				if (typeof parsed.id === "string" && parsed.id.trim()) {
					workflowId = parsed.id.trim();
				}
				workflowData = parsed;
			}
		} catch (_e) {
			// Fallback to filename workflowId
		}

		const res = await submitJob({
			body: {
				workflowId,
				workflowData,
				options: { browserId },
			},
		});
		if (res.error) throw new Error(formatApiError(res.error));
		vscode.window.showInformationMessage(
			`Workflow '${workflowId}' execution started on browser ${browserId}. Job ID: ${res.data?.jobId}`,
		);
	} catch (e: unknown) {
		vscode.window.showErrorMessage(
			`Failed to execute workflow: ${formatApiError(e)}`,
		);
	}
}
