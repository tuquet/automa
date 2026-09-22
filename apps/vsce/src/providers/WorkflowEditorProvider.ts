import type { Workflow, WorkflowRunPayload } from "@automa/types";
import * as vscode from "vscode";
import { runWorkflowCommand } from "../commands/runWorkflow";
import { VIEW_TYPES } from "../core/constants";
import { DAEMON_EVENTS } from "../core/constants/events.constants";
import { DaemonService } from "../core/daemon/DaemonService";
import { globalEvents } from "../core/daemon/GlobalSseListener";
import { Logger } from "../core/Logger";
import { WorkflowPayloadBuilder } from "../core/services/preview/WorkflowPayloadBuilder";
import {
	WorkflowSaveService,
	type WorkflowUpdatePayload,
} from "../core/services/preview/WorkflowSaveService";
import { TaskRunner } from "../core/TaskRunner";
import { WebviewHtmlResolver } from "../core/webview/WebviewHtmlResolver";
import { WebSocketService } from "../core/ws/WebSocketService";
import { renderErrorHtml } from "../utils/htmlUtils";
import { BaseCustomEditorProvider } from "./BaseCustomEditorProvider";

export interface WorkflowPreviewIpcMessage {
	type?: string;
	command?: string;
	action?: string;
	jobId?: string;
	keepBrowserOpen?: boolean;
	browserId?: string;
	parameters?: Record<string, unknown>;
	data?: WorkflowRunPayload & Partial<Workflow> & Record<string, unknown>;
	[key: string]: unknown;
}

