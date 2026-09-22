import type { LintIssue } from "@automa/types/api";
import * as vscode from "vscode";
import { lintWorkflow } from "../api/client";
import { DaemonService } from "../daemon/DaemonService";

export class LintDiagnosticService {
	private static instance: LintDiagnosticService;
	private diagnosticCollection?: vscode.DiagnosticCollection;

	public static getInstance(): LintDiagnosticService {
		if (!LintDiagnosticService.instance) {
			LintDiagnosticService.instance = new LintDiagnosticService();
		}
		return LintDiagnosticService.instance;
	}

	/**
	 * Initializes the diagnostic collection and registers it with the extension context.
	 */
	public initialize(context: vscode.ExtensionContext): void {
		if (!this.diagnosticCollection) {
			this.diagnosticCollection =
				vscode.languages.createDiagnosticCollection("automa-lint");
			context.subscriptions.push(this.diagnosticCollection);
		}
	}

	/**
	 * Returns the underlying diagnostic collection.
	 */
	public getCollection(): vscode.DiagnosticCollection {
		if (!this.diagnosticCollection) {
			this.diagnosticCollection =
				vscode.languages.createDiagnosticCollection("automa-lint");
		}
		return this.diagnosticCollection;
	}

	/**
	 * Sets the diagnostic collection explicitly (useful for testing and dependency injection).
	 */
	public setCollection(collection: vscode.DiagnosticCollection): void {
		this.diagnosticCollection = collection;
	}

	/**
	 * Maps structured API LintIssue[] directly to vscode.Diagnostic[] with precise line ranges and codes.
	 */
	public createDiagnosticsFromIssues(
		issues: LintIssue[],
		document: vscode.TextDocument,
	): vscode.Diagnostic[] {
		const diagnostics: vscode.Diagnostic[] = [];
		const text = document.getText();
		const lines = text.split("\n");

		for (const issue of issues) {
			const severity =
				issue.severity === "error"
					? vscode.DiagnosticSeverity.Error
					: vscode.DiagnosticSeverity.Warning;

			let range = new vscode.Range(0, 0, 0, 0);
			let searchKey = "";

			if (issue.nodeId) {
				searchKey = `"${issue.nodeId}"`;
			} else if (issue.path) {
				const lastPart = issue.path
					.split(".")
					.pop()
					?.replace(/\[\d+\]/g, "");
				if (lastPart) {
					searchKey = `"${lastPart}"`;
				}
			}

			if (searchKey) {
				for (let i = 0; i < lines.length; i++) {
					const line = lines[i];
					if (!line) continue;
					const col = line.indexOf(searchKey);
					if (col !== -1) {
						range = new vscode.Range(i, col, i, col + searchKey.length);
						break;
					}
				}
			}

			const diagnostic = new vscode.Diagnostic(range, issue.message, severity);
			if (issue.code) {
				diagnostic.code = issue.code;
			}
			diagnostic.source = "Automa";
			diagnostics.push(diagnostic);
		}

		return diagnostics;
	}

	/**
	 * Applies diagnostics to the target document URI and returns the created diagnostics.
	 */
	public applyDiagnostics(
		uri: vscode.Uri,
		issues: LintIssue[],
		document: vscode.TextDocument,
	): vscode.Diagnostic[] {
		const diagnostics = this.createDiagnosticsFromIssues(issues, document);
		this.getCollection().set(uri, diagnostics);
		return diagnostics;
	}

	/**
	 * Clears diagnostics for a specific URI or all diagnostics.
	 */
	public clear(uri?: vscode.Uri): void {
		if (!this.diagnosticCollection) return;
		if (uri) {
			this.diagnosticCollection.delete(uri);
		} else {
			this.diagnosticCollection.clear();
		}
	}

	/**
	 * Automatically lints a workflow JSON document and refreshes its problems diagnostics.
	 */
	public async autoLint(document: vscode.TextDocument): Promise<void> {
		const fileName = document.fileName.toLowerCase();
		const isWorkflow =
			fileName.endsWith(".workflow.json") ||
			(document.uri.scheme === "automa-db" &&
				document.uri.path.startsWith("/workflows/"));

		if (!isWorkflow) return;
		if (!DaemonService.isRunning()) return;

		try {
			const text = document.getText();
			if (!text.trim()) return;
			const parsed = JSON.parse(text) as Record<string, unknown>;
			const res = await lintWorkflow({
				body: { mode: "editor", content: parsed },
			});
			if (res.data?.issues) {
				this.applyDiagnostics(document.uri, res.data.issues, document);
			} else {
				this.clear(document.uri);
			}
		} catch {
			// Ignore transient JSON parse errors during active typing
		}
	}

	/**
	 * Disposes the diagnostic collection.
	 */
	public dispose(): void {
		this.diagnosticCollection?.dispose();
		this.diagnosticCollection = undefined;
	}
}
