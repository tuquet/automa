import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as vscode from "vscode";
import { runCampaignCommand } from "../../commands/runCampaign";
import { executeCampaign } from "../../core/api/client";
import { DaemonService } from "../../core/daemon/DaemonService";
import * as targetResolver from "../../utils/targetResolver";

vi.mock("../../core/api/client", () => ({
	executeCampaign: vi.fn(),
}));

vi.mock("../../core/daemon/DaemonService", () => ({
	DaemonService: {
		isRunning: vi.fn(),
		start: vi.fn().mockResolvedValue(undefined),
		getPort: vi.fn().mockReturnValue(8765),
	},
}));

vi.mock("../../utils/targetResolver", async (importOriginal) => {
	const actual =
		await importOriginal<typeof import("../../utils/targetResolver")>();
	return {
		...actual,
		resolveTarget: vi.fn(),
		resolveEntityTarget: vi.fn(actual.resolveEntityTarget),
	};
});

describe("runCampaignCommand", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should return early if resolveTarget returns null", async () => {
		vi.mocked(targetResolver.resolveTarget).mockResolvedValue(null);

		await runCampaignCommand();

		expect(executeCampaign).not.toHaveBeenCalled();
	});

	it("should start daemon if daemon is not running", async () => {
		vi.mocked(targetResolver.resolveTarget).mockResolvedValue({
			targetPath: "/workspace/test.campaigns.json",
			displayName: "test.campaigns.json",
		});
		vi.mocked(DaemonService.isRunning).mockReturnValue(false);
		vi.mocked(executeCampaign).mockResolvedValue({
			data: { campaignId: "camp-12345", allocatedSlots: [] },
			error: undefined,
		} as unknown as Awaited<ReturnType<typeof executeCampaign>>);

		await runCampaignCommand();

		expect(DaemonService.start).toHaveBeenCalled();
		expect(executeCampaign).toHaveBeenCalled();
	});

	it("should execute campaign successfully when daemon is running", async () => {
		vi.mocked(targetResolver.resolveTarget).mockResolvedValue({
			targetPath: "/workspace/test.campaigns.json",
			displayName: "test.campaigns.json",
		});
		vi.mocked(DaemonService.isRunning).mockReturnValue(true);
		vi.mocked(executeCampaign).mockResolvedValue({
			data: { campaignId: "camp-12345", allocatedSlots: [] },
			error: undefined,
		} as unknown as Awaited<ReturnType<typeof executeCampaign>>);

		await runCampaignCommand();

		expect(executeCampaign).toHaveBeenCalledWith({
			body: expect.objectContaining({
				campaignPath: "/workspace/test.campaigns.json",
				runNow: true,
			}),
		});
		expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
			expect.stringContaining("camp-12345"),
		);
	});

	it("should handle error when executeCampaign fails", async () => {
		vi.mocked(targetResolver.resolveTarget).mockResolvedValue({
			targetPath: "/workspace/test.campaigns.json",
			displayName: "test.campaigns.json",
		});
		vi.mocked(DaemonService.isRunning).mockReturnValue(true);
		vi.mocked(executeCampaign).mockResolvedValue({
			data: undefined,
			error: { message: "Internal server error" },
		} as unknown as Awaited<ReturnType<typeof executeCampaign>>);

		await runCampaignCommand();

		expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
			expect.stringContaining("Failed to start campaign"),
		);
	});
});
