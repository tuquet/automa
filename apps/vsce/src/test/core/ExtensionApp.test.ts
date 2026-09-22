import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as vscode from "vscode";
import { activateLintDiagnostics } from "../../commands/lintCheck";
import { DaemonService } from "../../core/daemon/DaemonService";
import { ExtensionApp } from "../../core/ExtensionApp";
import { Logger } from "../../core/Logger";

vi.mock("../../core/Logger");
vi.mock("../../core/daemon/DaemonService", () => ({
	DaemonService: {
		setContext: vi.fn(),
		start: vi.fn().mockResolvedValue(undefined),
		stop: vi.fn(),
		getPort: vi.fn().mockReturnValue(8765),
	},
}));
vi.mock("../../commands/lintCheck", () => ({
	activateLintDiagnostics: vi.fn(),
}));
vi.mock("../../providers/ProviderManager", () => ({
	ProviderManager: class {
		registerAll = vi.fn();
	},
}));
vi.mock("../../commands/CommandManager", () => ({
	CommandManager: class {
		registerAll = vi.fn();
	},
}));

describe("ExtensionApp", () => {
	let context: vscode.ExtensionContext;
	let app: ExtensionApp;

	beforeEach(() => {
		context = {
			globalState: {
				get: vi.fn(),
				update: vi.fn().mockResolvedValue(true),
			},
			subscriptions: [],
		} as unknown as vscode.ExtensionContext;
		app = ExtensionApp.getInstance();
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("should activate without errors and start daemon", async () => {
		await app.activate(context);

		expect(Logger.info).toHaveBeenCalledWith(
			"Automa VS Code Extension is now active!",
		);
		expect(activateLintDiagnostics).toHaveBeenCalledWith(context);
	});

	it("should show welcome page on first activation", async () => {
		vi.mocked(context.globalState.get).mockReturnValue(undefined);

		await app.activate(context);

		expect(context.globalState.update).toHaveBeenCalledWith(
			"automa.hasShownWelcome",
			true,
		);
		expect(vscode.commands.executeCommand).toHaveBeenCalledWith(
			"automa.welcome",
		);
	});

	it("should not show welcome page if already shown", async () => {
		vi.mocked(context.globalState.get).mockReturnValue(true);

		await app.activate(context);

		expect(context.globalState.update).not.toHaveBeenCalled();
		expect(vscode.commands.executeCommand).not.toHaveBeenCalledWith(
			"automa.welcome",
		);
	});

	it("should deactivate successfully", () => {
		app.deactivate();
		expect(DaemonService.stop).toHaveBeenCalled();
	});

	it("should sync preview setting correctly", () => {
		const configGetMock = vi.fn().mockReturnValue(true);
		const workbenchConfigGetMock = vi.fn().mockReturnValue({});
		const workbenchConfigUpdateMock = vi.fn().mockResolvedValue(true);

		vi.mocked(vscode.workspace.getConfiguration).mockImplementation(
			(section?: string) => {
				if (section === "automa") {
					return {
						get: configGetMock,
					} as unknown as vscode.WorkspaceConfiguration;
				}
				if (section === "workbench") {
					return {
						get: workbenchConfigGetMock,
						update: workbenchConfigUpdateMock,
					} as unknown as vscode.WorkspaceConfiguration;
				}
				return {
					get: vi.fn(),
					update: vi.fn(),
				} as unknown as vscode.WorkspaceConfiguration;
			},
		);

		app.activate(context);

		expect(workbenchConfigUpdateMock).toHaveBeenCalledWith(
			"editorAssociations",
			expect.objectContaining({
				"*.workflow.json": "automa.workflowEditor",
				"*.campaigns.json": "automa.campaignEditor",
			}),
			vscode.ConfigurationTarget.Global,
		);
	});
});
