import * as path from "node:path";
import * as vscode from "vscode";
import { formatApiError } from "../../../utils/errorUtils";
import { resolveEntityTarget } from "../../../utils/targetResolver";
import {
	exportStorageBackup,
	getStorageWorkflow,
	getStorageWorkflows,
} from "../../api/client";
import { DaemonService } from "../../daemon/DaemonService";

export class WorkflowExportService {
	public async exportWorkflow(itemOrUri?: unknown): Promise<void> {
		if (!DaemonService.isRunning()) {
			await DaemonService.start();
		}

		const resolved = await this.resolveExportTarget(itemOrUri);
		if (!resolved) return;

		const { workflowId, defaultName } = resolved;

		try {
			const res = await getStorageWorkflow({ path: { id: workflowId } });
			if (res.error || !res.data) {
				vscode.window.showErrorMessage(
					`Failed to fetch workflow '${workflowId}' from database.`,
				);
				return;
			}

			const sanitizedName = defaultName
				.toLowerCase()
				.replace(/[^a-z0-9_-]/g, "-")
				.replace(/-+/g, "-");

			const saveUri = await vscode.window.showSaveDialog({
				defaultUri: vscode.Uri.file(`${sanitizedName}.automa.json`),
				filters: {
					"Automa Workflow (*.automa.json)": ["automa.json", "json"],
				},
				title: "Export Workflow to File",
			});
			if (!saveUri) return;

			const exportContent = JSON.stringify(res.data.data, null, 2);
			await vscode.workspace.fs.writeFile(
				saveUri,
				Buffer.from(exportContent, "utf8"),
			);

			vscode.window.showInformationMessage(
				`Workflow "${res.data.name}" exported to ${path.basename(saveUri.fsPath)} ⭐`,
			);
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : String(e);
			vscode.window.showErrorMessage(`Export error: ${msg}`);
		}
	}

	public async exportBackup(): Promise<void> {
		if (!DaemonService.isRunning()) {
			await DaemonService.start();
		}

		const password = await vscode.window.showInputBox({
			prompt:
				"Optional: Enter a password to encrypt backup with AES-256-CBC (leave empty for plaintext)",
			password: true,
			ignoreFocusOut: true,
		});

		try {
			const res = await exportStorageBackup({
				query: {
					password: password?.trim() || undefined,
				},
			});

			if (res.error || !res.data) {
				vscode.window.showErrorMessage(
					`Failed to export backup: ${formatApiError(res.error)}`,
				);
				return;
			}

			const defaultFileName = `automa-backup-${new Date().toISOString().slice(0, 10)}.json`;
			const saveUri = await vscode.window.showSaveDialog({
				defaultUri: vscode.Uri.file(defaultFileName),
				filters: {
					"Automa Backup (*.json)": ["json"],
				},
				title: "Save Automa Full Backup",
			});
			if (!saveUri) return;

			await vscode.workspace.fs.writeFile(
				saveUri,
				Buffer.from(JSON.stringify(res.data, null, 2), "utf8"),
			);

			vscode.window.showInformationMessage(
				`Automa backup exported to ${path.basename(saveUri.fsPath)} successfully!`,
			);
		} catch (e: unknown) {
			vscode.window.showErrorMessage(
				`Export backup error: ${e instanceof Error ? e.message : String(e)}`,
			);
		}
	}

	private async resolveExportTarget(
		itemOrUri?: unknown,
	): Promise<{ workflowId: string; defaultName: string } | null> {
		const target = resolveEntityTarget(itemOrUri);
		if (target?.id) {
			return {
				workflowId: target.id,
				defaultName: target.name || target.id,
			};
		}

		const listRes = await getStorageWorkflows();
		const items = listRes.data || [];
		if (items.length === 0) {
			vscode.window.showWarningMessage(
				"No workflows found in SQLite Database to export.",
			);
			return null;
		}

		const pick = await vscode.window.showQuickPick(
			items.map((w) => ({
				label: w.name,
				description: w.id,
				detail: w.description || undefined,
				workflow: w,
			})),
			{ placeHolder: "Select Workflow from SQLite DB to Export" },
		);
		if (!pick) return null;

		return {
			workflowId: pick.workflow.id,
			defaultName: pick.workflow.name,
		};
	}
}
