import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as vscode from "vscode";
import { AutomaFilesProvider } from "../../providers/AutomaFilesProvider";
import { WorkspaceTreeDataProvider } from "../../providers/WorkspaceTreeDataProvider";

vi.mock("../../core/daemon/DaemonService", () => ({
	DaemonService: {
		isRunning: vi.fn().mockReturnValue(true),
	},
}));

vi.mock("../../core/api/client", () => ({
	getStorageWorkflows: vi.fn().mockResolvedValue({ data: [] }),
	getStorageCampaigns: vi.fn().mockResolvedValue({ data: [] }),
}));

describe("WorkspaceTreeDataProvider", () => {
	let workflowsProvider: AutomaFilesProvider;
	let campaignsProvider: AutomaFilesProvider;
	let packagesProvider: AutomaFilesProvider;
	let workspaceProvider: WorkspaceTreeDataProvider;
	let context: vscode.ExtensionContext;

	beforeEach(() => {
		vi.clearAllMocks();
		context = { subscriptions: [] } as unknown as vscode.ExtensionContext;

		workflowsProvider = new AutomaFilesProvider(
			"play-circle",
			"automa.workflows",
			"workflow",
		);
		campaignsProvider = new AutomaFilesProvider(
			"rocket",
			"automa.campaigns",
			"campaign",
		);
		packagesProvider = new AutomaFilesProvider(
			"package",
			"automa.packages",
			"package",
		);

		workspaceProvider = new WorkspaceTreeDataProvider(
			workflowsProvider,
			campaignsProvider,
			packagesProvider,
		);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should register workspace tree view and refresh command", () => {
		vi.mocked(vscode.window.createTreeView).mockReturnValue({
			dispose: vi.fn(),
		} as unknown as vscode.TreeView<vscode.TreeItem>);

		workspaceProvider.register(context);

		expect(vscode.window.createTreeView).toHaveBeenCalledWith(
			"automa.workspace",
			{
				treeDataProvider: workspaceProvider,
			},
		);
		expect(context.subscriptions.length).toBe(2);
	});

	it("should return 3 root categories with concise labels and badges", async () => {
		const roots = await workspaceProvider.getChildren();

		expect(roots.length).toBe(3);
		expect(roots[0]?.label).toContain("Workflows");
		expect(roots[1]?.label).toContain("Campaigns");
		expect(roots[2]?.label).toContain("Packages");
	});

	it("should delegate getChildren for root nodes", async () => {
		const roots = await workspaceProvider.getChildren();
		const workflowsRoot = roots[0];
		const campaignsRoot = roots[1];
		const packagesRoot = roots[2];

		const workflowsSpy = vi
			.spyOn(workflowsProvider, "getChildren")
			.mockResolvedValue([]);
		const campaignsSpy = vi
			.spyOn(campaignsProvider, "getChildren")
			.mockResolvedValue([]);
		const packagesSpy = vi
			.spyOn(packagesProvider, "getChildren")
			.mockResolvedValue([]);

		if (workflowsRoot) await workspaceProvider.getChildren(workflowsRoot);
		expect(workflowsSpy).toHaveBeenCalled();

		if (campaignsRoot) await workspaceProvider.getChildren(campaignsRoot);
		expect(campaignsSpy).toHaveBeenCalled();

		if (packagesRoot) await workspaceProvider.getChildren(packagesRoot);
		expect(packagesSpy).toHaveBeenCalled();
	});

	it("should return emptyItem with automaEmptyItem contextValue when no entities exist", async () => {
		workflowsProvider.refresh();
		// Wait for async fetchData
		await new Promise((resolve) => setTimeout(resolve, 50));

		const items = await workflowsProvider.getChildren();
		expect(items.length).toBe(1);
		expect(items[0]?.label).toBe("No workflows");
		expect(items[0]?.contextValue).toBe("automaEmptyItem");
	});

	it("should reload all child providers on refreshAsync", async () => {
		const wfSpy = vi
			.spyOn(workflowsProvider, "refreshAsync")
			.mockResolvedValue(undefined);
		const cpSpy = vi
			.spyOn(campaignsProvider, "refreshAsync")
			.mockResolvedValue(undefined);
		const pkgSpy = vi
			.spyOn(packagesProvider, "refreshAsync")
			.mockResolvedValue(undefined);

		await workspaceProvider.refreshAsync();

		expect(wfSpy).toHaveBeenCalled();
		expect(cpSpy).toHaveBeenCalled();
		expect(pkgSpy).toHaveBeenCalled();
	});
});
