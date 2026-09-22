import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as vscode from "vscode";
import {
	activateLintDiagnostics,
	lintCheckCommand,
} from "../../commands/lintCheck";
import { LintDiagnosticService } from "../../core/services/LintDiagnosticService";

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
	}

	return {
		window: {
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
			activeTextEditor: undefined,
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
			createDiagnosticCollection: vi.fn().mockReturnValue({
				set: vi.fn(),
				delete: vi.fn(),
				clear: vi.fn(),
				dispose: vi.fn(),
			}),
		},
		Uri: MockUri,
		Range: class MockRange {
			constructor(
				public startLine: number,
				public startChar: number,
				public endLine: number,
				public endChar: number,
			) {}
		},
		Diagnostic: class MockDiagnostic {
			public code?: string | number;
			public source?: string;
			constructor(
				public range: unknown,
				public message: string,
				public severity: number,
			) {}
		},
		ProgressLocation: { Window: 1 },
		DiagnosticSeverity: { Error: 0, Warning: 1, Information: 2, Hint: 3 },
	};
});

vi.mock("../../core/daemon/DaemonService", () => ({
	DaemonService: { getPort: vi.fn().mockReturnValue(8765) },
}));

describe("lintCheck command", () => {
	let context: vscode.ExtensionContext;

	beforeEach(() => {
		context = { subscriptions: [] } as unknown as vscode.ExtensionContext;
		global.fetch = vi.fn() as unknown as typeof fetch;
		LintDiagnosticService.getInstance().dispose();
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("should activate diagnostics correctly", () => {
		activateLintDiagnostics(context);
		expect(vscode.languages.createDiagnosticCollection).toHaveBeenCalledWith(
			"automa-lint",
		);
		expect(context.subscriptions.length).toBe(1);
	});

	it("should prompt user to select files if none provided", async () => {
		await lintCheckCommand();
		expect(vscode.window.showOpenDialog).toHaveBeenCalled();
	});

	it("should parse and set diagnostics successfully without errors", async () => {
		activateLintDiagnostics(context);
		const mockUri = vscode.Uri.file("/test/path.json");
		const mockDoc = {
			getText: vi.fn().mockReturnValue('{"drawflow":{"nodes":[],"edges":[]}}'),
		} as unknown as vscode.TextDocument;
		vi.mocked(vscode.workspace.openTextDocument).mockResolvedValue(mockDoc);

		vi.mocked(global.fetch).mockResolvedValue(
			new Response(JSON.stringify({ issues: [] }), {
				status: 200,
				headers: { "Content-Type": "application/json" },
			}),
		);

		await lintCheckCommand(mockUri);

		expect(vscode.window.withProgress).toHaveBeenCalled();
		expect(vscode.workspace.openTextDocument).toHaveBeenCalledWith(mockUri);
		expect(global.fetch).toHaveBeenCalled();
		expect(vscode.window.showInformationMessage).toHaveBeenCalledWith(
			"Lint passed for path.json",
		);
	});

	it("should display errors and warnings correctly", async () => {
		activateLintDiagnostics(context);
		const mockUri = vscode.Uri.file("/test/path.json");
		const mockDoc = {
			getText: vi.fn().mockReturnValue('{"drawflow":{"nodes":[],"edges":[]}}'),
		} as unknown as vscode.TextDocument;
		vi.mocked(vscode.workspace.openTextDocument).mockResolvedValue(mockDoc);

		vi.mocked(global.fetch).mockResolvedValue(
			new Response(
				JSON.stringify({
					issues: [
						{ severity: "error", message: "Missing drawflow nodes" },
						{ severity: "warning", message: "Orphan edge detected" },
					],
				}),
				{
					status: 200,
					headers: { "Content-Type": "application/json" },
				},
			),
		);

		await lintCheckCommand(mockUri);

		expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
			expect.stringContaining("1 error(s), 1 warning(s)"),
		);
	});

	it("should handle daemon connection failures gracefully", async () => {
		const mockUri = vscode.Uri.file("/test/path.json");
		const mockDoc = {
			getText: vi.fn().mockReturnValue("{}"),
		} as unknown as vscode.TextDocument;
		vi.mocked(vscode.workspace.openTextDocument).mockResolvedValue(mockDoc);

		vi.mocked(global.fetch).mockRejectedValue(new Error("Connection refused"));

		await lintCheckCommand(mockUri);

		expect(vscode.window.showErrorMessage).toHaveBeenCalledWith(
			expect.stringContaining("Failed to connect to Daemon"),
		);
	});

	it("should strictly ensure read-only execution with zero auto-save or document modifications", async () => {
		activateLintDiagnostics(context);
		const mockUri = vscode.Uri.file("/test/path.json");
		const mockDoc = {
			getText: vi.fn().mockReturnValue('{"name":"test-workflow"}'),
			save: vi.fn(),
		} as unknown as vscode.TextDocument;
		vi.mocked(vscode.workspace.openTextDocument).mockResolvedValue(mockDoc);

		vi.mocked(global.fetch).mockResolvedValue(
			new Response(
				JSON.stringify({
					issues: [
						{ severity: "warning", message: "Node ID should be updated" },
					],
				}),
				{
					status: 200,
					headers: { "Content-Type": "application/json" },
				},
			),
		);

		await lintCheckCommand(mockUri);

		// Assert: ZERO auto-save combo executed
		expect(mockDoc.save).not.toHaveBeenCalled();
		expect(vscode.commands.executeCommand).not.toHaveBeenCalledWith(
			"automa.runWorkflow",
			expect.anything(),
		);
	});
});
