import * as vscode from "vscode";

export class DaemonUIService {
	private daemonStatusBarItem?: vscode.StatusBarItem;
	private jobsStatusBarItem?: vscode.StatusBarItem;

	public init() {
		if (!this.daemonStatusBarItem) {
			this.daemonStatusBarItem = vscode.window.createStatusBarItem(
				vscode.StatusBarAlignment.Right,
				100,
			);
			this.daemonStatusBarItem.name = "automa-core";
			this.daemonStatusBarItem.command = "automa.openDaemonMenu";
			this.daemonStatusBarItem.show();
			this.updateStatusStopped();
		}

		if (!this.jobsStatusBarItem) {
			this.jobsStatusBarItem = vscode.window.createStatusBarItem(
				vscode.StatusBarAlignment.Right,
				99,
			);
			this.jobsStatusBarItem.name = "automa-jobs";
			this.jobsStatusBarItem.command = "automa.showLiveLog";
			this.jobsStatusBarItem.tooltip = "Automa: Active workflow execution jobs";
		}
	}

	public updateStatusStarting(): void {
		if (this.daemonStatusBarItem) {
			this.daemonStatusBarItem.text = "$(sync~spin) Automa";
			this.daemonStatusBarItem.tooltip =
				"Automa Core: Starting daemon process...";
		}
	}

	public updateStatusExternal(port: number): void {
		this.updateStatusRunning(port);
	}

	public updateStatusRunning(port: number): void {
		if (this.daemonStatusBarItem) {
			this.daemonStatusBarItem.text = `$(server) Automa: ${port}`;
			this.daemonStatusBarItem.tooltip = new vscode.MarkdownString(
				`### ⚡ Automa Core Daemon\n\n- **Status**: \`Online\`\n- **Port**: \`${port}\`\n\n*Click to open daemon control menu*`,
			);
		}
	}

	public updateStatusStopped(): void {
		if (this.daemonStatusBarItem) {
			this.daemonStatusBarItem.text = "$(server) Automa: Offline";
			this.daemonStatusBarItem.tooltip = new vscode.MarkdownString(
				"### ⚡ Automa Core Daemon\n\n- **Status**: `Offline`\n\n*Click to start daemon*",
			);
		}
	}

	public updateActiveJobs(count: number): void {
		if (!this.jobsStatusBarItem) return;
		if (count > 0) {
			this.jobsStatusBarItem.text = `$(play) ${count} ${count === 1 ? "Job" : "Jobs"}`;
			this.jobsStatusBarItem.show();
		} else {
			this.jobsStatusBarItem.hide();
		}
	}

	public dispose(): void {
		if (this.daemonStatusBarItem) {
			this.daemonStatusBarItem.dispose();
			this.daemonStatusBarItem = undefined;
		}
		if (this.jobsStatusBarItem) {
			this.jobsStatusBarItem.dispose();
			this.jobsStatusBarItem = undefined;
		}
	}
}
