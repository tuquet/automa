import * as fs from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as vscode from "vscode";
import {
	importBrowsersFromCsvCommand,
	sideloadExtensionCommand,
} from "../../commands/browserCommands";
import {
	importBrowsersCsv,
	sideloadBrowserExtension,
} from "../../core/api/client";
import { DaemonService } from "../../core/daemon/DaemonService";

vi.mock("node:fs/promises", () => ({
	readFile: vi.fn(),
}));

vi.mock("../../core/api/client", () => ({
	createBrowser: vi.fn(),
	deleteBrowser: vi.fn(),
	getBrowserDetail: vi.fn(),
	getBrowsers: vi.fn(),
	importBrowsersCsv: vi.fn(),
	killAllBrowsers: vi.fn(),
	sideloadBrowserExtension: vi.fn(),
	startBrowser: vi.fn(),
	stopBrowserSession: vi.fn(),
	submitJob: vi.fn(),
}));

vi.mock("../../core/daemon/DaemonService", () => ({
	DaemonService: {
		isRunning: vi.fn(),
		getPort: vi.fn().mockReturnValue(8765),
		start: vi.fn(),
	},
}));

describe("browserCommands", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("importBrowsersFromCsvCommand should read file and call API", async () => {
		vi.mocked(vscode.window.showOpenDialog).mockResolvedValueOnce([
			vscode.Uri.file("/path/to/browsers.csv"),
		]);
		vi.mocked(DaemonService.isRunning).mockReturnValue(true);
		vi.mocked(fs.readFile).mockResolvedValueOnce(
			"id,name\nb1,Chrome 1" as unknown as Buffer,
		);
		vi.mocked(importBrowsersCsv).mockResolvedValueOnce({
			data: { count: 1 },
			error: undefined,
		} as unknown as Awaited<ReturnType<typeof importBrowsersCsv>>);

		await importBrowsersFromCsvCommand();

		expect(fs.readFile).toHaveBeenCalledWith(
			expect.stringContaining("browsers.csv"),
			"utf-8",
		);
		expect(importBrowsersCsv).toHaveBeenCalledWith({
			baseUrl: "http://127.0.0.1:8765",
			body: { csv_string: "id,name\nb1,Chrome 1" },
		});
		expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
			"automa.refreshBrowsers",
		);
	});

	it("sideloadExtensionCommand should prompt for folder and sideload into profile", async () => {
		vi.mocked(DaemonService.isRunning).mockReturnValue(true);
		vi.mocked(vscode.window.showOpenDialog).mockResolvedValueOnce([
			vscode.Uri.file("/path/to/extension-dir"),
		]);
		vi.mocked(sideloadBrowserExtension).mockResolvedValueOnce({
			data: { success: true },
			error: undefined,
		} as unknown as Awaited<ReturnType<typeof sideloadBrowserExtension>>);

		await sideloadExtensionCommand({ id: "profile-1" });

		expect(sideloadBrowserExtension).toHaveBeenCalledWith({
			baseUrl: "http://127.0.0.1:8765",
			path: { id: "profile-1" },
			body: { extension_path: expect.stringContaining("extension-dir") },
		});
		expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
			"automa.refreshBrowsers",
		);
	});

	it("launchBrowserCommand should call startBrowser API when id is provided", async () => {
		const { launchBrowserCommand } = await import(
			"../../commands/browserCommands"
		);
		const { startBrowser } = await import("../../core/api/client");
		await launchBrowserCommand({ id: "b_123" });

		expect(startBrowser).toHaveBeenCalledWith({ path: { id: "b_123" } });
		expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
			"Browser 'b_123' launched.",
		);
	});

	it("launchBrowserCommand should prompt quickpick when no id is provided", async () => {
		const { launchBrowserCommand } = await import(
			"../../commands/browserCommands"
		);
		const { getBrowsers, startBrowser } = await import("../../core/api/client");
		vi.mocked(getBrowsers).mockResolvedValueOnce({
			data: [
				{
					id: "b_qp",
					name: "QuickPick Profile",
					isOnline: false,
					createdAt: "2026-09-08T10:00:00Z",
					updatedAt: "2026-09-08T10:00:00Z",
				},
			],
			error: undefined,
		} as unknown as Awaited<ReturnType<typeof getBrowsers>>);
		vi.mocked(vscode.window.showQuickPick).mockResolvedValueOnce({
			label: "QuickPick Profile",
			browserId: "b_qp",
		} as unknown as vscode.QuickPickItem);

		await launchBrowserCommand();

		expect(startBrowser).toHaveBeenCalledWith({ path: { id: "b_qp" } });
		expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
			"Browser 'b_qp' launched.",
		);
	});

	it("stopBrowserCommand should call stopBrowserSession API when id is provided", async () => {
		const { stopBrowserCommand } = await import(
			"../../commands/browserCommands"
		);
		const { stopBrowserSession } = await import("../../core/api/client");
		await stopBrowserCommand({ id: "b_123" });

		expect(stopBrowserSession).toHaveBeenCalledWith({ path: { id: "b_123" } });
		expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
			"Browser 'b_123' stopped.",
		);
	});

	it("deleteBrowserCommand should confirm and call deleteBrowser API", async () => {
		const { deleteBrowserCommand } = await import(
			"../../commands/browserCommands"
		);
		const { deleteBrowser } = await import("../../core/api/client");
		vi.mocked(vscode.window.showWarningMessage).mockResolvedValueOnce(
			"Yes" as unknown as vscode.MessageItem,
		);

		await deleteBrowserCommand({ id: "b_del" });

		expect(deleteBrowser).toHaveBeenCalledWith({ path: { id: "b_del" } });
		expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
			"Browser 'b_del' profile deleted.",
		);
	});

	it("killAllBrowsersCommand should prompt confirmation and call killAllBrowsers", async () => {
		const { killAllBrowsersCommand } = await import(
			"../../commands/browserCommands"
		);
		const { killAllBrowsers } = await import("../../core/api/client");
		vi.mocked(vscode.window.showWarningMessage).mockResolvedValueOnce(
			"Yes" as unknown as vscode.MessageItem,
		);

		await killAllBrowsersCommand();

		expect(killAllBrowsers).toHaveBeenCalled();
		expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
			"All browser sessions terminated.",
		);
	});
});
