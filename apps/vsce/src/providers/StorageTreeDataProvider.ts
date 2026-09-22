import * as vscode from "vscode";
import {
	getStorageCredentials,
	getStorageTables,
	getStorageVariables,
	type StorageCredential,
	type StorageTable,
	type StorageVariable,
} from "../core/api/client";
import { COMMAND_IDS, DAEMON_EVENTS, VIEW_TYPES } from "../core/constants";
import { DaemonService } from "../core/daemon/DaemonService";
import { globalEvents } from "../core/daemon/GlobalSseListener";
import {
	createCategoryItem,
	createCredentialItem,
	createErrorItem,
	createInfoItem,
	createTableItem,
	createVariableItem,
	StorageItem,
} from "../core/services/storage/StorageItemPresenter";
import { BaseTreeDataProvider } from "./BaseTreeDataProvider";

export { StorageItem };

export class StorageTreeDataProvider extends BaseTreeDataProvider<StorageItem> {
	private onRefresh = () => this.refresh();

	constructor() {
		super();
		globalEvents.on(DAEMON_EVENTS.READY, this.onRefresh);
		globalEvents.on(DAEMON_EVENTS.STOPPED, this.onRefresh);
		globalEvents.on(DAEMON_EVENTS.STORAGE_CHANGED, this.onRefresh);
	}

	dispose() {
		globalEvents.off(DAEMON_EVENTS.READY, this.onRefresh);
		globalEvents.off(DAEMON_EVENTS.STOPPED, this.onRefresh);
		globalEvents.off(DAEMON_EVENTS.STORAGE_CHANGED, this.onRefresh);
	}

	public register(context: vscode.ExtensionContext) {
		const treeView = vscode.window.createTreeView(VIEW_TYPES.STORAGE_TREE, {
			treeDataProvider: this,
		});
		context.subscriptions.push(treeView);

		context.subscriptions.push(
			vscode.commands.registerCommand(COMMAND_IDS.REFRESH_STORAGE, () => {
				this.refresh();
			}),
		);
	}

	async getChildren(element?: StorageItem): Promise<StorageItem[]> {
		if (!DaemonService.isRunning()) {
			return [createInfoItem("Daemon offline", "plug")];
		}

		if (!element) {
			return [
				createCategoryItem("Secrets", "lock", "Category-Secrets"),
				createCategoryItem(
					"Variables",
					"symbol-variable",
					"Category-Variables",
				),
				createCategoryItem("Tables", "database", "Category-Tables"),
			];
		}

		if (element.type === "Category") {
			return this.loadCategoryItems(String(element.label || ""));
		}

		return [];
	}

	private async loadCategoryItems(label: string): Promise<StorageItem[]> {
		const loaders: Record<string, () => Promise<StorageItem[]>> = {
			Variables: () => this.getVariables(),
			Secrets: () => this.getCredentials(),
			"Repository Secrets": () => this.getCredentials(),
			Credentials: () => this.getCredentials(),
			Tables: () => this.getTables(),
			"Data Tables": () => this.getTables(),
		};

		const loader = loaders[label];
		return loader ? await loader() : [];
	}

	private async getVariables(): Promise<StorageItem[]> {
		try {
			const res = await getStorageVariables();
			const data = (res.data || []) as StorageVariable[];
			if (data.length === 0) {
				return [createInfoItem("No variables")];
			}
			return data.map(createVariableItem);
		} catch {
			return [createErrorItem("Error reading variables")];
		}
	}

	private async getCredentials(): Promise<StorageItem[]> {
		try {
			const res = await getStorageCredentials();
			const data = (res.data || []) as StorageCredential[];
			if (data.length === 0) {
				return [createInfoItem("No secrets")];
			}
			return data.map(createCredentialItem);
		} catch {
			return [createErrorItem("Error reading secrets")];
		}
	}

	private async getTables(): Promise<StorageItem[]> {
		try {
			const res = await getStorageTables();
			const data = (res.data || []) as StorageTable[];
			if (data.length === 0) {
				return [createInfoItem("No tables")];
			}
			return data.map(createTableItem);
		} catch {
			return [createErrorItem("Error reading tables")];
		}
	}
}
