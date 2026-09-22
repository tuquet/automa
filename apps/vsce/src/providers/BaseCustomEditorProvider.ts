import * as path from "node:path";
import * as vscode from "vscode";

/**
 * Common Base Class for all custom editor webview panels.
 * Encapsulates script options, resource roots, and disposable lifecycle.
 */
export abstract class BaseCustomEditorProvider {
	protected internalSaves = new Set<string>();

	constructor(protected readonly context: vscode.ExtensionContext) {}

	protected setupWebviewPanel(
		document: vscode.TextDocument | vscode.CustomDocument,
		webviewPanel: vscode.WebviewPanel,
		updateWebview: () => void | Promise<void>,
		additionalDisposables: vscode.Disposable[] = [],
	): void {
		webviewPanel.webview.options = {
			enableScripts: true,
			localResourceRoots: [this.context.extensionUri],
		};

		const activeTimers = new Set<NodeJS.Timeout>();
		const changeDisposable = this.createDocumentWatcher(
			document,
			updateWebview,
			activeTimers,
		);

		webviewPanel.onDidDispose(() => {
			for (const timer of activeTimers) {
				clearTimeout(timer);
			}
			activeTimers.clear();
			changeDisposable.dispose();
			for (const d of additionalDisposables) {
				d.dispose();
			}
		});
	}

	private createDocumentWatcher(
		document: vscode.TextDocument | vscode.CustomDocument,
		updateWebview: () => void | Promise<void>,
		activeTimers: Set<NodeJS.Timeout>,
	): vscode.Disposable {
		if ("getText" in document) {
			return this.watchTextDocument(document, updateWebview);
		}
		return this.watchCustomDocument(document, updateWebview, activeTimers);
	}

	private watchTextDocument(
		document: vscode.TextDocument,
		updateWebview: () => void | Promise<void>,
	): vscode.Disposable {
		const uriStr = document.uri.toString();
		return vscode.workspace.onDidChangeTextDocument((e) => {
			if (
				e.document.uri.toString() === uriStr &&
				!this.internalSaves.has(uriStr)
			) {
				void updateWebview();
			}
		});
	}

	private watchCustomDocument(
		document: vscode.CustomDocument,
		updateWebview: () => void | Promise<void>,
		activeTimers: Set<NodeJS.Timeout>,
	): vscode.Disposable {
		const watcher = vscode.workspace.createFileSystemWatcher(
			new vscode.RelativePattern(
				vscode.Uri.file(path.dirname(document.uri.fsPath)),
				path.basename(document.uri.fsPath),
			),
		);
		const uriStr = document.uri.toString();
		let debounceTimer: NodeJS.Timeout | undefined;

		const handleChange = () => {
			if (this.internalSaves.has(uriStr)) return;
			if (debounceTimer) {
				clearTimeout(debounceTimer);
				activeTimers.delete(debounceTimer);
			}
			debounceTimer = setTimeout(() => {
				if (debounceTimer) activeTimers.delete(debounceTimer);
				debounceTimer = undefined;
				void updateWebview();
			}, 50);
			activeTimers.add(debounceTimer);
		};

		const changeSub = watcher.onDidChange(handleChange);
		const createSub = watcher.onDidCreate(handleChange);

		return {
			dispose: () => {
				changeSub.dispose();
				createSub.dispose();
				watcher.dispose();
			},
		};
	}

	protected async saveDocument(
		document: vscode.TextDocument,
		content: string,
	): Promise<boolean> {
		const uriStr = document.uri.toString();
		this.internalSaves.add(uriStr);
		try {
			const lastLine = document.lineCount > 0 ? document.lineCount - 1 : 0;
			const lastChar =
				document.lineCount > 0 ? document.lineAt(lastLine).text.length : 0;
			const edit = new vscode.WorkspaceEdit();
			edit.replace(
				document.uri,
				new vscode.Range(0, 0, lastLine, lastChar),
				content,
			);
			const success = await vscode.workspace.applyEdit(edit);
			if (success) {
				await document.save();
			}
			return success;
		} finally {
			setTimeout(() => {
				this.internalSaves.delete(uriStr);
			}, 300);
		}
	}
}

/**
 * Specialized base class for editable text-document-based custom editors.
 */
export abstract class BaseCustomTextEditorProvider extends BaseCustomEditorProvider {}

/**
 * Specialized base class for read-only custom editors.
 */
export abstract class BaseCustomReadonlyEditorProvider extends BaseCustomEditorProvider {
	protected override async saveDocument(
		_document: vscode.TextDocument,
		_content: string,
	): Promise<boolean> {
		throw new Error("Save is not supported for read-only custom editors.");
	}
}
