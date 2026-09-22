import * as vscode from "vscode";
import { VIEW_TYPES } from "../core/constants";
import {
	escapeHtml,
	WebviewHtmlResolver,
} from "../core/webview/WebviewHtmlResolver";
import { BaseCustomEditorProvider } from "./BaseCustomEditorProvider";

export class BrowserEditorProvider
	extends BaseCustomEditorProvider
	implements vscode.CustomTextEditorProvider
{
	public static readonly viewType = VIEW_TYPES.BROWSER_EDITOR;
	public static currentPanel: vscode.WebviewPanel | undefined;
	private htmlResolver: WebviewHtmlResolver;

	constructor(context: vscode.ExtensionContext) {
		super(context);
		this.htmlResolver = new WebviewHtmlResolver(context);
	}

	public static register(context: vscode.ExtensionContext) {
		const provider = new BrowserEditorProvider(context);
		context.subscriptions.push(
			vscode.window.registerCustomEditorProvider(
				BrowserEditorProvider.viewType,
				provider,
				{
					webviewOptions: {
						retainContextWhenHidden: true,
					},
					supportsMultipleEditorsPerDocument: false,
				},
			),
		);
	}

	public async resolveCustomTextEditor(
		document: vscode.TextDocument,
		webviewPanel: vscode.WebviewPanel,
		_token: vscode.CancellationToken,
	): Promise<void> {
		BrowserEditorProvider.currentPanel = webviewPanel;

		webviewPanel.webview.options = {
			enableScripts: true,
			localResourceRoots: [this.context.extensionUri],
		};

		let isHtmlInitialized = false;

		const updateWebview = async () => {
			try {
				const content = document.getText();
				let json: Record<string, unknown> = {};
				if (content.trim()) {
					json = JSON.parse(content) as Record<string, unknown>;
				}

				const payload = {
					isSingleEditor: true,
					browser: json,
					filePath: document.uri.fsPath,
				};

				if (!isHtmlInitialized || !webviewPanel.webview.html) {
					webviewPanel.webview.html = this.htmlResolver.resolveHtml(
						webviewPanel.webview,
						{
							viewType: "browsers",
							payload,
						},
					);
					isHtmlInitialized = true;
				} else {
					webviewPanel.webview.postMessage({
						type: "updateData",
						payload,
					});
				}
			} catch (e: unknown) {
				const msg = e instanceof Error ? e.message : String(e);
				if (!isHtmlInitialized) {
					const escapedMsg = escapeHtml(msg);
					webviewPanel.webview.html = `<body><h2>Failed to parse browser configuration</h2><p>${escapedMsg}</p></body>`;
				}
			}
		};

		const handleSaveBrowser = async (data: unknown) => {
			if (data) {
				await this.saveDocument(document, JSON.stringify(data, null, 2));
				vscode.window.showInformationMessage(
					"Automa: Saved browser configuration.",
				);
			}
		};

		const messageDisposable = webviewPanel.webview.onDidReceiveMessage(
			async (message: {
				type?: string;
				command?: string;
				action?: string;
				data?: unknown;
				payload?: unknown;
			}) => {
				const action = message?.type || message?.command || message?.action;
				if (action === "saveBrowser" || action === "save") {
					const data = message.data || message.payload;
					await handleSaveBrowser(data);
				} else if (action === "setDefaultBrowser" || action === "setDefault") {
					const browserId =
						(message as { id?: string }).id ||
						((message.data || message.payload) as { id?: string })?.id;
					if (browserId) {
						await vscode.commands.executeCommand(
							"automa.selectDefaultBrowser",
							{ id: browserId },
						);
					}
				} else if (action === "ready") {
					await updateWebview();
				}
			},
		);

		this.setupWebviewPanel(document, webviewPanel, updateWebview, [
			messageDisposable,
			{
				dispose: () => {
					if (BrowserEditorProvider.currentPanel === webviewPanel) {
						BrowserEditorProvider.currentPanel = undefined;
					}
				},
			},
		]);

		await updateWebview();
	}
}
