import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as vscode from "vscode";
import { stopCampaignCommand } from "../../commands/stopCampaign";
import { abortCampaign, getStorageCampaigns } from "../../core/api/client";
import { DaemonService } from "../../core/daemon/DaemonService";

vi.mock("../../core/api/client", () => ({
	abortCampaign: vi.fn(),
	getStorageCampaigns: vi.fn(),
}));

vi.mock("../../core/daemon/DaemonService", () => ({
	DaemonService: {
		isRunning: vi.fn(),
		start: vi.fn().mockResolvedValue(undefined),
		getPort: vi.fn().mockReturnValue(8765),
	},
}));

describe("stopCampaignCommand", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(DaemonService.isRunning).mockReturnValue(true);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should warn if daemon is offline", async () => {
		vi.mocked(DaemonService.isRunning).mockReturnValue(false);

		await stopCampaignCommand();

		expect(vscode.window.showWarningMessage).toHaveBeenCalledWith(
			"Daemon is offline. Cannot stop campaign.",
		);
		expect(abortCampaign).not.toHaveBeenCalled();
	});

	it("should abort campaign when resolved from target object", async () => {
		vi.mocked(abortCampaign).mockResolvedValueOnce({
			data: undefined,
		} as unknown as Awaited<ReturnType<typeof abortCampaign>>);

		await stopCampaignCommand({
			element: { id: "camp-123", name: "Daily Campaign" },
		});

		expect(abortCampaign).toHaveBeenCalledWith({
			path: { id: "camp-123" },
		});
		expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
			'Campaign "Daily Campaign" stopped successfully.',
		);
		expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
			"automa.refreshWorkspace",
		);
	});

	it("should prompt with quickpick if no target passed and campaigns exist", async () => {
		vi.mocked(getStorageCampaigns).mockResolvedValueOnce({
			data: [
				{ id: "camp-1", name: "Campaign One" },
				{ id: "camp-2", name: "Campaign Two" },
			],
		} as unknown as Awaited<ReturnType<typeof getStorageCampaigns>>);

		vi.mocked(vscode.window.showQuickPick).mockResolvedValueOnce({
			label: "Campaign One",
			description: "camp-1",
		} as unknown as vscode.QuickPickItem);

		vi.mocked(abortCampaign).mockResolvedValueOnce({
			data: undefined,
		} as unknown as Awaited<ReturnType<typeof abortCampaign>>);

		await stopCampaignCommand();

		expect(abortCampaign).toHaveBeenCalledWith({
			path: { id: "camp-1" },
		});
		expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
			'Campaign "Campaign One" stopped successfully.',
		);
	});

	it("should show error message if abortCampaign API returns error", async () => {
		vi.mocked(abortCampaign).mockResolvedValueOnce({
			error: { message: "Campaign not found" },
		} as unknown as Awaited<ReturnType<typeof abortCampaign>>);

		await stopCampaignCommand({ element: { id: "non-existent" } });

		expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
			expect.stringContaining("Campaign not found"),
		);
	});
});
