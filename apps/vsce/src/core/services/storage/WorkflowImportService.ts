import * as path from "node:path";
import * as vscode from "vscode";
import { resolveTargetUri } from "../../../utils/targetResolver";
import {
	importStorageCampaign,
	importStorageWorkflow,
	restoreStorageBackup,
} from "../../api/client";
import { DaemonService } from "../../daemon/DaemonService";

interface ImportCounts {
	workflows: number;
	campaigns: number;
	variables: number;
	tables: number;
}

export class WorkflowImportService {
	public async importWorkflowsOrBackups(itemOrUri?: unknown): Promise<void> {
		if (!DaemonService.isRunning()) {
			await DaemonService.start();
		}

		const targetUris = await this.resolveImportUris(itemOrUri);
		if (targetUris.length === 0) return;

		const counts: ImportCounts = {
			workflows: 0,
			campaigns: 0,
			variables: 0,
			tables: 0,
		};

		for (const uri of targetUris) {
			await this.processSingleFile(uri, counts);
		}

		this.notifyImportResults(counts);
	}

	public async importCampaign(itemOrUri?: unknown): Promise<void> {
		if (!DaemonService.isRunning()) {
			await DaemonService.start();
		}

		let targetUri = resolveTargetUri(itemOrUri);
		if (!targetUri) {
			const picked = await vscode.window.showOpenDialog({
				canSelectMany: false,
				openLabel: "Import Campaign to Database",
				title: "Select Campaign JSON File (*.campaign.json, *.json)",
				filters: {
					"Campaign JSON Files": ["campaign.json", "campaigns.json", "json"],
				},
			});
			if (!picked || picked.length === 0 || !picked[0]) return;
			targetUri = picked[0];
		}

		try {
			const contentBytes = await vscode.workspace.fs.readFile(targetUri);
			const jsonStr = Buffer.from(contentBytes).toString("utf8");
			const parsed = JSON.parse(jsonStr);

			const res = await importStorageCampaign({ body: { campaign: parsed } });
			if (res.error) {
				const err = res.error as { message?: string };
				vscode.window.showErrorMessage(
					`Failed to import campaign: ${err?.message || "Unknown error"}`,
				);
				return;
			}

			const cName = res.data?.name || path.basename(targetUri.fsPath);
			const cId = res.data?.id || "";
			vscode.window.showInformationMessage(
				`Successfully imported Campaign "${cName}" (ID: ${cId}) into SQLite Database.`,
			);
			await vscode.commands.executeCommand("automa.refreshWorkspace");
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : String(e);
			vscode.window.showErrorMessage(`Import error: ${msg}`);
		}
	}

	private async resolveImportUris(itemOrUri?: unknown): Promise<vscode.Uri[]> {
		const singleUri = resolveTargetUri(itemOrUri);
		if (singleUri) return [singleUri];

		const picked = await vscode.window.showOpenDialog({
			canSelectMany: true,
			openLabel: "Import to Database",
			title: "Select Workflow / Package / Backup JSON File(s)",
			filters: {
				"Automa Files (*.json, *.automa.json)": [
					"json",
					"automa.json",
					"workflow.json",
					"package.json",
				],
			},
		});
		return picked && picked.length > 0 ? picked : [];
	}

	private async processSingleFile(
		uri: vscode.Uri,
		counts: ImportCounts,
	): Promise<void> {
		try {
			const contentBytes = await vscode.workspace.fs.readFile(uri);
			const jsonStr = Buffer.from(contentBytes).toString("utf8");
			let parsed = JSON.parse(jsonStr);
			if (typeof parsed === "string") {
				parsed = JSON.parse(parsed);
			}

			if (this.isFullBackup(parsed)) {
				await this.processBackup(parsed, uri, counts);
				return;
			}
			if (Array.isArray(parsed)) {
				await this.processWorkflowArray(parsed, uri, counts);
				return;
			}
			if (this.isCampaign(parsed)) {
				const success = await this.processCampaignJson(parsed);
				if (success) counts.campaigns++;
				return;
			}
			if (parsed && typeof parsed === "object") {
				const success = await this.processSingleWorkflow(parsed, uri);
				if (success) counts.workflows++;
			}
		} catch (e: unknown) {
			const msg = e instanceof Error ? e.message : String(e);
			vscode.window.showErrorMessage(
				`Import error for ${path.basename(uri.fsPath)}: ${msg}`,
			);
		}
	}

