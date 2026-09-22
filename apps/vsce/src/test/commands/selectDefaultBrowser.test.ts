import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as vscode from "vscode";
import { selectDefaultBrowserCommand } from "../../commands/selectDefaultBrowser";
import { getBrowsers } from "../../core/api/client";
import { DaemonService } from "../../core/daemon/DaemonService";

vi.mock("../../core/api/client", () => ({
	getBrowsers: vi.fn(),
	patchAppSettings: vi.fn().mockResolvedValue({ data: {} }),
}));

vi.mock("../../core/daemon/DaemonService", () => ({
	DaemonService: {
		isRunning: vi.fn(),
		start: vi.fn().mockResolvedValue(undefined),
	},
}));

describe("selectDefaultBrowserCommand", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should auto-start daemon if daemon is not running", async () => {
		vi.mocked(DaemonService.isRunning).mockReturnValue(false);
		vi.mocked(getBrowsers).mockResolvedValue({
			data: [],
		} as unknown as Awaited<ReturnType<typeof getBrowsers>>);

		await selectDefaultBrowserCommand();

		expect(DaemonService.start).toHaveBeenCalled();
		expect(getBrowsers).toHaveBeenCalled();
	});

	it("should display browser options and update configuration when selected", async () => {
		vi.mocked(DaemonService.isRunning).mockReturnValue(true);
		vi.mocked(getBrowsers).mockResolvedValue({
			data: [{ id: "p1", name: "Chrome Work" }],
		} as unknown as Awaited<ReturnType<typeof getBrowsers>>);

		const mockUpdate = vi.fn().mockResolvedValue(undefined);
		const mockGet = vi.fn().mockReturnValue("daemon_worker");
		vi.mocked(vscode.workspace.getConfiguration).mockReturnValue({
			get: mockGet,
			update: mockUpdate,
		} as unknown as vscode.WorkspaceConfiguration);

		vi.mocked(vscode.window.showQuickPick).mockResolvedValue({
			label: "Chrome Work",
			description: "p1",
		} as unknown as vscode.QuickPickItem);

		await selectDefaultBrowserCommand();

		expect(vscode.window.showQuickPick).toHaveBeenCalled();
		expect(mockUpdate).toHaveBeenCalledWith(
			"defaultBrowser",
			"p1",
			vscode.ConfigurationTarget.Global,
		);
		expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
			expect.stringContaining("Default Browser set to: Chrome Work"),
		);
	});

	it("should handle error when fetching browsers fails", async () => {
		vi.mocked(DaemonService.isRunning).mockReturnValue(true);
		vi.mocked(getBrowsers).mockRejectedValue(new Error("Network disconnect"));

		await selectDefaultBrowserCommand();

		expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
			expect.stringContaining("Failed to load browsers: Network disconnect"),
		);
	});
});
