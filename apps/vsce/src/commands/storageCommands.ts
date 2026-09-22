import type { StorageCredential, StorageVariable } from "@automa/types/api";
import * as vscode from "vscode";
import {
	addStorageCredential,
	addStorageTable,
	addStorageVariable,
	deleteStorageCredential,
	deleteStorageTable,
	deleteStorageVariable,
	encryptSecret,
	getStorageTables,
} from "../core/api/client";
import { DaemonService } from "../core/daemon/DaemonService";
import { TablePanel } from "../panels/TablePanel";
import { formatApiError } from "../utils/errorUtils";

export async function addVariableCommand() {
	const key = await vscode.window.showInputBox({
		prompt: "Enter Variable Name",
	});
	if (!key) return;

	const value = await vscode.window.showInputBox({
		prompt: "Enter Variable Value",
	});
	if (value === undefined) return;

	let parsedValue: Record<string, unknown> = {};
	try {
		const parsed = JSON.parse(value);
		if (
			typeof parsed === "object" &&
			parsed !== null &&
			!Array.isArray(parsed)
		) {
			parsedValue = parsed as Record<string, unknown>;
		} else {
			parsedValue = { value: parsed };
		}
	} catch {
		parsedValue = { value };
	}

	try {
		const payload: StorageVariable = {
			name: key,
			key: key,
			value: parsedValue,
		};
		const res = await addStorageVariable({
			body: payload,
		});
		if (res.error) throw new Error(formatApiError(res.error));
		vscode.commands.executeCommand("automa.refreshStorage");
		vscode.window.showInformationMessage(`Variable ${key} added successfully.`);
	} catch (e: unknown) {
		vscode.window.showErrorMessage(
			`Failed to add variable: ${formatApiError(e)}`,
		);
	}
}

export async function addCredentialCommand(context: vscode.ExtensionContext) {
	const name = await vscode.window.showInputBox({
		prompt: "Enter Credential Name",
	});
	if (!name) return;

	const secret = await vscode.window.showInputBox({
		prompt: "Enter Secret Value",
		password: true,
	});
	if (!secret) return;

	let passphrase = await context.secrets.get("encryptionPassphrase");

	if (!passphrase) {
		passphrase = await vscode.window.showInputBox({
			prompt: "Enter Encryption Passphrase",
			password: true,
		});
		if (!passphrase) {
			vscode.window.showErrorMessage(
				"Passphrase is required to encrypt the credential.",
			);
			return;
		}
		await context.secrets.store("encryptionPassphrase", passphrase);
	}

	await executeEncryption(name, secret, passphrase);
}

export async function addTableCommand() {
	const name = await vscode.window.showInputBox({
		prompt: "Enter Table Name",
	});
	if (!name) return;

	try {
		const res = await addStorageTable({
			body: {
				name: name,
			},
		});
		if (res.error) throw new Error(formatApiError(res.error));
		vscode.commands.executeCommand("automa.refreshStorage");
		vscode.window.showInformationMessage(`Table ${name} added successfully.`);
	} catch (e: unknown) {
		vscode.window.showErrorMessage(`Failed to add table: ${formatApiError(e)}`);
	}
}

export async function encryptSecretCommand(context: vscode.ExtensionContext) {
	await addCredentialCommand(context);
}

async function executeEncryption(
	name: string,
	secret: string,
	passphrase?: string,
) {
	return vscode.window.withProgress(
		{
			location: vscode.ProgressLocation.Notification,
			title: `Encrypting credential '${name}'...`,
			cancellable: false,
		},
		async () => {
			try {
				const daemon = DaemonService;
				const port = daemon.getPort();

				// Encrypt the secret

				const resEncrypt = await encryptSecret({
					baseUrl: `http://127.0.0.1:${port}`,
					body: {
						plaintext: secret,
						passphrase: passphrase || "",
					},
				});
				if (resEncrypt.error) throw new Error(formatApiError(resEncrypt.error));
				const encryptedResult = resEncrypt.data;
				if (!encryptedResult) throw new Error("No encrypted result returned");

				// Save the credential
				const credentialPayload: StorageCredential = {
					name: name,
					key: name,
					value:
						encryptedResult.encryptedSecret ||
						(encryptedResult as { encrypted_secret?: string })
							.encrypted_secret ||
						"",
				};

				const res = await addStorageCredential({
					body: credentialPayload,
				});
				if (res.error) throw new Error(formatApiError(res.error));

				vscode.commands.executeCommand("automa.refreshStorage");
				vscode.window.showInformationMessage(
					`Credential ${name} encrypted and added successfully.`,
				);
			} catch (error: unknown) {
				vscode.window.showErrorMessage(
					`Failed to add credential: ${formatApiError(error)}`,
				);
				throw error;
			}
		},
	);
}

export async function deleteStorageItemCommand(
	item: import("../providers/StorageTreeDataProvider").StorageItem,
) {
	if (!item?.itemId && !item?.label) return;

	const idOrName = item.itemId || item.label;

	const confirm = await vscode.window.showWarningMessage(
		`Are you sure you want to delete ${item.type.toLowerCase()} '${item.label}'?`,
		"Yes",
		"No",
	);
	if (confirm !== "Yes") return;

	try {
		const deleteHandlers: Record<
			string,
			(id: string) => Promise<{ error?: unknown }>
		> = {
			Variable: (id) => deleteStorageVariable({ path: { id } }),
			Credential: (id) => deleteStorageCredential({ path: { id } }),
			Table: (id) => deleteStorageTable({ path: { id } }),
		};

		const handler = deleteHandlers[item.type];
		if (!handler) return;

		const res = await handler(idOrName);

		if (res?.error) throw new Error(formatApiError(res.error));

		vscode.commands.executeCommand("automa.refreshStorage");
		vscode.window.showInformationMessage(
			`${item.type} '${item.label}' deleted.`,
		);
	} catch (error: unknown) {
		vscode.window.showErrorMessage(
			`Failed to delete ${item.type?.toLowerCase()}: ${formatApiError(error)}`,
		);
	}
}
export async function openTableCommand(
	item?: import("../providers/StorageTreeDataProvider").StorageItem,
	context?: import("vscode").ExtensionContext,
) {
	const extContext =
		context || ({} as unknown as import("vscode").ExtensionContext);

	if (item?.type === "Table" && item.itemId) {
		await TablePanel.show(extContext, item);
		return;
	}

	if (!DaemonService.isRunning()) {
		await DaemonService.start();
	}

	try {
		const res = await getStorageTables();
		if (res.error) throw new Error(formatApiError(res.error));
		const tables = res.data || [];

		if (tables.length === 0) {
			vscode.window.showInformationMessage(
				"No storage tables found in database.",
			);
			return;
		}

		interface TableQuickPickItem extends vscode.QuickPickItem {
			tableId?: string | null;
			tableName?: string | null;
		}

		const picked = await vscode.window.showQuickPick<TableQuickPickItem>(
			tables.map((t) => ({
				label: t.name || t.id || "Unnamed Table",
				description: t.id || undefined,
				tableId: t.id,
				tableName: t.name,
			})),
			{ placeHolder: "Select a Storage Table to open" },
		);

		if (!picked?.tableId) return;

		const storageItem = {
			label: picked.tableName || picked.tableId,
			itemId: picked.tableId,
			type: "Table" as const,
		};

		await TablePanel.show(
			extContext,
			storageItem as import("../providers/StorageTreeDataProvider").StorageItem,
		);
	} catch (e: unknown) {
		vscode.window.showErrorMessage(
			`Failed to open table: ${formatApiError(e)}`,
		);
	}
}
