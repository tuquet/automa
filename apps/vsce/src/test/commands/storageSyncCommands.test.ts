import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as vscode from "vscode";
import {
	deleteStorageCampaignCommand,
	deleteStorageWorkflowCommand,
	exportStorageBackupCommand,
	exportWorkflowToFileCommand,
	importCampaignToDbCommand,
	importWorkflowToDbCommand,
} from "../../commands/storageSyncCommands";
import {
	deleteStorageCampaign,
	deleteStorageWorkflow,
	exportStorageBackup,
	getStorageCampaigns,
	getStorageWorkflow,
	getStorageWorkflows,
	importStorageCampaign,
	restoreStorageBackup,
} from "../../core/api/client";
import { DAEMON_EVENTS } from "../../core/constants";
import { globalEvents } from "../../core/daemon/GlobalSseListener";

vi.mock("../../core/api/client", () => ({
	deleteStorageWorkflow: vi.fn(),
	deleteStorageCampaign: vi.fn(),
	getStorageWorkflows: vi.fn(),
	getStorageCampaigns: vi.fn(),
	importStorageWorkflow: vi.fn(),
	importStorageCampaign: vi.fn(),
	getStorageWorkflow: vi.fn(),
	restoreStorageBackup: vi.fn(),
	exportStorageBackup: vi.fn(),
}));

vi.mock("../../core/daemon/DaemonService", () => ({
	DaemonService: {
		isRunning: vi.fn().mockReturnValue(true),
		start: vi.fn().mockResolvedValue(undefined),
	},
}));

