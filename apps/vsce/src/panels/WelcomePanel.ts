import * as vscode from "vscode";
import { COMMAND_IDS, VIEW_TYPES } from "../core/constants";

export class WelcomePanel {
	public static currentPanel: WelcomePanel | undefined;
	private readonly _panel: vscode.WebviewPanel;
	private readonly _extensionUri: vscode.Uri;
	private _disposables: vscode.Disposable[] = [];

	public static createOrShow(extensionUri: vscode.Uri) {
		const column = vscode.window.activeTextEditor
			? vscode.window.activeTextEditor.viewColumn
			: undefined;

		if (WelcomePanel.currentPanel) {
			WelcomePanel.currentPanel._panel.reveal(column);
			return;
		}

		const panel = vscode.window.createWebviewPanel(
			VIEW_TYPES.WELCOME_PANEL,
			"Welcome to Automa",
			column || vscode.ViewColumn.One,
			{
				enableScripts: true,
				localResourceRoots: [vscode.Uri.joinPath(extensionUri, "assets")],
			},
		);

		WelcomePanel.currentPanel = new WelcomePanel(panel, extensionUri);
	}

	private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
		this._panel = panel;
		this._extensionUri = extensionUri;

		this._panel.onDidDispose(() => this.dispose(), null, this._disposables);
		this._panel.webview.html = this._getHtmlForWebview(this._panel.webview);

		this._panel.webview.onDidReceiveMessage(
			async (message) => {
				if (!message || typeof message !== "object") return;
				switch (message.command) {
					case "installBrowser":
						await vscode.commands.executeCommand(COMMAND_IDS.INSTALL_BROWSER);
						return;
					case "createWorkflow":
						await vscode.commands.executeCommand(COMMAND_IDS.CREATE_WORKFLOW);
						return;
					case "openStorage":
						await vscode.commands.executeCommand(COMMAND_IDS.REFRESH_STORAGE);
						return;
				}
			},
			null,
			this._disposables,
		);
	}

	public dispose() {
		WelcomePanel.currentPanel = undefined;
		while (this._disposables.length) {
			const d = this._disposables.pop();
			if (d) {
				d.dispose();
			}
		}
		this._panel.dispose();
	}

	private _getHtmlForWebview(webview: vscode.Webview) {
		const logoPath = vscode.Uri.joinPath(
			this._extensionUri,
			"assets",
			"logo.png",
		);
		const logoUri =
			typeof webview.asWebviewUri === "function"
				? webview.asWebviewUri(logoPath)
				: "";

		let nonce = "";
		const possible =
			"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
		for (let i = 0; i < 32; i++) {
			nonce += possible.charAt(Math.floor(Math.random() * possible.length));
		}

		return `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} data:; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
	<title>Welcome to Automa</title>
	<style>
		body {
			background-color: var(--vscode-editor-background);
			color: var(--vscode-editor-foreground);
			font-family: var(--vscode-font-family), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			min-height: 100vh;
			margin: 0;
			padding: 24px;
			box-sizing: border-box;
			text-align: center;
		}
		img {
			width: 80px;
			height: 80px;
			margin-bottom: 16px;
			filter: drop-shadow(0 4px 12px rgba(0,0,0,0.2));
		}
		h1 {
			font-size: 24px;
			font-weight: 600;
			margin: 0 0 8px 0;
		}
		p {
			color: var(--vscode-descriptionForeground);
			max-width: 500px;
			margin: 0 0 32px 0;
			line-height: 1.5;
		}
		.cards {
			display: grid;
			grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
			gap: 16px;
			width: 100%;
			max-width: 680px;
		}
		.card {
			background-color: var(--vscode-editor-inactiveSelectionBackground);
			border: 1px solid var(--vscode-panel-border, rgba(128, 128, 128, 0.18));
			border-radius: 8px;
			padding: 20px;
			cursor: pointer;
			text-align: left;
			transition: all 0.2s ease;
		}
		.card:hover {
			border-color: var(--vscode-focusBorder);
			transform: translateY(-2px);
			background-color: var(--vscode-list-hoverBackground);
		}
		.card-title {
			font-weight: 600;
			font-size: 15px;
			margin-bottom: 6px;
			color: var(--vscode-foreground);
		}
		.card-desc {
			font-size: 12px;
			color: var(--vscode-descriptionForeground);
			line-height: 1.4;
		}
		button {
			background-color: var(--vscode-button-background);
			color: var(--vscode-button-foreground);
			border: none;
			padding: 8px 16px;
			border-radius: 4px;
			cursor: pointer;
			font-family: inherit;
			font-size: 13px;
			font-weight: 500;
			transition: background-color 0.1s;
		}
		button:hover {
			background-color: var(--vscode-button-hoverBackground);
		}
	</style>
</head>
<body>
	<img src="${logoUri}" alt="Automa Logo" />
	<h1>Welcome to Automa</h1>
	<p>Browser automation engine for VS Code.</p>
	
	<div class="cards">
		<div class="card" role="button" tabindex="0" onclick="sendCommand('createWorkflow')" onkeydown="if(event.key==='Enter'||event.key===' ')sendCommand('createWorkflow')">
			<div class="card-title">Create Workflow</div>
			<div class="card-desc">Build an automated web scraping or testing flow.</div>
		</div>
		<div class="card" role="button" tabindex="0" onclick="sendCommand('installBrowser')" onkeydown="if(event.key==='Enter'||event.key===' ')sendCommand('installBrowser')">
			<div class="card-title">Install Browser</div>
			<div class="card-desc">Download isolated Chromium runtime for headless execution.</div>
		</div>
		<div class="card" role="button" tabindex="0" onclick="sendCommand('openStorage')" onkeydown="if(event.key==='Enter'||event.key===' ')sendCommand('openStorage')">
			<div class="card-title">Storage</div>
			<div class="card-desc">Manage shared workflows, tables, and credentials.</div>
		</div>
	</div>

	<script nonce="${nonce}">
		const vscode = acquireVsCodeApi();
		function sendCommand(command) {
			vscode.postMessage({ command });
		}
	</script>
</body>
</html>`;
	}
}
