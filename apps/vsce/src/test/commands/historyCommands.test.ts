import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as vscode from "vscode";
import {
	clearHistoryCommand,
	deleteHistoryItemCommand,
	showJobHistoryCommand,
} from "../../commands/historyCommands";
import {
	clearAllJobHistory,
	deleteJobHistoryItem,
	getJobExecutionLogs,
	getJobHistory,
} from "../../core/api/client";
import { DaemonService } from "../../core/daemon/DaemonService";
import { Logger } from "../../core/Logger";

vi.mock("../../core/api/client", () => ({
	clearAllJobHistory: vi.fn(),
	deleteJobHistoryItem: vi.fn(),
	getJobExecutionLogs: vi.fn(),
	getJobHistory: vi.fn(),
}));

vi.mock("../../core/daemon/DaemonService", () => ({
	DaemonService: {
		isRunning: vi.fn(),
		getPort: vi.fn().mockReturnValue(8765),
	},
}));

vi.mock("../../core/Logger", () => ({
	Logger: {
		getOutputChannel: vi.fn(),
	},
}));

describe("historyCommands", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(DaemonService.isRunning).mockReturnValue(true);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe("clearHistoryCommand", () => {
		it("should clear history when user confirms", async () => {
			vi.mocked(vscode.window.showWarningMessage).mockResolvedValueOnce(
				"Yes" as unknown as vscode.MessageItem,
			);
			vi.mocked(clearAllJobHistory).mockResolvedValueOnce({
				data: undefined,
				error: undefined,
			} as unknown as Awaited<ReturnType<typeof clearAllJobHistory>>);

			await clearHistoryCommand();

			expect(clearAllJobHistory).toHaveBeenCalled();
			expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
				"automa.refreshLogs",
			);
			expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
				"History cleared successfully.",
			);
		});

		it("should do nothing when user cancels confirmation", async () => {
			vi.mocked(vscode.window.showWarningMessage).mockResolvedValueOnce(
				"No" as unknown as vscode.MessageItem,
			);

			await clearHistoryCommand();

			expect(clearAllJobHistory).not.toHaveBeenCalled();
		});
	});

	describe("deleteHistoryItemCommand", () => {
		it("should delete job history item when confirmed", async () => {
			vi.mocked(vscode.window.showWarningMessage).mockResolvedValueOnce(
				"Yes" as unknown as vscode.MessageItem,
			);
			vi.mocked(deleteJobHistoryItem).mockResolvedValueOnce({
				data: undefined,
				error: undefined,
			} as unknown as Awaited<ReturnType<typeof deleteJobHistoryItem>>);

			await deleteHistoryItemCommand({ jobId: "job_99" });

			expect(deleteJobHistoryItem).toHaveBeenCalledWith({
				path: { job_id: "job_99" },
			});
			expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
				"History item job_99 deleted successfully.",
			);
		});
	});

	describe("showJobHistoryCommand", () => {
		it("should warn if daemon is offline", async () => {
			vi.mocked(DaemonService.isRunning).mockReturnValue(false);

			await showJobHistoryCommand();

			expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
				"Daemon is offline. Cannot load job history.",
			);
			expect(getJobHistory).not.toHaveBeenCalled();
		});

		it("should display QuickPick and fetch logs when user selects view logs", async () => {
			vi.mocked(DaemonService.isRunning).mockReturnValue(true);
			vi.mocked(getJobHistory).mockResolvedValueOnce({
				data: [
					{
						id: "job_101",
						name: "Login Test",
						status: "completed",
						createdAt: "2026-09-08T10:00:00Z",
						updatedAt: "2026-09-08T10:00:02Z",
					},
				],
				error: undefined,
			} as unknown as Awaited<ReturnType<typeof getJobHistory>>);

			vi.mocked(vscode.window.showQuickPick)
				.mockResolvedValueOnce({
					label: "$(pass-filled) Login Test",
					description: "COMPLETED • 2.0s",
					jobId: "job_101",
				} as unknown as vscode.QuickPickItem)
				.mockResolvedValueOnce({
					label: "$(output) View Step Logs",
					action: "logs",
				} as unknown as vscode.QuickPickItem);

			vi.mocked(getJobExecutionLogs).mockResolvedValueOnce({
				data: {
					logs: [
						{
							message: "Step 1 passed",
							level: "info",
							timestamp: "10:00:01",
						},
					],
				},
				error: undefined,
			} as unknown as Awaited<ReturnType<typeof getJobExecutionLogs>>);

			const mockOutputChannel = {
				clear: vi.fn(),
				show: vi.fn(),
				appendLine: vi.fn(),
			};
			vi.mocked(Logger.getOutputChannel).mockReturnValue(
				mockOutputChannel as unknown as vscode.OutputChannel,
			);

			await showJobHistoryCommand();

			expect(getJobHistory).toHaveBeenCalledWith({ query: { limit: 50 } });
			expect(getJobExecutionLogs).toHaveBeenCalledWith({
				path: { job_id: "job_101" },
			});
			expect(mockOutputChannel.clear).toHaveBeenCalled();
			expect(mockOutputChannel.show).toHaveBeenCalledWith(true);
			expect(mockOutputChannel.appendLine).toHaveBeenCalledWith(
				expect.stringContaining("Step 1 passed"),
			);
		});
	});
});
