import * as vscode from "vscode";
import { formatApiError } from "../../../utils/errorUtils";
import { resolveEntityTarget } from "../../../utils/targetResolver";
import {
	deleteStorageCampaign,
	deleteStorageWorkflow,
	getStorageCampaigns,
	getStorageWorkflows,
} from "../../api/client";
import { DAEMON_EVENTS } from "../../constants";
import { DaemonService } from "../../daemon/DaemonService";
import { globalEvents } from "../../daemon/GlobalSseListener";

export type DeletableEntityType = "workflow" | "campaign";

export class StorageDeletionService {
	public async deleteEntity(
		type: DeletableEntityType,
		item?: unknown,
	): Promise<boolean> {
		if (!DaemonService.isRunning()) {
			await DaemonService.start();
		}

		const target = resolveEntityTarget(item);
		let id = target?.id;
		let name = target?.name;

		if (!id) {
			const picked = await this.promptEntitySelection(type);
			if (!picked) return false;
			id = picked.id;
			name = picked.name;
		}

		const entityLabel = type === "workflow" ? "workflow" : "campaign";
		const displayName = name || id;

		const confirm = await vscode.window.showWarningMessage(
			`Are you sure you want to delete ${entityLabel} '${displayName}' from SQLite Database?`,
			{ modal: true },
			"Delete",
		);
		if (confirm !== "Delete") return false;

		return this.executeDeletion(type, id, displayName);
	}

	private async promptEntitySelection(
		type: DeletableEntityType,
	): Promise<{ id: string; name: string } | null> {
		try {
			if (type === "workflow") {
				const res = await getStorageWorkflows();
				const items = res.data || [];
				if (items.length === 0) {
					vscode.window.showInformationMessage(
						"No workflows found in SQLite Database to delete.",
					);
					return null;
				}
				const pick = await vscode.window.showQuickPick(
					items.map((wf) => ({
						label: wf.name,
						description: wf.id,
						detail: wf.description || "Stored workflow",
						id: wf.id,
						name: wf.name,
					})),
					{ placeHolder: "Select a workflow to delete from database" },
				);
				return pick ? { id: pick.id, name: pick.name } : null;
			}

			const res = await getStorageCampaigns();
			const items = res.data || [];
			if (items.length === 0) {
				vscode.window.showInformationMessage(
					"No campaigns found in SQLite Database to delete.",
				);
				return null;
			}
			const pick = await vscode.window.showQuickPick(
				items.map((cp) => ({
					label: cp.name,
					description: cp.id,
					detail: cp.description || "Stored campaign",
					id: cp.id,
					name: cp.name,
				})),
				{ placeHolder: "Select a campaign to delete from database" },
			);
			return pick ? { id: pick.id, name: pick.name } : null;
		} catch (e: unknown) {
			vscode.window.showErrorMessage(
				`Failed to fetch ${type}s list: ${formatApiError(e)}`,
			);
			return null;
		}
	}

	private async executeDeletion(
		type: DeletableEntityType,
		id: string,
		displayName: string,
	): Promise<boolean> {
		try {
			const res =
				type === "workflow"
					? await deleteStorageWorkflow({ path: { id } })
					: await deleteStorageCampaign({ path: { id } });

			if (res.error) throw new Error(formatApiError(res.error));

			const titleCase = type === "workflow" ? "Workflow" : "Campaign";
			vscode.window.showInformationMessage(
				`${titleCase} '${displayName}' deleted.`,
			);
			globalEvents.emit(DAEMON_EVENTS.STORAGE_CHANGED);
			await vscode.commands.executeCommand("automa.refreshWorkspace");
			return true;
		} catch (e: unknown) {
			vscode.window.showErrorMessage(
				`Failed to delete ${type}: ${formatApiError(e)}`,
			);
			return false;
		}
	}
}
