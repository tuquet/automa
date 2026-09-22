import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as vscode from "vscode";

vi.mock("vscode", () => {
	class TreeItem {
		constructor(
			public readonly label: string,
			public readonly collapsibleState?: number,
		) {}
	}
	class EventEmitter {
		listeners: Array<(data?: unknown) => void> = [];
		constructor() {
			this.listeners = [];
		}
		event = (listener: (data?: unknown) => void) => {
			this.listeners.push(listener);
			return {
				dispose: () => {
					this.listeners = this.listeners.filter((l) => l !== listener);
				},
			};
		};
		fire(data?: unknown) {
			for (const listener of this.listeners) listener(data);
		}
	}
	class ThemeIcon {
		constructor(public id: string) {}
	}

	return {
		window: {
			registerCustomEditorProvider: vi.fn(),
			showInformationMessage: vi.fn(),
			showErrorMessage: vi.fn(),
			setStatusBarMessage: vi.fn().mockReturnValue({ dispose: vi.fn() }),
			registerTreeDataProvider: vi.fn(),
			createWebviewPanel: vi.fn().mockReturnValue({
				webview: {
					html: "",
					onDidReceiveMessage: vi.fn(),
					postMessage: vi.fn(),
				},
				onDidDispose: vi.fn(),
				dispose: vi.fn(),
			}),
			createOutputChannel: vi.fn().mockReturnValue({
				appendLine: vi.fn(),
				show: vi.fn(),
				clear: vi.fn(),
			}),
			withProgress: vi
				.fn()
				.mockImplementation((_options, task) => task({ report: vi.fn() })),
		},
		workspace: {
			fs: { writeFile: vi.fn(), readFile: vi.fn() },
			onDidChangeTextDocument: vi.fn(),
			applyEdit: vi.fn().mockResolvedValue(true),
			workspaceFolders: [{ uri: { fsPath: "/workspace" } }],
			getConfiguration: vi
				.fn()
				.mockReturnValue({ get: vi.fn(), update: vi.fn() }),
			onDidChangeConfiguration: vi.fn(),
		},
		commands: {
			registerCommand: vi.fn(),
			executeCommand: vi.fn().mockResolvedValue(undefined),
		},
		WorkspaceEdit: class {
			replace = vi.fn();
		},
		Range: vi.fn(),
		Position: class Position {
			constructor(
				public line: number,
				public character: number,
			) {}
		},
		Uri: {
			file: vi.fn((p) => ({ fsPath: p, path: p })),
			parse: vi.fn((p) => ({ fsPath: p, path: p })),
			joinPath: vi.fn((uri, ...paths) => ({
				fsPath: `${uri.fsPath}/${paths.join("/")}`,
			})),
		},
		TreeItem,
		EventEmitter,
		ThemeIcon,
		TreeItemCollapsibleState: { None: 0, Collapsed: 1, Expanded: 2 },
		CancellationToken: {},
		ConfigurationTarget: { Global: 1 },
	};
});

import { WorkflowEditorProvider } from "../../providers/WorkflowEditorProvider";

vi.mock("node:fs", () => {
	return {
		existsSync: vi.fn().mockReturnValue(true),
		readFileSync: vi.fn().mockReturnValue(`
            <html>
                <body>
                    <button data-testid="vscode-workflow-preview-run-btn"></button>
                    {{WORKFLOW_DATA}}
                </body>
            </html>
        `),
	};
});

describe("WorkflowEditorProvider", () => {
	let context: vscode.ExtensionContext;
	let webviewPanel: vscode.WebviewPanel;
	let document: vscode.TextDocument;
	let messageCallback: (data: unknown) => Promise<void>;

	beforeEach(() => {
		context = {
			subscriptions: [],
			extensionUri: { fsPath: "/mock/ext" },
		} as unknown as vscode.ExtensionContext;

		messageCallback = async () => {};
		webviewPanel = {
			webview: {
				html: "",
				postMessage: vi.fn(),
				onDidReceiveMessage: vi.fn((cb) => {
					messageCallback = cb;
					return { dispose: vi.fn() };
				}),
				options: {},
			},
			onDidDispose: vi.fn(),
			onDidChangeViewState: vi.fn(),
			title: "",
		} as unknown as vscode.WebviewPanel;

		document = {
			uri: {
				fsPath: "/mock/path/test.workflow.json",
				path: "/mock/path/test.workflow.json",
			},
			getText: vi
				.fn()
				.mockReturnValue(
					JSON.stringify({ name: "Test Workflow", drawflow: {} }),
				),
			save: vi.fn().mockResolvedValue(true),
		} as unknown as vscode.TextDocument;
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should register successfully", () => {
		WorkflowEditorProvider.register(context);
		expect(vscode.window.registerCustomEditorProvider).toHaveBeenCalledWith(
			"automa.workflowEditor",
			expect.any(WorkflowEditorProvider),
			expect.anything(),
		);
		expect(context.subscriptions.length).toBe(1);
	});

	it("should resolve custom text editor and render HTML", async () => {
		const provider = new WorkflowEditorProvider(context);

		await provider.resolveCustomTextEditor(
			document,
			webviewPanel,
			{} as vscode.CancellationToken,
		);

		expect(webviewPanel.webview.onDidReceiveMessage).toHaveBeenCalled();
	});

	it("should handle save workflow properties message", async () => {
		const provider = new WorkflowEditorProvider(context);

		await provider.resolveCustomTextEditor(
			document,
			webviewPanel,
			{} as vscode.CancellationToken,
		);

		await messageCallback({
			command: "saveWorkflow",
			data: { name: "Updated Workflow" },
		});

		expect(vscode.workspace.applyEdit).toHaveBeenCalled();
	});

	it("should never automatically save document to disk when merely opening/resolving editor", async () => {
		const provider = new WorkflowEditorProvider(context);

		// Legacy workflow format that would trigger sanitize
		const legacyDoc = {
			uri: {
				fsPath: "/mock/path/legacy.workflow.json",
				path: "/mock/path/legacy.workflow.json",
			},
			getText: vi.fn().mockReturnValue(
				JSON.stringify({
					name: "Legacy Workflow",
					drawflow: {
						Home: {
							data: {
								"1": { id: "1", name: "trigger" },
							},
						},
					},
				}),
			),
			save: vi.fn().mockResolvedValue(true),
		} as unknown as vscode.TextDocument;

		await provider.resolveCustomTextEditor(
			legacyDoc,
			webviewPanel,
			{} as vscode.CancellationToken,
		);

		// Invariant: Opening a file MUST NOT trigger auto-save or disk mutation combo
		expect(legacyDoc.save).not.toHaveBeenCalled();
	});
});
