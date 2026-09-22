import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as vscode from "vscode";
import { getBrowsers } from "../../core/api/client";
import { DAEMON_EVENTS, VIEW_TYPES } from "../../core/constants";
import { DaemonService } from "../../core/daemon/DaemonService";
import { globalEvents } from "../../core/daemon/GlobalSseListener";
import {
	BrowsersTreeDataProvider,
	BrowserTreeItem,
} from "../../providers/BrowsersTreeDataProvider";

vi.mock("../../core/api/client", () => ({
	getBrowsers: vi.fn(),
	client: { setConfig: vi.fn() },
}));

vi.mock("@automa/types/api", () => ({
	getBrowsers: vi.fn(),
	client: { setConfig: vi.fn() },
}));

vi.mock("../../core/daemon/DaemonService", () => ({
	DaemonService: {
		isRunning: vi.fn(),
	},
}));

describe("BrowsersTreeDataProvider", () => {
	let provider: BrowsersTreeDataProvider;
	let context: vscode.ExtensionContext;

	beforeEach(() => {
		vi.clearAllMocks();
		provider = new BrowsersTreeDataProvider();
		context = { subscriptions: [] } as unknown as vscode.ExtensionContext;
	});

	afterEach(() => {
		provider.dispose();
		vi.restoreAllMocks();
	});

	it("should register tree view and refresh command", () => {
		vi.mocked(vscode.window.createTreeView).mockReturnValue({
			dispose: vi.fn(),
		} as unknown as vscode.TreeView<BrowserTreeItem>);

		provider.register(context);

		expect(vscode.window.createTreeView).toHaveBeenCalledWith(
			VIEW_TYPES.BROWSERS_VIEW,
			{
				treeDataProvider: provider,
			},
		);
		expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
			"automa.refreshBrowsers",
			expect.any(Function),
		);
		expect(context.subscriptions.length).toBe(2);
	});

	it("should return empty list when element is provided (flat hierarchy)", async () => {
		const dummyItem = new BrowserTreeItem(
			{
				id: "b1",
				name: "Profile 1",
				isOnline: false,
				createdAt: "2026-01-01",
				updatedAt: "2026-01-01",
			},
			false,
		);

		const children = await provider.getChildren(dummyItem);
		expect(children).toEqual([]);
	});

	it("should return empty list when DaemonService is not running", async () => {
		vi.mocked(DaemonService.isRunning).mockReturnValue(false);

		const children = await provider.getChildren();
		expect(children).toEqual([]);
		expect(getBrowsers).not.toHaveBeenCalled();
	});

	it("should return browser items when DaemonService is running", async () => {
		vi.mocked(DaemonService.isRunning).mockReturnValue(true);
		vi.mocked(getBrowsers).mockResolvedValue({
			data: [
				{
					id: "chrome-1",
					name: "Chrome AntiDetect 1",
					isOnline: true,
					timezone: "Asia/Ho_Chi_Minh",
					userAgent: "Mozilla/5.0 Chrome/120.0",
					createdAt: "2026-01-01",
					updatedAt: "2026-01-01",
				},
				{
					id: "chrome-2",
					name: "Chrome Offline",
					isOnline: false,
					createdAt: "2026-01-01",
					updatedAt: "2026-01-01",
				},
			],
			error: undefined,
		} as unknown as Awaited<ReturnType<typeof getBrowsers>>);

		const children = await provider.getChildren();
		expect(children.length).toBe(2);

		const first = children[0];
		const second = children[1];
		expect(first).toBeDefined();
		expect(second).toBeDefined();
		if (!first || !second) return;

		expect(first.label).toBe("Chrome AntiDetect 1");
		expect(first.description).toBe("Online");
		expect(first.contextValue).toBe("automaBrowserItem-online");
		expect(first.id).toBe("chrome-1");

		expect(second.label).toBe("Chrome Offline");
		expect(second.description).toBe("Offline");
		expect(second.contextValue).toBe("automaBrowserItem-offline");
		expect(second.id).toBe("chrome-2");
	});

	it("should handle API errors gracefully by returning empty list", async () => {
		vi.mocked(DaemonService.isRunning).mockReturnValue(true);
		vi.mocked(getBrowsers).mockRejectedValue(
			new Error("Network connection failed"),
		);

		const children = await provider.getChildren();
		expect(children).toEqual([]);
	});

	it("should refresh when daemon globalEvents fire", () => {
		const refreshSpy = vi.spyOn(provider, "refresh");

		globalEvents.emit(DAEMON_EVENTS.BROWSER_STATUS_CHANGED);
		expect(refreshSpy).toHaveBeenCalledTimes(1);

		globalEvents.emit(DAEMON_EVENTS.READY);
		expect(refreshSpy).toHaveBeenCalledTimes(2);

		globalEvents.emit(DAEMON_EVENTS.STOPPED);
		expect(refreshSpy).toHaveBeenCalledTimes(3);

		globalEvents.emit(DAEMON_EVENTS.JOB_STATUS_CHANGED);
		expect(refreshSpy).toHaveBeenCalledTimes(4);
	});
});
