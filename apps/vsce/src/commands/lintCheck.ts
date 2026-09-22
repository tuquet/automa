import * as vscode from "vscode";
import {
	type LintIssue,
	type LintRequest,
	lintWorkflow,
} from "../core/api/client";
import { DaemonService } from "../core/daemon/DaemonService";
import { LintDiagnosticService } from "../core/services/LintDiagnosticService";
import {
	type ResolvableTarget,
	resolveTargetUri,
} from "../utils/targetResolver";

/**
 * Initializes the Automa Linter diagnostics collection upon extension activation.
 */
export function activateLintDiagnostics(context: vscode.ExtensionContext) {
	LintDiagnosticService.getInstance().initialize(context);
}

/**
 * Resolves the list of JSON file URIs to be linted.
 * Ensures non-JSON active text editors are ignored to avoid invalid lint attempts.
 */
function resolveUrisToProcess(
	nodeOrUri?: ResolvableTarget,
	nodesOrUris?: ResolvableTarget[],
): vscode.Uri[] {
	if (Array.isArray(nodesOrUris) && nodesOrUris.length > 0) {
		return nodesOrUris
			.map((n) => resolveTargetUri(n))
			.filter((uri): uri is vscode.Uri =>
				Boolean(uri?.fsPath.endsWith(".json")),
			);
	}
	if (nodeOrUri) {
		const singleUri = resolveTargetUri(nodeOrUri);
		if (singleUri?.fsPath.endsWith(".json")) {
			return [singleUri];
		}
	}
	const activeEditor = vscode.window.activeTextEditor;
	if (activeEditor?.document.fileName.endsWith(".json")) {
		return [activeEditor.document.uri];
	}
	return [];
}

/**
 * Executes an on-demand, read-only AST lint check on selected workflow JSON files.
 *
 * Strict SOLID & Zero-Combo Invariant:
 * - Read-Only: Only reads AST and reports diagnostics to the VS Code Problems panel.
 * - Zero Auto-Fix: Never modifies file content or node IDs automatically.
 * - Zero Auto-Save: Never invokes workspace edits or document.save().
 * - Zero Auto-Run: Never triggers execution jobs or runs workflows automatically.
 */
export async function lintCheckCommand(
	nodeOrUri?: ResolvableTarget,
	nodesOrUris?: ResolvableTarget[],
	diagnosticService = LintDiagnosticService.getInstance(),
) {
	const urisToProcess = resolveUrisToProcess(nodeOrUri, nodesOrUris);

	if (urisToProcess.length === 0) {
		const uris = await vscode.window.showOpenDialog({
			canSelectMany: true,
			openLabel: "Select Workflow(s) to Lint",
			filters: {
				"JSON files": ["json"],
			},
		});
		if (!uris || uris.length === 0) return;
		urisToProcess.push(...uris);
	}

	await vscode.window.withProgress(
		{
			location: vscode.ProgressLocation.Window,
			title: "Linting Automa Workflow(s)...",
			cancellable: false,
		},
		async () => {
			for (const uri of urisToProcess) {
				const fileName = uri.fsPath.split(/[\\/]/).pop() || uri.fsPath;

				const document = await vscode.workspace.openTextDocument(uri);
				const content = document.getText();

				let parsedWorkflow: Record<string, unknown>;
				try {
					parsedWorkflow = JSON.parse(content);
				} catch (syntaxErr: unknown) {
					const msg =
						syntaxErr instanceof Error ? syntaxErr.message : String(syntaxErr);
					vscode.window.showErrorMessage(
						`[Linter Error] Invalid JSON syntax: ${msg}`,
					);
					return;
				}

				try {
					let issues: LintIssue[] = [];

					try {
						const port = DaemonService.getPort();
						const reqPayload: LintRequest = {
							mode: "editor",
							content: parsedWorkflow,
						};
						const res = await lintWorkflow({
							baseUrl: `http://127.0.0.1:${port}`,
							body: reqPayload,
						});
						if (res.error) throw new Error("Daemon not ready");

						issues = (res.data?.issues as LintIssue[]) || [];
					} catch (err: unknown) {
						const e = err instanceof Error ? err : new Error(String(err));
						vscode.window.showErrorMessage(
							`[Linter Error] Failed to connect to Daemon: ${e.message}`,
						);
						return;
					}

					const diagnostics = diagnosticService.applyDiagnostics(
						uri,
						issues,
						document,
					);

					if (diagnostics.length === 0) {
						vscode.window.showInformationMessage(`Lint passed for ${fileName}`);
					} else {
						const errorCount = diagnostics.filter(
							(d) => d.severity === vscode.DiagnosticSeverity.Error,
						).length;
						const warnCount = diagnostics.length - errorCount;
						const msg = `Lint finished: ${errorCount} error(s), ${warnCount} warning(s) in ${fileName}`;
						if (errorCount > 0) {
							vscode.window.showErrorMessage(msg);
						} else {
							vscode.window.showWarningMessage(msg);
						}
					}
				} catch (error: unknown) {
					const e = error instanceof Error ? error : new Error(String(error));
					vscode.window.showErrorMessage(`Failed to run linter: ${e.message}`);
				}
			}
		},
	);
}
