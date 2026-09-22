import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as vscode from "vscode";
import {
	installBrowserCommand,
	toggleDaemonCommand,
} from "../../commands/systemCommands";
import { installBrowserBinary } from "../../core/api/client";
import { DaemonService } from "../../core/daemon/DaemonService";

vi.mock("../../core/api/client", () => ({
	installBrowserBinary: vi.fn(),
}));

vi.mock("../../core/daemon/DaemonService", () => ({
	DaemonService: {
		isRunning: vi.fn(),
		getPort: vi.fn().mockReturnValue(8765),
		start: vi.fn().mockResolvedValue(undefined),
		stop: vi.fn(),
	},
}));

describe("systemCommands", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("installBrowserCommand should run install via Daemon with progress", async () => {
		vi.mocked(installBrowserBinary).mockResolvedValue({
			data: { message: "Installed Chromium" },
			error: undefined,
		} as unknown as Awaited<ReturnType<typeof installBrowserBinary>>);

		const cmd = installBrowserCommand();
		await cmd();

		expect(vscode.window.withProgress).toHaveBeenCalled();
		expect(installBrowserBinary).toHaveBeenCalledWith({
			baseUrl: "http://127.0.0.1:8765",
		});
		expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
			"Browser installed successfully!",
		);
	});

	it("installBrowserCommand should display error if install fails", async () => {
		vi.mocked(installBrowserBinary).mockResolvedValue({
			data: undefined,
			error: "Download failed",
		} as unknown as Awaited<ReturnType<typeof installBrowserBinary>>);

		const cmd = installBrowserCommand();
		await expect(cmd()).rejects.toThrow();

		expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
			expect.stringContaining("Failed to install browser"),
		);
	});

	it("toggleDaemonCommand should stop daemon if already running", async () => {
		vi.mocked(DaemonService.isRunning).mockReturnValue(true);

		const cmd = toggleDaemonCommand();
		await cmd();

		expect(DaemonService.stop).toHaveBeenCalled();
		expect(DaemonService.start).not.toHaveBeenCalled();
	});

	it("toggleDaemonCommand should start daemon if stopped", async () => {
		vi.mocked(DaemonService.isRunning).mockReturnValue(false);

		const cmd = toggleDaemonCommand();
		await cmd();

		expect(DaemonService.start).toHaveBeenCalled();
		expect(DaemonService.stop).not.toHaveBeenCalled();
	});
});
