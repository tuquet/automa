import * as fs from "node:fs/promises";
import type { LogEditorMessage } from "@automa/types";
import type { JobDetails } from "@automa/types/api";
import * as vscode from "vscode";
import { getJobExecutionLogs } from "../core/api/client";
import { VIEW_TYPES } from "../core/constants";
import { DaemonService } from "../core/daemon/DaemonService";
import { AutomaDbFileSystemProvider } from "../core/services/AutomaDbFileSystemProvider";
import { WebviewHtmlResolver } from "../core/webview/WebviewHtmlResolver";
import { renderErrorHtml } from "../utils/htmlUtils";
import { BaseCustomEditorProvider } from "./BaseCustomEditorProvider";

interface ParsedLogResponse {
	error?: string;
	job?: JobDetails;
	logs?: Record<string, unknown>[];
	results?: Record<string, unknown>;
}

export class LogEditorProvider
	extends BaseCustomEditorProvider
	implements vscode.CustomReadonlyEditorProvider
{
	public static readonly viewType = VIEW_TYPES.LOG_EDITOR;
	private htmlResolver: WebviewHtmlResolver;

	public static register(context: vscode.ExtensionContext) {
		context.subscriptions.push(
			vscode.window.registerCustomEditorProvider(
				LogEditorProvider.viewType,
				new LogEditorProvider(context),
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

	public async openCustomDocument(
		uri: vscode.Uri,
		_openContext: vscode.CustomDocumentOpenContext,
		_token: vscode.CancellationToken,
	): Promise<vscode.CustomDocument> {
		return { uri, dispose: () => {} };
	}

	private static async fetchLogFromDaemon(
		jobId: string,
	): Promise<ParsedLogResponse> {
		try {
			if (!DaemonService.isRunning()) {
				throw new Error("Daemon is not running");
			}

			const res = await getJobExecutionLogs({
				path: {
					job_id: jobId,
				},
			});

			if (res.error) {
				throw new Error("Failed to fetch log");
			}

			const data = res.data;
			return {
				error: data?.error || undefined,
				job: data?.job as JobDetails | undefined,
				logs: data?.logs as Record<string, unknown>[] | undefined,
				results: data?.results as Record<string, unknown> | undefined,
			};
		} catch (err: unknown) {
			const e = err instanceof Error ? err : new Error(String(err));
			return { error: `Failed to fetch log: ${e.message}` };
		}
	}

	private static async handleOpenWorkflowMessage(e: LogEditorMessage) {
		if (e.command === "open-workflow" && e.id) {
			try {
				const workflowUri = AutomaDbFileSystemProvider.createWorkflowUri(e.id);
				const doc = await vscode.workspace.openTextDocument(workflowUri);
				await vscode.window.showTextDocument(doc);
			} catch (_err) {
				vscode.window.showWarningMessage(
					`Could not find workflow or package with ID: ${e.id}`,
				);
			}
		}
	}

	public static async showLogPreview(
		context: vscode.ExtensionContext,
		uri: vscode.Uri,
	) {
		let jobId = "";
		let isLive = false;

		if (uri.scheme === "automa-log") {
			jobId = uri.authority || uri.path.replace(/^\//, "");
			isLive = true;
		} else if (uri.scheme === "file") {
			try {
				const content = await fs.readFile(uri.fsPath, "utf-8");
				const parsed = JSON.parse(content);
				jobId = parsed.job?.id || "";
			} catch (e) {
				vscode.window.showErrorMessage(
					`Failed to parse log file: ${(e as Error).message}`,
				);
				return;
			}
		}

		if (!jobId || !/^[a-zA-Z0-9_-]+$/.test(jobId)) {
			vscode.window.showErrorMessage(
				"Could not determine valid Job ID from URI.",
			);
			return;
		}

		const panel = vscode.window.createWebviewPanel(
			"automa.logPreview",
			`Log: ${jobId.substring(0, 8)}`,
			vscode.ViewColumn.Active,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
				localResourceRoots: [context.extensionUri],
			},
		);

		try {
			const parsed = await LogEditorProvider.fetchLogFromDaemon(jobId);
			const job: Record<string, unknown> = parsed.job || {
				name: "Unknown",
				id: jobId,
				status: "unknown",
				created_at: new Date().toISOString(),
			};
			const logs = parsed.logs || [];
			const results = parsed.results || { table: [], variables: {} };
			job.results = results;

			const resolver = new WebviewHtmlResolver(context);
			panel.webview.html = resolver.resolveHtml(panel.webview, {
				viewType: "logs",
				payload: { job, logs, isLive },
			});

			panel.webview.onDidReceiveMessage(async (e: LogEditorMessage) => {
				await LogEditorProvider.handleOpenWorkflowMessage(e);
			});
		} catch (error: unknown) {
			const e = error instanceof Error ? error : new Error(String(error));
			panel.webview.html = renderErrorHtml("Failed to load log", e.message);
		}
	}

	public async resolveCustomEditor(
		document: vscode.CustomDocument,
		webviewPanel: vscode.WebviewPanel,
		_token: vscode.CancellationToken,
	): Promise<void> {
		webviewPanel.webview.options = {
			enableScripts: true,
			localResourceRoots: [this.context.extensionUri],
		};

		const updateWebview = async () => {
			try {
				const content = await fs.readFile(document.uri.fsPath, "utf-8");
				const parsed = JSON.parse(content);
				const job: JobDetails = parsed.job || {
					name: "Unknown Workflow",
					id: "N/A",
					status: "unknown",
					created_at: new Date().toISOString(),
				};
				const logs = parsed.logs || [];
				const results = parsed.results || { table: [], variables: {} };
				job.results = results;

				webviewPanel.webview.html = this.htmlResolver.resolveHtml(
					webviewPanel.webview,
					{
						viewType: "logs",
						payload: { job, logs },
					},
				);
			} catch (error: unknown) {
				const e = error instanceof Error ? error : new Error(String(error));
				webviewPanel.webview.html = renderErrorHtml(
					"Failed to load log",
					e.message,
				);
			}
		};

		webviewPanel.webview.onDidReceiveMessage(async (e: LogEditorMessage) => {
			await LogEditorProvider.handleOpenWorkflowMessage(e);
		});

		this.setupWebviewPanel(document, webviewPanel, updateWebview);
		await updateWebview();
	}
}
