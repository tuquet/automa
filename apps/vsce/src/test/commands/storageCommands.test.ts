import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as vscode from "vscode";
import {
	addCredentialCommand,
	addTableCommand,
	addVariableCommand,
	deleteStorageItemCommand,
	encryptSecretCommand,
	openTableCommand,
} from "../../commands/storageCommands";
import {
	addStorageCredential,
	addStorageTable,
	addStorageVariable,
	deleteStorageTable,
	deleteStorageVariable,
	encryptSecret,
	getStorageTables,
} from "../../core/api/client";
import { TablePanel } from "../../panels/TablePanel";

vi.mock("../../core/api/client", () => ({
	addStorageVariable: vi.fn(),
	addStorageCredential: vi.fn(),
	addStorageTable: vi.fn(),
	encryptSecret: vi.fn(),
	deleteStorageVariable: vi.fn(),
	deleteStorageCredential: vi.fn(),
	deleteStorageTable: vi.fn(),
	getStorageTables: vi.fn(),
}));

vi.mock("../../core/daemon/DaemonService", () => ({
	DaemonService: {
		isRunning: vi.fn().mockReturnValue(true),
		getPort: vi.fn().mockReturnValue(8765),
		start: vi.fn().mockResolvedValue(undefined),
	},
}));

vi.mock("../../panels/TablePanel", () => ({
	TablePanel: {
		show: vi.fn().mockResolvedValue(undefined),
	},
}));

describe("storageCommands", () => {
	let context: vscode.ExtensionContext;

	beforeEach(() => {
		vi.clearAllMocks();
		context = {
			secrets: {
				get: vi.fn().mockResolvedValue("test-passphrase"),
				store: vi.fn().mockResolvedValue(undefined),
			},
		} as unknown as vscode.ExtensionContext;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("addVariableCommand should prompt for key and value then add variable", async () => {
		vi.mocked(vscode.window.showInputBox)
			.mockResolvedValueOnce("API_URL")
			.mockResolvedValueOnce("https://example.com");

		vi.mocked(addStorageVariable).mockResolvedValue({
			data: undefined,
			error: undefined,
		} as unknown as Awaited<ReturnType<typeof addStorageVariable>>);

		await addVariableCommand();

		expect(addStorageVariable).toHaveBeenCalledWith({
			body: {
				name: "API_URL",
				key: "API_URL",
				value: { value: "https://example.com" },
			},
		});
		expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
			"automa.refreshStorage",
		);
		expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
			"Variable API_URL added successfully.",
		);
	});

	it("addTableCommand should prompt for name and add table", async () => {
		vi.mocked(vscode.window.showInputBox).mockResolvedValueOnce("UsersTable");
		vi.mocked(addStorageTable).mockResolvedValue({
			data: undefined,
			error: undefined,
		} as unknown as Awaited<ReturnType<typeof addStorageTable>>);

		await addTableCommand();

		expect(addStorageTable).toHaveBeenCalledWith({
			body: {
				name: "UsersTable",
			},
		});
		expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
			"Table UsersTable added successfully.",
		);
	});

	it("addCredentialCommand should encrypt secret and save credential", async () => {
		vi.mocked(vscode.window.showInputBox)
			.mockResolvedValueOnce("DB_PASS")
			.mockResolvedValueOnce("secret123");

		vi.mocked(encryptSecret).mockResolvedValue({
			data: { encryptedSecret: "ENC_xyz987" },
			error: undefined,
		} as unknown as Awaited<ReturnType<typeof encryptSecret>>);
		vi.mocked(addStorageCredential).mockResolvedValue({
			data: undefined,
			error: undefined,
		} as unknown as Awaited<ReturnType<typeof addStorageCredential>>);

		await addCredentialCommand(context);

		expect(encryptSecret).toHaveBeenCalledWith({
			baseUrl: "http://127.0.0.1:8765",
			body: {
				plaintext: "secret123",
				passphrase: "test-passphrase",
			},
		});
		expect(addStorageCredential).toHaveBeenCalledWith({
			body: {
				name: "DB_PASS",
				key: "DB_PASS",
				value: "ENC_xyz987",
			},
		});
	});

	it("encryptSecretCommand should delegate to addCredentialCommand", async () => {
		vi.mocked(vscode.window.showInputBox)
			.mockResolvedValueOnce("API_TOKEN")
			.mockResolvedValueOnce("tok123");

		vi.mocked(encryptSecret).mockResolvedValue({
			data: { encryptedSecret: "ENC_tok" },
			error: undefined,
		} as unknown as Awaited<ReturnType<typeof encryptSecret>>);
		vi.mocked(addStorageCredential).mockResolvedValue({
			data: undefined,
			error: undefined,
		} as unknown as Awaited<ReturnType<typeof addStorageCredential>>);

		await encryptSecretCommand(context);

		expect(encryptSecret).toHaveBeenCalled();
	});

	it("deleteStorageItemCommand should confirm and delete variable item", async () => {
		vi.mocked(vscode.window.showWarningMessage).mockResolvedValue(
			"Yes" as unknown as vscode.MessageItem,
		);
		vi.mocked(deleteStorageVariable).mockResolvedValue({
			data: undefined,
			error: undefined,
		} as unknown as Awaited<ReturnType<typeof deleteStorageVariable>>);

		const mockItem = {
			itemId: "v1",
			label: "API_URL",
			type: "Variable",
		} as unknown as import("../../providers/StorageTreeDataProvider").StorageItem;

		await deleteStorageItemCommand(mockItem);

		expect(deleteStorageVariable).toHaveBeenCalledWith({
			path: { id: "v1" },
		});
		expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
			"Variable 'API_URL' deleted.",
		);
	});

	it("deleteStorageItemCommand should not delete if user declines confirm", async () => {
		vi.mocked(vscode.window.showWarningMessage).mockResolvedValue(
			"No" as unknown as vscode.MessageItem,
		);

		const mockItem = {
			itemId: "t1",
			label: "UsersTable",
			type: "Table",
		} as unknown as import("../../providers/StorageTreeDataProvider").StorageItem;

		await deleteStorageItemCommand(mockItem);

		expect(deleteStorageTable).not.toHaveBeenCalled();
	});

	it("openTableCommand should open TablePanel for Table items", async () => {
		const mockItem = {
			itemId: "t123",
			label: "UsersTable",
			type: "Table",
		} as unknown as import("../../providers/StorageTreeDataProvider").StorageItem;

		await openTableCommand(mockItem, context);

		expect(TablePanel.show).toHaveBeenCalledWith(context, mockItem);
	});

	it("openTableCommand should prompt quickpick when no item is provided", async () => {
		vi.mocked(getStorageTables).mockResolvedValueOnce({
			data: [
				{
					id: "t_qp",
					name: "QuickPickTable",
					createdAt: "2026-09-08T10:00:00Z",
					updatedAt: "2026-09-08T10:00:00Z",
				},
			],
			error: undefined,
		} as unknown as Awaited<ReturnType<typeof getStorageTables>>);
		vi.mocked(vscode.window.showQuickPick).mockResolvedValueOnce({
			label: "QuickPickTable",
			tableId: "t_qp",
			tableName: "QuickPickTable",
		} as unknown as vscode.QuickPickItem);

		await openTableCommand(undefined, context);

		expect(TablePanel.show).toHaveBeenCalledWith(
			context,
			expect.objectContaining({ itemId: "t_qp" }),
		);
	});
});