export class WorkflowEditorProvider
	extends BaseCustomEditorProvider
	implements vscode.CustomTextEditorProvider
{
	public static readonly viewType = VIEW_TYPES.WORKFLOW_EDITOR;
	private saveService = new WorkflowSaveService();
	private htmlResolver: WebviewHtmlResolver;

	public static register(context: vscode.ExtensionContext) {
		context.subscriptions.push(
			vscode.window.registerCustomEditorProvider(
				WorkflowEditorProvider.viewType,
				new WorkflowEditorProvider(context),
				{
					webviewOptions: {
						retainContextWhenHidden: true,
					},
					supportsMultipleEditorsPerDocument: false,
				},
			),
		);
	}

	constructor(context: vscode.ExtensionContext) {
		super(context);
		this.htmlResolver = new WebviewHtmlResolver(context);
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

		let isHtmlInitialized = false;

		const updateWebview = async () => {
			const init = await this.renderWebview(
				document,
				webviewPanel,
				isHtmlInitialized,
			);
			if (init) isHtmlInitialized = true;
		};

		const daemonReadyListener = () => {
			updateWebview();
		};
		const daemonStoppedListener = () => {
			updateWebview();
		};

		globalEvents.on(DAEMON_EVENTS.READY, daemonReadyListener);
		globalEvents.on(DAEMON_EVENTS.STOPPED, daemonStoppedListener);

		const handleRunWorkflow = async (msg: WorkflowPreviewIpcMessage) => {
			const telemetryListener = (data: {
				taskId?: string;
				type?: string;
				message?: string;
				data?: unknown;
			}) => {
				if (data?.message) {
					webviewPanel.webview.postMessage?.({
						type: "task:log",
						data: {
							timestamp: new Date().toLocaleTimeString(),
							level:
								data.message.toLowerCase().includes("error") ||
								data.message.toLowerCase().includes("failed")
									? "error"
									: data.message.toLowerCase().includes("warn")
										? "warn"
										: "info",
							message: data.message,
						},
					});
				}
			};

			TaskRunner.telemetryEmitter.on("telemetry", telemetryListener);

			try {
				webviewPanel.webview.postMessage?.({ type: "task:started" });
				const params = msg.data?.parameters || msg.parameters;
				const keepBrowserOpen = Boolean(
					msg.data?.keepBrowserOpen ?? msg.keepBrowserOpen ?? true,
				);
				const browserId = (msg.data?.browserId || msg.browserId) as
					| string
					| undefined;
				await runWorkflowCommand(document.uri, params, {
					keepBrowserOpen,
					browserId: browserId || "daemon_worker",
				});
			} catch (err: unknown) {
				const errorMsg = err instanceof Error ? err.message : String(err);
				webviewPanel.webview.postMessage?.({
					type: "task:error",
					error: errorMsg,
				});
			} finally {
				TaskRunner.telemetryEmitter.off("telemetry", telemetryListener);
				webviewPanel.webview.postMessage?.({ type: "task:completed" });
			}
		};

		const handleSaveWorkflow = async (msg: WorkflowPreviewIpcMessage) => {
			await this.saveService.handleSaveWorkflow(
				document,
				(msg.data || {}) as WorkflowUpdatePayload,
				async (doc, content) => this.saveDocument(doc, content),
			);
		};

		const handlePickFile = async () => {
			const uris = await vscode.window.showOpenDialog({
				canSelectFiles: true,
				canSelectMany: false,
				filters: {
					"Automa Workflows": ["workflow.json", "automa.json", "json"],
				},
			});
			if (uris?.[0]) {
				await vscode.commands.executeCommand(
					"vscode.openWith",
					uris[0],
					WorkflowEditorProvider.viewType,
				);
			}
		};

		const handlers: Record<
			string,
			(msg: WorkflowPreviewIpcMessage) => Promise<void>
		> = {
			ready: async () => {
				await updateWebview();
			},
			runWorkflow: async (msg) => handleRunWorkflow(msg),
			"automa:run-workflow": async (msg) => handleRunWorkflow(msg),
			stopWorkflow: async () => {
				webviewPanel.webview.postMessage?.({ type: "task:completed" });
			},
			showOutput: async () => {
				Logger.getOutputChannel()?.show(false);
			},
			saveWorkflow: async (msg) => handleSaveWorkflow(msg),
			"automa:workflow-changed": async (msg) => handleSaveWorkflow(msg),
			"automa:workflow-deleted": async () => {
				await vscode.commands.executeCommand("automa.refreshWorkspace");
			},
			"automa:pick-file": async () => handlePickFile(),
			pickWorkflowFile: async () => handlePickFile(),
			pauseWorkflow: async (msg) => {
				const jobId = typeof msg?.jobId === "string" ? msg.jobId : "";
				if (jobId) {
					WebSocketService.getInstance().pauseJob(jobId);
				}
			},
			resumeWorkflow: async (msg) => {
				const jobId = typeof msg?.jobId === "string" ? msg.jobId : "";
				if (jobId) {
					WebSocketService.getInstance().resumeJob(jobId);
				}
			},
			viewLogs: async () => {
				await vscode.commands.executeCommand("automa.showLiveLog");
			},
			openInStudio: async () => {
				await vscode.commands.executeCommand(
					"automa.openInStudio",
					document.uri,
				);
			},
			toggleDaemon: async () => {
				await vscode.commands.executeCommand("automa.toggleDaemon");
			},
			startDaemon: async () => {
				await vscode.commands.executeCommand("automa.toggleDaemon");
			},
		};

		const messageDisposable = webviewPanel.webview.onDidReceiveMessage(
			async (message: WorkflowPreviewIpcMessage) => {
				try {
					if (!message || typeof message !== "object") return;
					const cmd = message.type || message.command || message.action;
					if (cmd && Object.hasOwn(handlers, cmd)) {
						const handler = handlers[cmd];
						if (typeof handler === "function") {
							await handler(message);
						}
					}
				} catch (err: unknown) {
					const e = err instanceof Error ? err.message : String(err);
					vscode.window.showErrorMessage(`Workflow preview action error: ${e}`);
				}
			},
		);

		this.setupWebviewPanel(document, webviewPanel, updateWebview, [
			messageDisposable,
			{
				dispose: () => {
					globalEvents.off(DAEMON_EVENTS.READY, daemonReadyListener);
					globalEvents.off(DAEMON_EVENTS.STOPPED, daemonStoppedListener);
				},
			},
		]);

		await updateWebview();
	}

	private async renderWebview(
		document: vscode.TextDocument,
		webviewPanel: vscode.WebviewPanel,
		isHtmlInitialized = false,
	): Promise<boolean> {
		try {
			const config = vscode.workspace.getConfiguration("automa", document.uri);
			const globalVariables =
				config.get<Record<string, unknown>>("run.globalVariables", {}) || {};
			const daemonPort = DaemonService.getPort() || 8765;
			const isDaemonRunning = DaemonService.isRunning();

			const payload = WorkflowPayloadBuilder.buildPayload(
				document,
				globalVariables,
				daemonPort,
				isDaemonRunning,
			);

			if (
				!(
					(payload.data.drawflow as Record<string, unknown>)?.nodes &&
					(payload.data.drawflow as Record<string, unknown>).edges
				) &&
				Array.isArray(payload.data)
			) {
				webviewPanel.webview.html = `<body><h2>Not an Automa workflow</h2><p>This JSON file does not appear to be an Automa workflow.</p></body>`;
				return false;
			}

			webviewPanel.title = `Preview: ${(payload.data.name as string) || "Workflow"}`;

			if (!isHtmlInitialized || !webviewPanel.webview.html) {
				webviewPanel.webview.html = this.htmlResolver.resolveHtml(
					webviewPanel.webview,
					{
						viewType: "workflow",
						payload,
					},
				);
				return true;
			}

			webviewPanel.webview.postMessage({
				type: "updateData",
				payload,
			});
			webviewPanel.webview.postMessage({
				type: "automa:set-workflow",
				data: payload.data,
			});
			return true;
		} catch (error: unknown) {
			const e = error instanceof Error ? error : new Error(String(error));
			if (!isHtmlInitialized) {
				webviewPanel.webview.html = renderErrorHtml(
					"Error reading workflow",
					e.message,
				);
			}
			return false;
		}
	}
}
