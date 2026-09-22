import * as vscode from "vscode";
import { abortCampaign, getStorageCampaigns } from "../core/api/client";
import { DaemonService } from "../core/daemon/DaemonService";
import { Logger } from "../core/Logger";
import { formatApiError } from "../utils/errorUtils";
import { resolveEntityTarget } from "../utils/targetResolver";

export async function stopCampaignCommand(
	nodeOrUri?:
		| vscode.Uri
		| { fsPath?: string; element?: { id?: string; name?: string } }
		| unknown,
): Promise<void> {
	if (!DaemonService.isRunning()) {
		vscode.window.showWarningMessage(
			"Daemon is offline. Cannot stop campaign.",
		);
		return;
	}

	let campaignId: string | undefined;
	let displayName: string | undefined;

	const entityTarget = resolveEntityTarget(nodeOrUri);
	if (entityTarget?.id) {
		campaignId = entityTarget.id;
		displayName = entityTarget.name || entityTarget.id;
	}

	if (!campaignId) {
		try {
			const res = await getStorageCampaigns();
			const campaigns = res.data || [];
			if (campaigns.length > 0) {
				const picked = await vscode.window.showQuickPick(
					campaigns.map((c) => ({
						label: c.name || c.id,
						description: c.id,
						detail: c.description || undefined,
					})),
					{ placeHolder: "Select Campaign to stop" },
				);
				if (!picked) return;
				campaignId = picked.description || picked.label;
				displayName = picked.label;
			}
		} catch {
			// Fallback to input box if fetch fails
		}
	}

	if (!campaignId) {
		const input = await vscode.window.showInputBox({
			prompt: "Enter Campaign ID to stop",
			placeHolder: "e.g. campaign_123",
		});
		if (!input?.trim()) return;
		campaignId = input.trim();
		displayName = campaignId;
	}

	try {
		Logger.info(`[Stop Campaign] Aborting campaign: ${campaignId}`);
		const res = await abortCampaign({
			path: { id: campaignId },
		});

		if (res.error) {
			throw new Error(formatApiError(res.error));
		}

		vscode.window.showInformationMessage(
			`Campaign "${displayName}" stopped successfully.`,
		);
		await vscode.commands.executeCommand("automa.refreshWorkspace");
	} catch (e: unknown) {
		vscode.window.showErrorMessage(
			`Failed to stop campaign: ${formatApiError(e)}`,
		);
	}
}
