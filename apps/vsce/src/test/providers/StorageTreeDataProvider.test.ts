import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as vscode from "vscode";
import {
	getStorageCredentials,
	getStorageTables,
	getStorageVariables,
} from "../../core/api/client";
import { DaemonService } from "../../core/daemon/DaemonService";
import {
	StorageItem,
	StorageTreeDataProvider,
} from "../../providers/StorageTreeDataProvider";

vi.mock("../../core/api/client", () => ({
	getStorageVariables: vi.fn(),
	getStorageCredentials: vi.fn(),
	getStorageTables: vi.fn(),
	client: { setConfig: vi.fn() },
}));

vi.mock("@automa/types/api", () => ({
	getStorageVariables: vi.fn(),
	getStorageCredentials: vi.fn(),
	getStorageTables: vi.fn(),
	client: { setConfig: vi.fn() },
}));

vi.mock("../../core/daemon/DaemonService", () => ({
	DaemonService: {
		isRunning: vi.fn(),
	},
}));

describe("StorageTreeDataProvider", () => {
	let provider: StorageTreeDataProvider;
	let context: vscode.ExtensionContext;

	beforeEach(() => {
		vi.clearAllMocks();
		provider = new StorageTreeDataProvider();
		context = { subscriptions: [] } as unknown as vscode.ExtensionContext;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should register tree view and commands", () => {
		vi.mocked(vscode.window.createTreeView).mockReturnValue({
			dispose: vi.fn(),
		} as unknown as vscode.TreeView<StorageItem>);

		provider.register(context);

		expect(vscode.window.createTreeView).toHaveBeenCalledWith(
			"automa.storage",
			{
				treeDataProvider: provider,
			},
		);
		expect(context.subscriptions.length).toBe(2);
	});

	it("should return offline item if daemon is not running", async () => {
		vi.mocked(DaemonService.isRunning).mockReturnValue(false);

		const children = await provider.getChildren();

		expect(children.length).toBe(1);
		expect(children[0]?.label).toContain("Daemon offline");
	});

	it("should return 3 categories when element is undefined and daemon is running", async () => {
		vi.mocked(DaemonService.isRunning).mockReturnValue(true);

		const children = await provider.getChildren();

		expect(children.length).toBe(3);
		expect(children.map((c) => c.label)).toEqual([
			"Secrets",
			"Variables",
			"Tables",
		]);
	});

	it("should return variables list when category is Variables", async () => {
		vi.mocked(DaemonService.isRunning).mockReturnValue(true);
		vi.mocked(getStorageVariables).mockResolvedValue({
			data: [{ name: "API_HOST", value: "https://api.io" }],
			error: undefined,
		} as unknown as Awaited<ReturnType<typeof getStorageVariables>>);

		const category = new StorageItem(
			"Variables",
			vscode.TreeItemCollapsibleState.Expanded,
			"Category",
			"symbol-variable",
		);

		const children = await provider.getChildren(category);

		expect(children.length).toBe(1);
		expect(children[0]?.label).toBe("API_HOST");
		expect(children[0]?.type).toBe("Variable");
	});

	it("should return credentials list when category is Credentials or Secrets", async () => {
		vi.mocked(DaemonService.isRunning).mockReturnValue(true);
		vi.mocked(getStorageCredentials).mockResolvedValue({
			data: [{ name: "DB_PASS", value: "encrypted-data" }],
			error: undefined,
		} as unknown as Awaited<ReturnType<typeof getStorageCredentials>>);

		const category = new StorageItem(
			"Secrets",
			vscode.TreeItemCollapsibleState.Expanded,
			"Category",
			"lock",
		);

		const children = await provider.getChildren(category);

		expect(children.length).toBe(1);
		expect(children[0]?.label).toBe("DB_PASS");
		expect(children[0]?.type).toBe("Credential");
	});

	it("should return tables list when category is Tables", async () => {
		vi.mocked(DaemonService.isRunning).mockReturnValue(true);
		vi.mocked(getStorageTables).mockResolvedValue({
			data: [{ id: "t1", name: "Users" }],
			error: undefined,
		} as unknown as Awaited<ReturnType<typeof getStorageTables>>);

		const category = new StorageItem(
			"Tables",
			vscode.TreeItemCollapsibleState.Expanded,
			"Category",
			"database",
		);

		const children = await provider.getChildren(category);

		expect(children.length).toBe(1);
		expect(children[0]?.label).toBe("Users");
		expect(children[0]?.type).toBe("Table");
	});

	it("should handle empty data gracefully for categories", async () => {
		vi.mocked(DaemonService.isRunning).mockReturnValue(true);
		vi.mocked(getStorageVariables).mockResolvedValue({
			data: [],
			error: undefined,
		} as unknown as Awaited<ReturnType<typeof getStorageVariables>>);

		const category = new StorageItem(
			"Variables",
			vscode.TreeItemCollapsibleState.Expanded,
			"Category",
			"symbol-variable",
		);

		const children = await provider.getChildren(category);

		expect(children.length).toBe(1);
		expect(children[0]?.label).toBe("No variables");
	});
});
