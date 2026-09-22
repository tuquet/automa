import * as vscode from "vscode";
import {
	type CampaignStorageItem,
	getStorageCampaigns,
	getStorageWorkflows,
	type WorkflowStorageItem,
} from "../core/api/client";
import { DAEMON_EVENTS, VIEW_TYPES } from "../core/constants";
import { DaemonService } from "../core/daemon/DaemonService";
import { globalEvents } from "../core/daemon/GlobalSseListener";
import {
	buildFileItemDescription,
	buildFileItemTooltip,
	getFileItemIcon,
} from "../core/services/explorer/FileItemPresenter";
import {
	parseCampaignElement,
	parseWorkflowElement,
} from "../core/services/explorer/FileMetadataParser";
import { BaseTreeDataProvider } from "./BaseTreeDataProvider";

export interface FileMetadata {
	displayName?: string;
	version?: string;
	description?: string;
	id?: string;
	nodesCount?: number;
	browsersCount?: number;
	concurrencyMode?: string;
	cron?: string;
	isPackage?: boolean;
}

export interface TreeElement {
	isFolder: boolean;
	name: string;
	path: string;
	id?: string;
	namespace?: string;
	uri?: vscode.Uri;
	children?: TreeElement[];
	metadata?: FileMetadata;
	rawData?: Record<string, unknown>;
}

export class AutomaFilesProvider extends BaseTreeDataProvider<FileItem> {
	private rootElements: TreeElement[] = [];
	private totalFilesCount = 0;
	private onRefresh = () => this.refresh();

	constructor(
		_iconName: string,
		private viewId: string,
		private filterType: "all" | "workflow" | "package" | "campaign" = "all",
	) {
		super();

		// Event-driven reactive updates via GlobalSseListener
		globalEvents.on(DAEMON_EVENTS.READY, this.onRefresh);
		globalEvents.on(DAEMON_EVENTS.STOPPED, this.onRefresh);
		globalEvents.on(DAEMON_EVENTS.STORAGE_CHANGED, this.onRefresh);

		// Initial load
		this.refresh();
	}

	dispose() {
		globalEvents.off(DAEMON_EVENTS.READY, this.onRefresh);
		globalEvents.off(DAEMON_EVENTS.STOPPED, this.onRefresh);
		globalEvents.off(DAEMON_EVENTS.STORAGE_CHANGED, this.onRefresh);
	}

	public getItemCount(): number {
		return this.totalFilesCount;
	}

	public async refreshAsync(): Promise<void> {
		await this.fetchData();
		this._onDidChangeTreeData.fire(undefined);
	}

	override refresh(): void {
		void this.refreshAsync();
	}

	override getTreeItem(element: FileItem): vscode.TreeItem {
		return element;
	}

	override async getChildren(element?: FileItem): Promise<FileItem[]> {
		if (!element) {
			return this.buildItems(this.rootElements);
		}

		if (element.element.isFolder && element.element.children) {
			return this.buildItems(element.element.children);
		}

		return [];
	}

	private async buildItems(elements: TreeElement[]): Promise<FileItem[]> {
		if (!DaemonService.isRunning()) {
			const offlineItem = new FileItem(
				"Daemon offline",
				vscode.TreeItemCollapsibleState.None,
				"plug",
				this.viewId,
				{ isFolder: false, name: "Offline", path: "__offline__" },
			);
			return [offlineItem];
		}

		if (elements.length === 0) {
			const emptyMsg = this.getEmptyMessage();
			const emptyItem = new FileItem(
				emptyMsg,
				vscode.TreeItemCollapsibleState.None,
				"info",
				this.viewId,
				{ isFolder: false, name: emptyMsg, path: "__empty__" },
			);
			return [emptyItem];
		}

		const items: FileItem[] = [];
		for (const el of elements) {
			if (el.isFolder) {
				items.push(
					new FileItem(
						el.name,
						vscode.TreeItemCollapsibleState.Collapsed,
						"folder",
						this.viewId,
						el,
					),
				);
				continue;
			}

			const icon = getFileItemIcon(el, this.filterType);
			const item = new FileItem(
				el.metadata?.displayName || el.name,
				vscode.TreeItemCollapsibleState.None,
				icon,
				this.viewId,
				el,
			);
			item.description = buildFileItemDescription(el, this.filterType);
			item.tooltip = buildFileItemTooltip(el, this.filterType);

			this.attachItemCommand(item, el);
			items.push(item);
		}

		return items.sort((a, b) => {
			return (a.label as string).localeCompare(b.label as string);
		});
	}

	private getEmptyMessage(): string {
		if (this.filterType === "campaign") return "No campaigns";
		if (this.filterType === "package") return "No packages";
		return "No workflows";
	}

	private attachItemCommand(item: FileItem, el: TreeElement): void {
		const isCampaign = this.filterType === "campaign";
		if (el.uri) {
			item.resourceUri = el.uri;
			const editorId = isCampaign
				? VIEW_TYPES.CAMPAIGN_EDITOR
				: VIEW_TYPES.WORKFLOW_EDITOR;
			item.command = {
				command: "vscode.openWith",
				title: "Preview",
				arguments: [el.uri, editorId],
			};
			return;
		}

		if (el.id) {
			const cmd = isCampaign
				? "automa.showCampaignPreview"
				: "automa.showWorkflowPreview";
			item.command = {
				command: cmd,
				title: "Preview",
				arguments: [item],
			};
		}
	}

	private async fetchData(): Promise<void> {
		if (!DaemonService.isRunning()) {
			this.rootElements = [];
			this.totalFilesCount = 0;
			return;
		}

		try {
			const elements =
				this.filterType === "campaign"
					? await this.fetchCampaignElements()
					: await this.fetchWorkflowElements();

			this.totalFilesCount = elements.length;
			this.rootElements = elements;
		} catch (_err) {
			this.rootElements = [];
			this.totalFilesCount = 0;
		}
	}

	private async fetchCampaignElements(): Promise<TreeElement[]> {
		const res = await getStorageCampaigns();
		const campaigns = (res.data || []) as CampaignStorageItem[];
		return campaigns.map(parseCampaignElement);
	}

	private async fetchWorkflowElements(): Promise<TreeElement[]> {
		const res = await getStorageWorkflows();
		const workflows = (res.data || []) as WorkflowStorageItem[];
		const elements = workflows.map(parseWorkflowElement);

		if (this.filterType === "package") {
			return elements.filter((item) => item.metadata?.isPackage);
		}
		if (this.filterType === "workflow") {
			return elements.filter((item) => !item.metadata?.isPackage);
		}
		return elements;
	}
}

export class FileItem extends vscode.TreeItem {
	constructor(
		public override readonly label: string,
		public override readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly iconName: string,
		public readonly viewId: string,
		public readonly element: TreeElement,
	) {
		super(label, collapsibleState);

		this.id = element.id || element.path;
		this.iconPath = new vscode.ThemeIcon(iconName);
		this.contextValue =
			element.path === "__empty__" || element.path === "__offline__"
				? "automaEmptyItem"
				: element.isFolder
					? `automaFolderItem-${viewId}`
					: `automaFileItem-${viewId}`;
	}
}
