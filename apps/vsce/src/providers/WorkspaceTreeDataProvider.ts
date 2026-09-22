import * as vscode from "vscode";
import { COMMAND_IDS, VIEW_TYPES } from "../core/constants";
import type { AutomaFilesProvider, FileItem } from "./AutomaFilesProvider";
import { BaseTreeDataProvider } from "./BaseTreeDataProvider";

export class WorkspaceTreeDataProvider extends BaseTreeDataProvider<vscode.TreeItem> {
	private rootWorkflows = new vscode.TreeItem(
		"Workflows",
		vscode.TreeItemCollapsibleState.Expanded,
	);
	private rootCampaigns = new vscode.TreeItem(
		"Campaigns",
		vscode.TreeItemCollapsibleState.Expanded,
	);
	private rootPackages = new vscode.TreeItem(
		"Packages",
		vscode.TreeItemCollapsibleState.Collapsed,
	);

	constructor(
		private workflowsProvider: AutomaFilesProvider,
		private campaignsProvider: AutomaFilesProvider,
		private packagesProvider: AutomaFilesProvider,
	) {
		super();
		this.rootWorkflows.iconPath = new vscode.ThemeIcon("play-circle");
		this.rootWorkflows.contextValue = "Root_Workflows";

		this.rootCampaigns.iconPath = new vscode.ThemeIcon("rocket");
		this.rootCampaigns.contextValue = "Root_Campaigns";

		this.rootPackages.iconPath = new vscode.ThemeIcon("package");
		this.rootPackages.contextValue = "Root_Packages";

		workflowsProvider.onDidChangeTreeData(() => {
			this.updateRootLabels();
			this._onDidChangeTreeData.fire(undefined);
		});
		campaignsProvider.onDidChangeTreeData(() => {
			this.updateRootLabels();
			this._onDidChangeTreeData.fire(undefined);
		});
		packagesProvider.onDidChangeTreeData(() => {
			this.updateRootLabels();
			this._onDidChangeTreeData.fire(undefined);
		});
	}

	dispose() {
		this.workflowsProvider.dispose();
		this.campaignsProvider.dispose();
		this.packagesProvider.dispose();
	}

	private updateRootLabels(): void {
		this.rootWorkflows.label = `Workflows (${this.workflowsProvider.getItemCount()})`;
		this.rootCampaigns.label = `Campaigns (${this.campaignsProvider.getItemCount()})`;
		this.rootPackages.label = `Packages (${this.packagesProvider.getItemCount()})`;
	}

	override getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
		return element;
	}

	private resolveChildProvider(fileItem: FileItem): AutomaFilesProvider {
		if (fileItem.viewId === "automa.packages") {
			return this.packagesProvider;
		}
		if (fileItem.viewId === "automa.campaigns") {
			return this.campaignsProvider;
		}
		return this.workflowsProvider;
	}

	override async getChildren(
		element?: vscode.TreeItem,
	): Promise<vscode.TreeItem[]> {
		if (!element) {
			this.updateRootLabels();
			return [this.rootWorkflows, this.rootCampaigns, this.rootPackages];
		}

		if (element === this.rootWorkflows) {
			return this.workflowsProvider.getChildren();
		}
		if (element === this.rootCampaigns) {
			return this.campaignsProvider.getChildren();
		}
		if (element === this.rootPackages) {
			return this.packagesProvider.getChildren();
		}

		// If it's a child of Files (Folder or FileItem)
		if ("element" in element) {
			const fileItem = element as FileItem;
			return this.resolveChildProvider(fileItem).getChildren(fileItem);
		}

		return [];
	}

	public async refreshAsync(): Promise<void> {
		await Promise.all([
			this.workflowsProvider.refreshAsync(),
			this.campaignsProvider.refreshAsync(),
			this.packagesProvider.refreshAsync(),
		]);
		this.updateRootLabels();
		this._onDidChangeTreeData.fire(undefined);
	}

	override refresh(): void {
		void this.refreshAsync();
	}

	public register(context: vscode.ExtensionContext) {
		const treeView = vscode.window.createTreeView(VIEW_TYPES.WORKSPACE_TREE, {
			treeDataProvider: this,
		});
		context.subscriptions.push(treeView);

		context.subscriptions.push(
			vscode.commands.registerCommand(
				COMMAND_IDS.REFRESH_WORKSPACE,
				async () => {
					await this.refreshAsync();
				},
			),
		);
	}
}
