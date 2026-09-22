import * as vscode from "vscode";

export class TaskUIService {
	private statusBarItem?: vscode.StatusBarItem;

	public showStartMessage(message?: string) {
		if (message) {
			vscode.window.showInformationMessage(message);
		}
	}

	public showSuccessMessage(message?: string) {
		if (message) {
			vscode.window.showInformationMessage(message);
		}
	}

	public showErrorMessage(prefix?: string, errorMsg?: string) {
		if (prefix) {
			vscode.window.showErrorMessage(`${prefix}: ${errorMsg}`);
		} else if (errorMsg) {
			vscode.window.showErrorMessage(errorMsg);
		}
	}

	public initStatusBar(text?: string) {
		if (text) {
			this.statusBarItem = vscode.window.createStatusBarItem(
				vscode.StatusBarAlignment.Right,
				100,
			);
			this.statusBarItem.text = `$(sync~spin) ${text}`;
			this.statusBarItem.tooltip =
				"Automa Workflow Running - Click to view Active Runners";
			this.statusBarItem.command = "automa.focusActiveRunners";
			this.statusBarItem.show();
		}
	}

	public updateStatusBar(prefix?: string, logMessage?: string) {
		if (this.statusBarItem && logMessage && prefix) {
			const maxLen = 40;
			const cleanMsg = logMessage.replace(/[\r\n]+/g, " ");
			const shortMsg =
				cleanMsg.length > maxLen
					? `${cleanMsg.substring(0, maxLen)}...`
					: cleanMsg;
			this.statusBarItem.text = `$(sync~spin) ${prefix}: ${shortMsg}`;
		}
	}

	public updateStatusBarRunning(text?: string) {
		if (this.statusBarItem && text) {
			this.statusBarItem.text = `$(sync~spin) ${text}`;
		}
	}

	public disposeStatusBar() {
		if (this.statusBarItem) {
			this.statusBarItem.hide();
			this.statusBarItem.dispose();
			this.statusBarItem = undefined;
		}
	}

	public static stripAnsi(message: string): string {
		if (!message) return "";
		return message.replace(
			new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*[a-zA-Z]`, "g"),
			"",
		);
	}
}
