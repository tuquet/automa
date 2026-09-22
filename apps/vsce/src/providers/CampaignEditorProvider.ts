import type { Campaign } from "@automa/types";
import * as vscode from "vscode";
import * as api from "../core/api/client";
import { VIEW_TYPES } from "../core/constants";
import { Logger } from "../core/Logger";
import { TaskRunner } from "../core/TaskRunner";
import { WebviewHtmlResolver } from "../core/webview/WebviewHtmlResolver";
import { BaseCustomEditorProvider } from "./BaseCustomEditorProvider";

export class CampaignEditorProvider
	extends BaseCustomEditorProvider
	implements vscode.CustomTextEditorProvider
{
	public static readonly viewType = VIEW_TYPES.CAMPAIGN_EDITOR;
	private htmlResolver: WebviewHtmlResolver;

	constructor(context: vscode.ExtensionContext) {
		super(context);
		this.htmlResolver = new WebviewHtmlResolver(context);
	}

	public static register(context: vscode.ExtensionContext) {
		context.subscriptions.push(
			vscode.window.registerCustomEditorProvider(
				CampaignEditorProvider.viewType,
				new CampaignEditorProvider(context),
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
		webviewPanel.webview.options = {
			enableScripts: true,
			localResourceRoots: [this.context.extensionUri],
		};

		let campaignData: Partial<Campaign> = {};
		try {
			campaignData = JSON.parse(document.getText()) as Partial<Campaign>;
		} catch (e: unknown) {
			Logger.warn(
				`Failed to parse campaign JSON from ${document.uri.fsPath}: ${e}`,
			);
		}

		const workflows = await this.getWorkflowDictionary();
		const browsers = await this.getBrowserDictionary();

		webviewPanel.webview.html = this.htmlResolver.resolveHtml(
			webviewPanel.webview,
			{
				viewType: "campaign",
				payload: {
					filePath: document.uri.fsPath,
					data: campaignData,
					workflows,
					browsers,
				},
			},
		);

		const updateWebview = async () => {
			let data: Partial<Campaign> = {};
			try {
				data = JSON.parse(document.getText()) as Partial<Campaign>;
			} catch (e: unknown) {
				Logger.warn(
					`Failed to parse updated campaign JSON from ${document.uri.fsPath}: ${e}`,
				);
			}

			const workflows = await this.getWorkflowDictionary();
			const browsers = await this.getBrowserDictionary();
			webviewPanel.webview.postMessage({
				type: "updateData",
				payload: {
					filePath: document.uri.fsPath,
					data,
					workflows,
					browsers,
				},
			});
		};

		// Listen to telemetry
		const telemetryListener = (telemetry: unknown) => {
			webviewPanel.webview.postMessage({
				type: "custom",
				event: "telemetry",
				payload: telemetry,
			});
		};

		TaskRunner.telemetryEmitter.on("telemetry", telemetryListener);

		const handleRunCampaign = async (msg: Record<string, unknown>) => {
			await vscode.commands.executeCommand("automa.runCampaign", document.uri, {
				keepBrowserOpen: Boolean(msg.keepBrowserOpen),
			});
			webviewPanel.webview.postMessage({ type: "taskCompleted" });
		};

		const handleSaveCampaign = async (msg: Record<string, unknown>) => {
			const data = (msg.data || msg.payload) as Partial<Campaign> | undefined;
			if (data) {
				await this.saveDocument(document, JSON.stringify(data, null, 2));
				vscode.window.setStatusBarMessage("$(check) Campaign saved", 2000);
			}
		};

		// Event Router handlers
		const eventHandlers: Record<
			string,
			(msg: Record<string, unknown>) => Promise<void>
		> = {
			ready: async () => {
				await updateWebview();
			},
			runCampaign: async (msg) => handleRunCampaign(msg),
			"run-campaign": async (msg) => handleRunCampaign(msg),
			"stop-campaign": async () => {
				await vscode.commands.executeCommand(
					"automa.stopCampaign",
					document.uri,
				);
			},
			stopCampaign: async () => {
				await vscode.commands.executeCommand(
					"automa.stopCampaign",
					document.uri,
				);
			},
			"open-workflow": async (msg) => {
				const workflowPath = msg.path as string;
				if (workflowPath) {
					const docUri = vscode.Uri.file(workflowPath);
					await vscode.commands.executeCommand(
						"vscode.openWith",
						docUri,
						VIEW_TYPES.WORKFLOW_EDITOR,
					);
				}
			},
			"save-campaign": async (msg) => handleSaveCampaign(msg),
			saveCampaign: async (msg) => handleSaveCampaign(msg),

			"pick-workflow-file": async () => {
				const uris = await vscode.window.showOpenDialog({
					canSelectFiles: true,
					canSelectMany: false,
					filters: {
						"Automa Workflows": ["workflow.json", "automa.json", "json"],
					},
				});
				if (uris?.[0]) {
					webviewPanel.webview.postMessage({
						type: "workflowFilePicked",
						path: uris[0].fsPath,
					});
				}
			},
		};

		// Listen to messages from webview with safe try/catch
		webviewPanel.webview.onDidReceiveMessage(
			async (e: Record<string, unknown>) => {
				try {
					const cmd = String(e.command || e.type || e.action || "");
					const handler =
						cmd && Object.hasOwn(eventHandlers, cmd)
							? eventHandlers[cmd]
							: undefined;
					if (handler) {
						await handler(e);
					}
				} catch (err: unknown) {
					const errorMsg = err instanceof Error ? err.message : String(err);
					vscode.window.showErrorMessage(`Campaign action error: ${errorMsg}`);
				}
			},
		);

		this.setupWebviewPanel(document, webviewPanel, updateWebview, [
			{
				dispose: () => {
					TaskRunner.telemetryEmitter.off("telemetry", telemetryListener);
				},
			},
		]);
	}

	private async getWorkflowDictionary(): Promise<Record<string, string>> {
		const dict: Record<string, string> = {};
		try {
			const res = await api.getStorageWorkflows();
			if (res.data && Array.isArray(res.data)) {
				for (const wf of res.data) {
					dict[wf.id] = wf.name || wf.id;
				}
			}
		} catch (_err) {}
		return dict;
	}

	private async getBrowserDictionary(): Promise<Record<string, string>> {
		const dict: Record<string, string> = {};
		try {
			const res = await api.getBrowsers();
			if (res.data) {
				for (const b of res.data) {
					dict[b.id] = b.name || b.id;
				}
			}
		} catch (_err) {}
		return dict;
	}
}
