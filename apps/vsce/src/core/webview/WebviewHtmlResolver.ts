import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import * as vscode from "vscode";
import { escapeHtml } from "../../utils/htmlUtils";

export { escapeHtml };

export type WebviewViewType =
	| "dashboard"
	| "browsers"
	| "workflow"
	| "campaign"
	| "logs"
	| "table";

export interface WebviewRenderOptions {
	viewType: WebviewViewType;
	payload?: unknown;
	title?: string;
}

export class WebviewHtmlResolver {
	constructor(private readonly context: vscode.ExtensionContext) {}

	/**
	 * Resolves HTML for the Automa Studio Webview Canvas directly from automa-webe/dist/studio.
	 * Reuses the canonical Studio build artifact adhering to the Monorepo Reusability Invariant.
	 */
	public resolveStudioHtml(
		webview: vscode.Webview,
		initialWorkflow?: unknown,
	): string {
		const candidatePaths = [
			path.join(this.context.extensionPath || "", "dist", "studio"),
			path.resolve(
				this.context.extensionPath || "",
				"../automa-webe/dist/studio",
			),
			path.resolve(__dirname, "../../dist/studio"),
			path.resolve(__dirname, "../../../automa-webe/dist/studio"),
		];

		const studioDistPath = candidatePaths.find((p) =>
			fs.existsSync(path.join(p, "index.html")),
		);

		if (!studioDistPath) {
			return `<!DOCTYPE html>
			<html lang="en">
			<head>
				<style>
					body { font-family: var(--vscode-font-family); padding: 24px; background: var(--vscode-editor-background); color: var(--vscode-editor-foreground); }
					.card { border: 1px solid var(--vscode-errorForeground); padding: 18px; border-radius: 6px; }
				</style>
			</head>
			<body>
				<div class="card">
					<h3>⚠️ Automa Studio Bundle Not Found</h3>
					<p>Could not locate the compiled Studio bundle at <code>automa-webe/dist/studio</code>.</p>
					<p>Please run <code>pnpm run build:studio</code> in <code>automa-webe</code> or <code>pnpm run dev:all</code>.</p>
				</div>
			</body>
			</html>`;
		}

		const indexPath = path.join(studioDistPath, "index.html");
		let html = fs.readFileSync(indexPath, "utf-8");
		const nonce = crypto.randomBytes(16).toString("hex");

		// Configure webview localResourceRoots
		webview.options = {
			enableScripts: true,
			localResourceRoots: [vscode.Uri.file(studioDistPath)],
		};

		// Rewrite relative asset URLs (./..., assets/...)
		html = html.replace(/(src|href)="\.?\/([^"]+)"/g, (_, attr, file) => {
			const assetUri = webview.asWebviewUri(
				vscode.Uri.file(path.join(studioDistPath, file)),
			);
			return `${attr}="${assetUri.toString()}"`;
		});

		// Inject nonce into all script tags
		html = html.replace(/<script\b([^>]*)>/gi, (match, rest) => {
			if (rest.includes("nonce=")) return match;
			return `<script nonce="${nonce}"${rest}>`;
		});

		// Inject initial workflow if provided
		const safeWorkflowJson = JSON.stringify(initialWorkflow || null).replace(
			/<\/script>/gi,
			"<\\/script>",
		);
		const initialScript = `<script nonce="${nonce}">window.__AUTOMA_WORKFLOW__ = ${safeWorkflowJson};</script>`;

		// Inject CSP
		const cspSource = webview.cspSource || "";
		const cspMeta = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}' 'unsafe-eval' ${cspSource}; img-src ${cspSource} data: blob: https:; font-src ${cspSource} data:; connect-src ${cspSource} http://127.0.0.1:* http://localhost:* ws://127.0.0.1:* ws://localhost:*; frame-src ${cspSource} http://127.0.0.1:* http://localhost:*; border-src ${cspSource};">`;

		if (html.includes("<head>")) {
			html = html.replace(
				"<head>",
				`<head>\n    ${cspMeta}\n    ${initialScript}`,
			);
		} else {
			html = `${cspMeta}\n${initialScript}\n${html}`;
		}

		return html;
	}

	/**
	 * Unified compatibility method delegating to Studio HTML resolution
	 */
	public resolveHtml(
		webview: vscode.Webview,
		options: WebviewRenderOptions,
	): string {
		return this.resolveStudioHtml(webview, options.payload);
	}
}
