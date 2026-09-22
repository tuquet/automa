import * as vscode from "vscode";
import { type BrowserResponse, getBrowsers } from "../core/api/client";
import { DAEMON_EVENTS, VIEW_TYPES } from "../core/constants";
import { DaemonService } from "../core/daemon/DaemonService";
import { globalEvents } from "../core/daemon/GlobalSseListener";
import { BaseTreeDataProvider } from "./BaseTreeDataProvider";

export class BrowserTreeItem extends vscode.TreeItem {
	constructor(
		public readonly browser: BrowserResponse,
		public readonly isOnline: boolean,
	) {
		const label = browser.name || browser.id;
		super(label, vscode.TreeItemCollapsibleState.None);

		this.id = browser.id;
		this.description = isOnline ? "Online" : "Offline";
		this.iconPath = new vscode.ThemeIcon(
			isOnline ? "vm-running" : "globe",
			isOnline
				? new vscode.ThemeColor("testing.iconPassed")
				: new vscode.ThemeColor("descriptionForeground"),
		);
		this.contextValue = isOnline
			? "automaBrowserItem-online"
			: "automaBrowserItem-offline";

		const md = new vscode.MarkdownString();
		md.appendMarkdown(`### 🌐 **Browser: \`${label}\`**\n\n`);
		md.appendMarkdown(`- **ID**: \`${browser.id}\`\n`);
		if (browser.timezone) {
			md.appendMarkdown(`- **Timezone**: \`${browser.timezone}\`\n`);
		}
		md.appendMarkdown(
			`- **Status**: \`${isOnline ? "Running (Online)" : "Stopped (Offline)"}\`\n`,
		);
		if (browser.userAgent) {
			md.appendMarkdown(
				`- **User-Agent**: \`${browser.userAgent.slice(0, 45)}...\`\n`,
			);
		}
		this.tooltip = md;
	}
}

export class BrowsersTreeDataProvider extends BaseTreeDataProvider<BrowserTreeItem> {
	private onRefresh = () => this.refresh();

	constructor() {
		super();
		globalEvents.on(DAEMON_EVENTS.BROWSER_STATUS_CHANGED, this.onRefresh);
		globalEvents.on(DAEMON_EVENTS.READY, this.onRefresh);
		globalEvents.on(DAEMON_EVENTS.STOPPED, this.onRefresh);
		globalEvents.on(DAEMON_EVENTS.JOB_STATUS_CHANGED, this.onRefresh);
	}

	dispose() {
		globalEvents.off(DAEMON_EVENTS.BROWSER_STATUS_CHANGED, this.onRefresh);
		globalEvents.off(DAEMON_EVENTS.READY, this.onRefresh);
		globalEvents.off(DAEMON_EVENTS.STOPPED, this.onRefresh);
		globalEvents.off(DAEMON_EVENTS.JOB_STATUS_CHANGED, this.onRefresh);
	}

	public register(context: vscode.ExtensionContext) {
		const treeView = vscode.window.createTreeView(VIEW_TYPES.BROWSERS_VIEW, {
			treeDataProvider: this,
		});
		context.subscriptions.push(treeView);

		context.subscriptions.push(
			vscode.commands.registerCommand("automa.refreshBrowsers", () => {
				this.refresh();
			}),
		);
	}

	async getChildren(element?: BrowserTreeItem): Promise<BrowserTreeItem[]> {
		if (element) return [];

		if (!DaemonService.isRunning()) {
			return [];
		}

		try {
			const res = await getBrowsers();
			const browsers = (res.data || []) as BrowserResponse[];

			return browsers.map((b) => new BrowserTreeItem(b, Boolean(b.isOnline)));
		} catch {
			return [];
		}
	}
}
