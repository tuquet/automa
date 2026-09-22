import * as vscode from "vscode";
import {
	clearAllJobHistory,
	deleteJobHistoryItem,
	getJobExecutionLogs,
	getJobHistory,
} from "../core/api/client";
import { DaemonService } from "../core/daemon/DaemonService";
import { Logger } from "../core/Logger";
import { formatApiError } from "../utils/errorUtils";

/**
 * Clears all history entries via the Daemon API.
 * Registered as: automa.clearHistory
 */
export async function clearHistoryCommand() {
	if (!DaemonService.isRunning()) {
		vscode.window.showWarningMessage(
			"Daemon is offline. Cannot clear history.",
		);
		return;
	}

	const confirm = await vscode.window.showWarningMessage(
		"Are you sure you want to clear all execution history?",
		{ modal: true },
		"Yes",
	);
	if (confirm !== "Yes") return;

	try {
		const res = await clearAllJobHistory();
		if (res.error) throw new Error(formatApiError(res.error));
		vscode.window.showInformationMessage("History cleared successfully.");
		await vscode.commands.executeCommand("automa.refreshLogs");
	} catch (e: unknown) {
		vscode.window.showErrorMessage(
			`Failed to clear history: ${formatApiError(e)}`,
		);
	}
}

/**
 * Deletes a single history item by job_id via the Daemon API.
 * Can be called from tree view context menus or webview IPC.
 * Registered as: automa.deleteHistoryItem / automa.deleteLogItem
 */
export async function deleteHistoryItemCommand(item?: unknown) {
	if (!DaemonService.isRunning()) {
		vscode.window.showWarningMessage(
			"Daemon is offline. Cannot delete history item.",
		);
		return;
	}

	let jobId: string | undefined;
	if (item && typeof item === "object") {
		if (
			"jobId" in item &&
			typeof (item as { jobId?: unknown }).jobId === "string"
		) {
			jobId = (item as { jobId: string }).jobId;
		} else if (
			"id" in item &&
			typeof (item as { id?: unknown }).id === "string"
		) {
			jobId = (item as { id: string }).id;
		}
	}

	if (!jobId) {
		vscode.window.showWarningMessage("No history item selected to delete.");
		return;
	}

	const confirm = await vscode.window.showWarningMessage(
		`Delete history item ${jobId}?`,
		{ modal: true },
		"Yes",
	);
	if (confirm !== "Yes") return;

	try {
		const res = await deleteJobHistoryItem({ path: { job_id: jobId } });
		if (res.error) throw new Error(formatApiError(res.error));
		vscode.window.showInformationMessage(
			`History item ${jobId} deleted successfully.`,
		);
		await vscode.commands.executeCommand("automa.refreshLogs");
	} catch (e: unknown) {
		vscode.window.showErrorMessage(
			`Failed to delete history item: ${formatApiError(e)}`,
		);
	}
}

export async function focusActiveRunnersCommand() {
	await vscode.commands.executeCommand("automa.workspace.focus");
}

/**
 * Shows interactive execution history and step logs via QuickPick.
 * Registered as: automa.showJobHistory
 */
export async function showJobHistoryCommand() {
	if (!DaemonService.isRunning()) {
		vscode.window.showWarningMessage(
			"Daemon is offline. Cannot load job history.",
		);
		return;
	}

	try {
		const res = await getJobHistory({ query: { limit: 50 } });
		if (res.error) throw new Error(formatApiError(res.error));
		const items = res.data || [];

		if (items.length === 0) {
			vscode.window.showInformationMessage(
				"No previous workflow execution history found.",
			);
			return;
		}

		interface HistoryQuickPickItem extends vscode.QuickPickItem {
			jobId: string;
		}

		const qpItems: HistoryQuickPickItem[] = items.map((item) => {
			const statusIcon =
				item.status === "completed" || item.status === "success"
					? "$(pass-filled)"
					: item.status === "failed" || item.status === "error"
						? "$(error)"
						: "$(sync~spin)";
			const startTime = new Date(item.createdAt).getTime();
			const endTime = new Date(item.updatedAt).getTime();
			const diffSec =
				!Number.isNaN(startTime) &&
				!Number.isNaN(endTime) &&
				endTime >= startTime
					? ((endTime - startTime) / 1000).toFixed(1)
					: null;
			const durationStr = diffSec ? ` • ${diffSec}s` : "";
			const dateStr = item.createdAt
				? new Date(item.createdAt).toLocaleTimeString()
				: "";

			return {
				label: `${statusIcon} ${item.name || item.id}`,
				description: `${item.status?.toUpperCase() || "UNKNOWN"}${durationStr}`,
				detail: `Job ID: ${item.id} • Started: ${dateStr}`,
				jobId: item.id,
			};
		});

		const selected = await vscode.window.showQuickPick(qpItems, {
			placeHolder: "Select a job run to inspect execution logs or actions",
		});

		if (!selected) return;

		interface ActionItem extends vscode.QuickPickItem {
			action: "logs" | "delete";
		}

		const action = await vscode.window.showQuickPick<ActionItem>(
			[
				{ label: "$(output) View Step Logs", action: "logs" },
				{ label: "$(trash) Delete This History Record", action: "delete" },
			],
			{ placeHolder: `Action for job: ${selected.jobId}` },
		);

		if (action?.action === "logs") {
			const logRes = await getJobExecutionLogs({
				path: { job_id: selected.jobId },
			});
			if (logRes.error) throw new Error(formatApiError(logRes.error));
			const channel = Logger.getOutputChannel();
			if (channel) {
				channel.clear();
				channel.show(true);
				channel.appendLine(`=== Execution Logs for Job: ${selected.jobId} ===`);
				channel.appendLine(`Workflow: ${selected.label}`);
				channel.appendLine(`Status: ${selected.description}`);
				channel.appendLine(
					"--------------------------------------------------",
				);
				const logs =
					(
						logRes.data as {
							logs?: Array<{
								message?: string;
								level?: string;
								timestamp?: string;
							}>;
						}
					)?.logs || [];
				for (const l of logs) {
					channel.appendLine(
						`[${l.timestamp || ""}] [${l.level || "INFO"}] ${l.message || ""}`,
					);
				}
				channel.appendLine(
					"--------------------------------------------------",
				);
			}
		} else if (action?.action === "delete") {
			await deleteHistoryItemCommand({ jobId: selected.jobId });
		}
	} catch (e: unknown) {
		vscode.window.showErrorMessage(
			`Failed to load history: ${formatApiError(e)}`,
		);
	}
}