describe("storageSyncCommands - Deletion", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("deleteStorageWorkflowCommand", () => {
		it("should delete workflow from TreeItem element when confirmed", async () => {
			const treeItem = {
				id: "wf_123",
				element: {
					id: "wf_123",
					name: "Login Automation",
				},
			};

			vi.mocked(vscode.window.showWarningMessage).mockResolvedValue(
				"Delete" as unknown as vscode.MessageItem,
			);
			vi.mocked(deleteStorageWorkflow).mockResolvedValue({
				data: { success: true, message: "Deleted" },
			} as never);
			const sseSpy = vi.spyOn(globalEvents, "emit");
			const cmdSpy = vi.spyOn(vscode.commands, "executeCommand");

			await deleteStorageWorkflowCommand(treeItem);

			expect(deleteStorageWorkflow).toHaveBeenCalledWith({
				path: { id: "wf_123" },
			});
			expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
				"Workflow 'Login Automation' deleted.",
			);
			expect(sseSpy).toHaveBeenCalledWith(DAEMON_EVENTS.STORAGE_CHANGED);
			expect(cmdSpy).toHaveBeenCalledWith("automa.refreshWorkspace");
		});

		it("should cancel deletion if user rejects confirmation", async () => {
			const treeItem = {
				element: { id: "wf_cancel", name: "Cancel Me" },
			};

			vi.mocked(vscode.window.showWarningMessage).mockResolvedValue(undefined);

			await deleteStorageWorkflowCommand(treeItem);

			expect(deleteStorageWorkflow).not.toHaveBeenCalled();
		});

		it("should prompt with quickpick if triggered without item and daemon started", async () => {
			vi.mocked(getStorageWorkflows).mockResolvedValue({
				data: [
					{
						id: "wf_picked",
						name: "Picked WF",
						data: {},
						version: "1.0.0",
						created_at: "",
						updated_at: "",
					},
				],
			} as never);
			vi.mocked(vscode.window.showQuickPick).mockResolvedValue({
				label: "Picked WF",
				id: "wf_picked",
				name: "Picked WF",
			} as never);
			vi.mocked(vscode.window.showWarningMessage).mockResolvedValue(
				"Delete" as unknown as vscode.MessageItem,
			);
			vi.mocked(deleteStorageWorkflow).mockResolvedValue({
				data: { success: true, message: "Deleted" },
			} as never);

			await deleteStorageWorkflowCommand(undefined);

			expect(deleteStorageWorkflow).toHaveBeenCalledWith({
				path: { id: "wf_picked" },
			});
		});
	});

	describe("deleteStorageCampaignCommand", () => {
		it("should delete campaign from TreeItem element when confirmed", async () => {
			const treeItem = {
				id: "cp_456",
				element: {
					id: "cp_456",
					name: "Fleet Sync Campaign",
				},
			};

			vi.mocked(vscode.window.showWarningMessage).mockResolvedValue(
				"Delete" as unknown as vscode.MessageItem,
			);
			vi.mocked(deleteStorageCampaign).mockResolvedValue({
				data: { success: true, message: "Deleted" },
			} as never);
			const sseSpy = vi.spyOn(globalEvents, "emit");
			const cmdSpy = vi.spyOn(vscode.commands, "executeCommand");

			await deleteStorageCampaignCommand(treeItem);

			expect(deleteStorageCampaign).toHaveBeenCalledWith({
				path: { id: "cp_456" },
			});
			expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
				"Campaign 'Fleet Sync Campaign' deleted.",
			);
			expect(sseSpy).toHaveBeenCalledWith(DAEMON_EVENTS.STORAGE_CHANGED);
			expect(cmdSpy).toHaveBeenCalledWith("automa.refreshWorkspace");
		});

		it("should cancel deletion if user rejects confirmation", async () => {
			const treeItem = {
				element: { id: "cp_cancel", name: "Cancel Campaign" },
			};

			vi.mocked(vscode.window.showWarningMessage).mockResolvedValue(undefined);

			await deleteStorageCampaignCommand(treeItem);

			expect(deleteStorageCampaign).not.toHaveBeenCalled();
		});

		it("should prompt with quickpick if triggered without item", async () => {
			vi.mocked(getStorageCampaigns).mockResolvedValue({
				data: [
					{
						id: "cp_picked",
						name: "Picked CP",
						data: {},
						version: "1.0.0",
						created_at: "",
						updated_at: "",
					},
				],
			} as never);
			vi.mocked(vscode.window.showQuickPick).mockResolvedValue({
				label: "Picked CP",
				id: "cp_picked",
				name: "Picked CP",
			} as never);
			vi.mocked(vscode.window.showWarningMessage).mockResolvedValue(
				"Delete" as unknown as vscode.MessageItem,
			);
			vi.mocked(deleteStorageCampaign).mockResolvedValue({
				data: { success: true, message: "Deleted" },
			} as never);

			await deleteStorageCampaignCommand(undefined);

			expect(deleteStorageCampaign).toHaveBeenCalledWith({
				path: { id: "cp_picked" },
			});
		});
	});

	describe("importWorkflowToDbCommand", () => {
		it("should delegate full backup JSON directly to restoreStorageBackup", async () => {
			const fakeBackup = {
				workflows: [{ id: "wf_1", name: "WF 1" }],
				storageVariables: [],
				storageTables: [],
			};
			const fakeUri = vscode.Uri.file("/path/to/automa-backup.json");
			vi.mocked(vscode.workspace.fs.readFile).mockResolvedValue(
				Buffer.from(JSON.stringify(fakeBackup), "utf8"),
			);
			vi.mocked(restoreStorageBackup).mockResolvedValue({
				data: {
					success: true,
					workflowsCount: 1,
					variablesCount: 0,
					tablesCount: 0,
					message: "Restored successfully",
				},
			} as never);

			await importWorkflowToDbCommand(fakeUri);

			expect(restoreStorageBackup).toHaveBeenCalledWith({
				body: {
					backup: fakeBackup,
					password: undefined,
				},
			});
			expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
				expect.stringContaining("1 workflow(s)/package(s)"),
			);
		});

		it("should prompt password and delegate to restoreStorageBackup for protected backups", async () => {
			const fakeProtectedBackup = {
				isProtected: true,
				workflows: "some_hmac_and_ciphertext",
				storageVariables: [],
				storageTables: [],
			};
			const fakeUri = vscode.Uri.file("/path/to/protected-backup.json");
			vi.mocked(vscode.workspace.fs.readFile).mockResolvedValue(
				Buffer.from(JSON.stringify(fakeProtectedBackup), "utf8"),
			);
			vi.mocked(vscode.window.showInputBox).mockResolvedValue("secret_pass123");
			vi.mocked(restoreStorageBackup).mockResolvedValue({
				data: {
					success: true,
					workflowsCount: 2,
					variablesCount: 1,
					tablesCount: 1,
					message: "Restored successfully",
				},
			} as never);

			await importWorkflowToDbCommand(fakeUri);

			expect(vscode.window.showInputBox).toHaveBeenCalledWith(
				expect.objectContaining({ password: true }),
			);
			expect(restoreStorageBackup).toHaveBeenCalledWith({
				body: {
					backup: fakeProtectedBackup,
					password: "secret_pass123",
				},
			});
		});

		it("should delegate array of workflows to restoreStorageBackup", async () => {
			const fakeWorkflowsArray = [{ id: "wf_array", name: "Array WF" }];
			const fakeUri = vscode.Uri.file("/path/to/workflows.json");
			vi.mocked(vscode.workspace.fs.readFile).mockResolvedValue(
				Buffer.from(JSON.stringify(fakeWorkflowsArray), "utf8"),
			);
			vi.mocked(restoreStorageBackup).mockResolvedValue({
				data: {
					success: true,
					workflowsCount: 1,
					variablesCount: 0,
					tablesCount: 0,
					message: "Restored successfully",
				},
			} as never);

			await importWorkflowToDbCommand(fakeUri);

			expect(restoreStorageBackup).toHaveBeenCalledWith({
				body: {
					backup: { workflows: fakeWorkflowsArray },
				},
			});
		});
	});

	describe("exportStorageBackupCommand", () => {
		it("should query exportStorageBackup and write backup file", async () => {
			vi.mocked(vscode.window.showInputBox).mockResolvedValue("mypassword");
			vi.mocked(exportStorageBackup).mockResolvedValue({
				data: {
					workflows: "ciphertext",
					storageVariables: [],
					storageTables: [],
					isProtected: true,
					version: "1.0.0",
				},
			} as never);
			const targetUri = vscode.Uri.file("/out/automa-backup.json");
			vi.mocked(vscode.window.showSaveDialog).mockResolvedValue(targetUri);
			const writeSpy = vi
				.mocked(vscode.workspace.fs.writeFile)
				.mockResolvedValue(undefined);

			await exportStorageBackupCommand();

			expect(exportStorageBackup).toHaveBeenCalledWith({
				query: { password: "mypassword" },
			});
			expect(writeSpy).toHaveBeenCalled();
			expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
				expect.stringContaining("Automa backup exported to"),
			);
		});
	});

	describe("exportWorkflowToFileCommand", () => {
		it("should export workflow to file from TreeItem element", async () => {
			const treeItem = {
				element: { id: "wf_exp_1", name: "Export WF" },
			};
			vi.mocked(getStorageWorkflow).mockResolvedValue({
				data: {
					id: "wf_exp_1",
					name: "Export WF",
					data: { nodes: [] },
				},
			} as never);
			const targetUri = vscode.Uri.file("/out/export-wf.automa.json");
			vi.mocked(vscode.window.showSaveDialog).mockResolvedValue(targetUri);
			const writeSpy = vi
				.mocked(vscode.workspace.fs.writeFile)
				.mockResolvedValue(undefined);

			await exportWorkflowToFileCommand(treeItem);

			expect(getStorageWorkflow).toHaveBeenCalledWith({
				path: { id: "wf_exp_1" },
			});
			expect(writeSpy).toHaveBeenCalled();
			expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
				expect.stringContaining("Export WF"),
			);
		});
	});

	describe("importCampaignToDbCommand", () => {
		it("should import campaign from file URI", async () => {
			const fakeCampaign = {
				name: "Campaign 1",
				browsers: [],
				tasks: [],
			};
			const fakeUri = vscode.Uri.file("/path/to/test.campaign.json");
			vi.mocked(vscode.workspace.fs.readFile).mockResolvedValue(
				Buffer.from(JSON.stringify(fakeCampaign), "utf8"),
			);
			vi.mocked(importStorageCampaign).mockResolvedValue({
				data: {
					id: "cp_imported",
					name: "Campaign 1",
				},
			} as never);

			await importCampaignToDbCommand(fakeUri);

			expect(importStorageCampaign).toHaveBeenCalledWith({
				body: { campaign: fakeCampaign },
			});
			expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
				expect.stringContaining("Campaign 1"),
			);
		});
	});
});
