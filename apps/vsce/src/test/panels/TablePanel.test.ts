import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as vscode from "vscode";
import { addStorageTableRow, getStorageTableRows } from "../../core/api/client";
import { TablePanel } from "../../panels/TablePanel";
import { StorageItem } from "../../providers/StorageTreeDataProvider";

vi.mock("../../core/api/client", () => ({
	getStorageTableRows: vi.fn(),
	addStorageTableRow: vi.fn(),
}));

describe("TablePanel", () => {
	let context: vscode.ExtensionContext;
	let tableItem: StorageItem;

	beforeEach(() => {
		vi.clearAllMocks();
		TablePanel.currentPanels.clear();
		context = {
			extensionUri: vscode.Uri.file("/extension/path"),
			subscriptions: [],
		} as unknown as vscode.ExtensionContext;

		tableItem = new StorageItem(
			"Users",
			vscode.TreeItemCollapsibleState.None,
			"Table",
			"database",
			undefined,
			undefined,
			"tbl-123",
		);
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should create a webview panel when show is called", async () => {
		const mockPostMessage = vi.fn();
		const mockOnDidReceiveMessage = vi.fn();
		const mockPanel = {
			webview: {
				html: "",
				postMessage: mockPostMessage,
				onDidReceiveMessage: mockOnDidReceiveMessage,
			},
			reveal: vi.fn(),
			onDidDispose: vi.fn(),
			dispose: vi.fn(),
		};

		vi.mocked(vscode.window.createWebviewPanel).mockReturnValue(
			mockPanel as unknown as vscode.WebviewPanel,
		);

		await TablePanel.show(context, tableItem);

		expect(vscode.window.createWebviewPanel).toHaveBeenCalledWith(
			"automa.tablePanel",
			"Table: Users",
			vscode.ViewColumn.One,
			expect.any(Object),
		);
	});

	it("should reveal existing panel when opening the same table twice", async () => {
		const mockPanel = {
			webview: { html: "", postMessage: vi.fn(), onDidReceiveMessage: vi.fn() },
			reveal: vi.fn(),
			onDidDispose: vi.fn(),
			dispose: vi.fn(),
		};

		vi.mocked(vscode.window.createWebviewPanel).mockReturnValue(
			mockPanel as unknown as vscode.WebviewPanel,
		);

		await TablePanel.show(context, tableItem);
		await TablePanel.show(context, tableItem);

		expect(vscode.window.createWebviewPanel).toHaveBeenCalledTimes(1);
		expect(mockPanel.reveal).toHaveBeenCalledWith(vscode.ViewColumn.One);
	});

	it("should handle getTableRows message and post data back", async () => {
		const mockPostMessage = vi.fn();
		let messageHandler:
			| ((msg: Record<string, unknown>) => Promise<void>)
			| undefined;

		const mockPanel = {
			webview: {
				html: "",
				postMessage: mockPostMessage,
				onDidReceiveMessage: vi.fn().mockImplementation((cb) => {
					messageHandler = cb;
				}),
			},
			reveal: vi.fn(),
			onDidDispose: vi.fn(),
			dispose: vi.fn(),
		};

		vi.mocked(vscode.window.createWebviewPanel).mockReturnValue(
			mockPanel as unknown as vscode.WebviewPanel,
		);

		vi.mocked(getStorageTableRows).mockResolvedValue({
			data: [{ id: 1, name: "Alice" }],
			error: undefined,
		} as unknown as Awaited<ReturnType<typeof getStorageTableRows>>);

		await TablePanel.show(context, tableItem);

		expect(messageHandler).toBeDefined();
		if (messageHandler) {
			await messageHandler({ type: "getTableRows", query: "" });
			expect(getStorageTableRows).toHaveBeenCalledWith({
				path: { id: "tbl-123" },
				query: { search: undefined },
			});
			expect(mockPostMessage).toHaveBeenCalledWith({
				type: "tableRowsData",
				data: [{ id: 1, name: "Alice" }],
			});
		}
	});

	it("should handle addTableRow message, call API, and refresh rows", async () => {
		const mockPostMessage = vi.fn();
		let messageHandler:
			| ((msg: Record<string, unknown>) => Promise<void>)
			| undefined;

		const mockPanel = {
			webview: {
				html: "",
				postMessage: mockPostMessage,
				onDidReceiveMessage: vi.fn().mockImplementation((cb) => {
					messageHandler = cb;
				}),
			},
			reveal: vi.fn(),
			onDidDispose: vi.fn(),
			dispose: vi.fn(),
		};

		vi.mocked(vscode.window.createWebviewPanel).mockReturnValue(
			mockPanel as unknown as vscode.WebviewPanel,
		);

		vi.mocked(addStorageTableRow).mockResolvedValue({
			data: { success: true },
			error: undefined,
		} as unknown as Awaited<ReturnType<typeof addStorageTableRow>>);

		vi.mocked(getStorageTableRows).mockResolvedValue({
			data: [{ id: 1, name: "Bob" }],
			error: undefined,
		} as unknown as Awaited<ReturnType<typeof getStorageTableRows>>);

		await TablePanel.show(context, tableItem);

		if (messageHandler) {
			await messageHandler({
				type: "addTableRow",
				data: { name: "Bob" },
			});

			expect(addStorageTableRow).toHaveBeenCalledWith({
				path: { id: "tbl-123" },
				body: { name: "Bob" },
			});
			expect(mockPostMessage).toHaveBeenCalledWith({
				type: "tableRowsData",
				data: [{ id: 1, name: "Bob" }],
			});
		}
	});
});
