import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as vscode from "vscode";
import { WelcomePanel } from "../../panels/WelcomePanel";

vi.mock("vscode", () => {
	class MockUri {
		public fsPath: string;
		public path: string;
		constructor(p: string) {
			this.fsPath = p;
			this.path = p;
		}
		static file(p: string) {
			return new MockUri(p);
		}
		static parse(p: string) {
			return new MockUri(p);
		}
		static joinPath(uri: { fsPath: string }, ...paths: string[]) {
			return new MockUri(`${uri.fsPath}/${paths.join("/")}`);
		}
	}

	const mockWebview = {
		html: "",
		onDidReceiveMessage: vi.fn(),
		postMessage: vi.fn(),
	};
	const mockPanel = {
		webview: mockWebview,
		onDidDispose: vi.fn(),
		dispose: vi.fn(),
		reveal: vi.fn(),
	};
	return {
		window: {
			createWebviewPanel: vi.fn().mockReturnValue(mockPanel),
			activeTextEditor: undefined,
			createOutputChannel: vi.fn().mockReturnValue({
				appendLine: vi.fn(),
				show: vi.fn(),
				clear: vi.fn(),
			}),
			showInformationMessage: vi.fn(),
			showErrorMessage: vi.fn(),
			showWarningMessage: vi.fn(),
			showOpenDialog: vi.fn().mockResolvedValue([]),
			withProgress: vi.fn().mockImplementation(async (_options, task) => {
				return await task({ report: vi.fn() });
			}),
		},
		workspace: {
			getConfiguration: vi
				.fn()
				.mockReturnValue({ get: vi.fn(), update: vi.fn() }),
			onDidChangeConfiguration: vi.fn(),
			openTextDocument: vi.fn(),
		},
		commands: {
			registerCommand: vi.fn(),
			executeCommand: vi.fn().mockResolvedValue(undefined),
		},
		languages: {
			createDiagnosticCollection: vi
				.fn()
				.mockReturnValue({ set: vi.fn(), clear: vi.fn(), dispose: vi.fn() }),
		},
		Uri: MockUri,
		ProgressLocation: { Window: 1 },
		DiagnosticSeverity: { Error: 0, Warning: 1, Information: 2, Hint: 3 },
		ViewColumn: { One: 1 },
	};
});

describe("WelcomePanel", () => {
	let extensionUri: vscode.Uri;

	beforeEach(() => {
		extensionUri = vscode.Uri.file("/extension/path");
		WelcomePanel.currentPanel = undefined; // Reset state
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("should create a new panel if none exists", () => {
		WelcomePanel.createOrShow(extensionUri);

		expect(vscode.window.createWebviewPanel).toHaveBeenCalledWith(
			"automa.welcomePanel",
			"Welcome to Automa",
			vscode.ViewColumn.One,
			expect.any(Object),
		);
		expect(WelcomePanel.currentPanel).toBeDefined();
	});

	it("should reveal existing panel if it already exists", () => {
		WelcomePanel.createOrShow(extensionUri);
		const _panel = WelcomePanel.currentPanel;
		expect(vscode.window.createWebviewPanel).toHaveBeenCalledTimes(1);

		// Call again
		WelcomePanel.createOrShow(extensionUri);
		expect(vscode.window.createWebviewPanel).toHaveBeenCalledTimes(1); // Not called again
	});

	it("should dispose panel properly", () => {
		WelcomePanel.createOrShow(extensionUri);
		const panel = WelcomePanel.currentPanel;
		expect(panel).toBeDefined();

		panel?.dispose();

		expect(WelcomePanel.currentPanel).toBeUndefined();
	});

	it("should handle messages from webview", async () => {
		WelcomePanel.createOrShow(extensionUri);

		// Extract the registered message handler
		const createdPanel = vi.mocked(vscode.window.createWebviewPanel).mock
			.results[0]?.value as vscode.WebviewPanel;
		const onDidReceiveMessageMock = vi.mocked(
			createdPanel.webview.onDidReceiveMessage,
		);
		expect(onDidReceiveMessageMock).toHaveBeenCalled();

		const handler = onDidReceiveMessageMock.mock.calls[0]?.[0] as (
			msg: unknown,
		) => Promise<void>;

		await handler({ command: "installBrowser" });
		expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
			"automa.installBrowser",
		);

		await handler({ command: "createWorkflow" });
		expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
			"automa.createWorkflow",
		);

		await handler({ command: "openStorage" });
		expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
			"automa.refreshStorage",
		);
	});
});
