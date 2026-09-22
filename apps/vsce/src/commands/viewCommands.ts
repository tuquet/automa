import type { LiveLogCommandArgs } from "@automa/types";
import * as vscode from "vscode";
import { VIEW_TYPES } from "../core/constants";
import { AutomaDbFileSystemProvider } from "../core/services/AutomaDbFileSystemProvider";
import { LiveLogPanelManager } from "../panels/LiveLogPanel";
import { LogEditorProvider } from "../providers/LogEditorProvider";
import { resolveEntityTarget } from "../utils/targetResolver";

export type { LiveLogCommandArgs };

async function openEntityWith(
	uriOrItem: unknown,
	type: "workflow" | "campaign",
	viewType: string,
	actionName: string,
): Promise<void> {
	try {
		const target = resolveEntityTarget(uriOrItem);
		let targetUri = target?.uri;

		if (!targetUri && target?.id) {
			targetUri =
				type === "workflow"
					? AutomaDbFileSystemProvider.createWorkflowUri(target.id, target.name)
					: AutomaDbFileSystemProvider.createCampaignUri(
							target.id,
							target.name,
						);
		}

		if (!targetUri) {
			targetUri = vscode.window.activeTextEditor?.document.uri;
		}

		if (!targetUri) {
			vscode.window.showWarningMessage(
				`No ${type} selected or open in editor to ${actionName}.`,
			);
			return;
		}
		await vscode.commands.executeCommand(
			"vscode.openWith",
			targetUri,
			viewType,
		);
	} catch (error: unknown) {
		const msg = error instanceof Error ? error.message : String(error);
		vscode.window.showErrorMessage(
			`Failed to open ${type} ${actionName}: ${msg}`,
		);
	}
}

export function showWorkflowSourceCommand() {
	return (uriOrItem?: unknown) =>
		openEntityWith(uriOrItem, "workflow", "default", "show source");
}

export function showWorkflowPreviewCommand() {
	return (uriOrItem?: unknown) =>
		openEntityWith(
			uriOrItem,
			"workflow",
			VIEW_TYPES.WORKFLOW_EDITOR,
			"preview",
		);
}

export function showCampaignSourceCommand() {
	return (uriOrItem?: unknown) =>
		openEntityWith(uriOrItem, "campaign", "default", "show source");
}

export function showCampaignPreviewCommand() {
	return (uriOrItem?: unknown) =>
		openEntityWith(
			uriOrItem,
			"campaign",
			VIEW_TYPES.CAMPAIGN_EDITOR,
			"preview",
		);
}

export function showLogSourceCommand() {
	return async (uri: vscode.Uri) => {
		if (uri) {
			await vscode.commands.executeCommand("vscode.openWith", uri, "default");
		} else {
			await vscode.commands.executeCommand("workbench.action.reopenTextEditor");
		}
	};
}

export function showLogPreviewCommand(context: vscode.ExtensionContext) {
	return async (uri: vscode.Uri) => {
		if (uri && uri.scheme === "automa-log") {
			await LogEditorProvider.showLogPreview(context, uri);
		} else if (uri) {
			await vscode.commands.executeCommand(
				"vscode.openWith",
				uri,
				VIEW_TYPES.LOG_EDITOR,
			);
		}
	};
}

export function showLiveLogCommand(context: vscode.ExtensionContext) {
	return (args?: LiveLogCommandArgs) => {
		if (!args) return;

		let jobId = "";
		let name = "";

		if (args.jobId) {
			jobId = args.jobId;
			name = args.jobId;
		} else if (args.task?.definition) {
			jobId = args.task.definition.id || args.task.name || "";
			name = args.task.name || "";
		} else {
			return; // Invalid args
		}

		LiveLogPanelManager.showLiveLog(context, jobId, name);
	};
}