	private isFullBackup(parsed: unknown): boolean {
		return (
			Boolean(parsed) &&
			typeof parsed === "object" &&
			!Array.isArray(parsed) &&
			("workflows" in (parsed as object) ||
				"storageTables" in (parsed as object) ||
				"storageVariables" in (parsed as object))
		);
	}

	private isCampaign(parsed: unknown): boolean {
		if (!parsed || typeof parsed !== "object") return false;
		const obj = parsed as Record<string, unknown>;
		return ("browsers" in obj && "tasks" in obj) || "campaign" in obj;
	}

	private async processBackup(
		parsed: Record<string, unknown>,
		uri: vscode.Uri,
		counts: ImportCounts,
	): Promise<void> {
		let password: string | undefined;

		if (parsed.isProtected) {
			const input = await vscode.window.showInputBox({
				prompt: "Enter password to decrypt protected Automa backup",
				password: true,
				ignoreFocusOut: true,
			});
			if (!input) {
				vscode.window.showWarningMessage(
					"Decryption cancelled: Password is required.",
				);
				return;
			}
			password = input;
		}

		const res = await restoreStorageBackup({
			body: { backup: parsed, password },
		});
		if (!res.error && res.data) {
			counts.workflows += res.data.workflowsCount;
			counts.variables += res.data.variablesCount;
			counts.tables += res.data.tablesCount;
		} else {
			const err = res.error as { error?: string; message?: string };
			vscode.window.showErrorMessage(
				`Failed to restore backup ${path.basename(uri.fsPath)}: ${err?.error || err?.message || "Unknown error"}`,
			);
		}
	}

	private async processWorkflowArray(
		parsed: unknown[],
		uri: vscode.Uri,
		counts: ImportCounts,
	): Promise<void> {
		const res = await restoreStorageBackup({
			body: { backup: { workflows: parsed } },
		});
		if (!res.error && res.data) {
			counts.workflows += res.data.workflowsCount;
			counts.variables += res.data.variablesCount;
			counts.tables += res.data.tablesCount;
		} else {
			const err = res.error as { error?: string; message?: string };
			vscode.window.showErrorMessage(
				`Failed to restore workflows ${path.basename(uri.fsPath)}: ${err?.error || err?.message || "Unknown error"}`,
			);
		}
	}

	private async processCampaignJson(
		parsed: Record<string, unknown>,
	): Promise<boolean> {
		const res = await importStorageCampaign({ body: { campaign: parsed } });
		return !res.error;
	}

	private async processSingleWorkflow(
		parsed: Record<string, unknown>,
		uri: vscode.Uri,
	): Promise<boolean> {
		const res = await importStorageWorkflow({ body: { workflow: parsed } });
		if (!res.error) return true;

		const err = res.error as { message?: string };
		vscode.window.showErrorMessage(
			`Failed to import ${path.basename(uri.fsPath)}: ${err?.message || "Unknown error"}`,
		);
		return false;
	}

	private notifyImportResults(counts: ImportCounts): void {
		const parts: string[] = [];
		if (counts.workflows > 0)
			parts.push(`${counts.workflows} workflow(s)/package(s)`);
		if (counts.campaigns > 0) parts.push(`${counts.campaigns} campaign(s)`);
		if (counts.variables > 0) parts.push(`${counts.variables} variable(s)`);
		if (counts.tables > 0) parts.push(`${counts.tables} table(s)`);

		if (parts.length > 0) {
			vscode.window.showInformationMessage(
				`Successfully imported ${parts.join(", ")} into SQLite Database.`,
			);
			void vscode.commands.executeCommand("automa.refreshWorkspace");
		}
	}
}
