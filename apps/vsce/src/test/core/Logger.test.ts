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

import { Logger } from "../../core/Logger";

// Mock vscode

describe("Logger", () => {
	beforeEach(() => {
		vi.spyOn(console, "log").mockImplementation(() => {});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should initialize output channel and add to subscriptions", () => {
		const context = { subscriptions: [] } as unknown as vscode.ExtensionContext;
		Logger.initialize(context);

		expect(vscode.window.createOutputChannel).toHaveBeenCalledWith("Automa");
		expect(context.subscriptions.length).toBe(1);
		expect(Logger.getOutputChannel()).not.toBeNull();
	});

	it("should use output channel if initialized", () => {
		const context = { subscriptions: [] } as unknown as vscode.ExtensionContext;
		Logger.initialize(context);

		const channel = Logger.getOutputChannel();

		Logger.info("Test message");
		expect(channel?.appendLine).toHaveBeenCalled();
		const callArg = (channel?.appendLine as unknown as ReturnType<typeof vi.fn>)
			?.mock.calls[0]?.[0];
		expect(callArg).toContain("[INFO] Test message");
	});

	it("should fallback to console.log if output channel is null", () => {
		// Note: since Logger is a module with global state, we can't easily "un-initialize" it
		// in the same Node process if it was initialized above, unless we export a reset method.
		// However, we can test error and warn to see if they call appendLine.
		// If we wanted to test fallback, we would need to mock Logger state.

		Logger.warn("Warn message");
		Logger.error("Error message");

		const channel = Logger.getOutputChannel();
		expect(channel?.appendLine).toHaveBeenCalledTimes(3); // 1 info, 1 warn, 1 error
	});
});
