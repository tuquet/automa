import { beforeEach, describe, expect, it, vi } from "vitest";
import * as client from "../../../core/api/client";
import {
	TableDataService,
	type TableIpcMessage,
} from "../../../core/services/storage/TableDataService";

vi.mock("../../../core/api/client", () => ({
	getStorageTableRows: vi.fn(),
	addStorageTableRow: vi.fn(),
}));

vi.mock("vscode", () => ({
	window: {
		showInformationMessage: vi.fn(),
		showErrorMessage: vi.fn(),
	},
}));

describe("TableDataService", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("fetchTableRows", () => {
		it("should return all rows when query is empty", async () => {
			const mockRows = [
				{ id: "1", name: "Alice", email: "alice@example.com" },
				{ id: "2", name: "Bob", email: "bob@example.com" },
			];
			vi.mocked(client.getStorageTableRows).mockResolvedValueOnce({
				data: mockRows,
			} as unknown as Awaited<ReturnType<typeof client.getStorageTableRows>>);

			const rows = await TableDataService.fetchTableRows("users");
			expect(rows).toEqual(mockRows);
			expect(client.getStorageTableRows).toHaveBeenCalledWith({
				path: { id: "users" },
				query: { search: undefined },
			});
		});

		it("should filter rows by query string via API search query", async () => {
			const mockFilteredRows = [
				{ id: "1", name: "Alice", email: "alice@example.com" },
			];
			vi.mocked(client.getStorageTableRows).mockResolvedValueOnce({
				data: mockFilteredRows,
			} as unknown as Awaited<ReturnType<typeof client.getStorageTableRows>>);

			const rows = await TableDataService.fetchTableRows("users", "alice");
			expect(client.getStorageTableRows).toHaveBeenCalledWith({
				path: { id: "users" },
				query: { search: "alice" },
			});
			expect(rows).toEqual(mockFilteredRows);
		});
	});

	describe("addTableRow", () => {
		it("should add row and return updated rows", async () => {
			vi.mocked(client.addStorageTableRow).mockResolvedValueOnce({
				data: { success: true },
			} as unknown as Awaited<ReturnType<typeof client.addStorageTableRow>>);
			vi.mocked(client.getStorageTableRows).mockResolvedValueOnce({
				data: [{ id: "1", key: "new_row" }],
			} as unknown as Awaited<ReturnType<typeof client.getStorageTableRows>>);

			const result = await TableDataService.addTableRow("config", {
				key: "new_row",
			});
			expect(client.addStorageTableRow).toHaveBeenCalledWith({
				path: { id: "config" },
				body: { key: "new_row" },
			});
			expect(result).toHaveLength(1);
		});

		it("should throw error if API fails", async () => {
			vi.mocked(client.addStorageTableRow).mockResolvedValueOnce({
				error: { message: "Unique constraint failed" },
			} as unknown as Awaited<ReturnType<typeof client.addStorageTableRow>>);

			await expect(
				TableDataService.addTableRow("config", { key: "duplicate" }),
			).rejects.toThrow("Unique constraint failed");
		});
	});

	describe("handleWebviewMessage", () => {
		it("should handle getTableRows and post message back to webview", async () => {
			const mockRows = [{ id: "1", title: "Task 1" }];
			vi.mocked(client.getStorageTableRows).mockResolvedValueOnce({
				data: mockRows,
			} as unknown as Awaited<ReturnType<typeof client.getStorageTableRows>>);

			const postMessage = vi.fn();
			const msg: TableIpcMessage = { type: "getTableRows", query: "" };

			await TableDataService.handleWebviewMessage("tasks", msg, postMessage);

			expect(postMessage).toHaveBeenCalledWith({
				type: "tableRowsData",
				data: mockRows,
			});
		});

		it("should handle addTableRow and post updated rows back to webview", async () => {
			const mockRows = [{ id: "1", title: "Task 1" }];
			vi.mocked(client.addStorageTableRow).mockResolvedValueOnce({
				data: { success: true },
			} as unknown as Awaited<ReturnType<typeof client.addStorageTableRow>>);
			vi.mocked(client.getStorageTableRows).mockResolvedValueOnce({
				data: mockRows,
			} as unknown as Awaited<ReturnType<typeof client.getStorageTableRows>>);

			const postMessage = vi.fn();
			const msg: TableIpcMessage = {
				command: "addTableRow",
				data: { title: "Task 1" },
			};

			await TableDataService.handleWebviewMessage("tasks", msg, postMessage);

			expect(postMessage).toHaveBeenCalledWith({
				type: "tableRowsData",
				data: mockRows,
			});
		});

		it("should ignore empty tableId", async () => {
			const postMessage = vi.fn();
			const msg: TableIpcMessage = { type: "getTableRows" };

			await TableDataService.handleWebviewMessage("", msg, postMessage);
			expect(postMessage).not.toHaveBeenCalled();
		});
	});
});
