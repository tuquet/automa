import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as vscode from "vscode";
import { CommandManager } from "../../commands/CommandManager";

vi.mock("vscode", () => {
	return {
		commands: {
			registerCommand: vi.fn().mockReturnValue({ dispose: vi.fn() }),
		},
	};
});

// Mock all imported commands
vi.mock("../../commands/browserCommands", () => ({
	createBrowserCommand: vi.fn(),
	deleteBrowserCommand: vi.fn(),
	editBrowserCommand: vi.fn(),
	executeWorkflowOnBrowserCommand: vi.fn(),
	importBrowsersFromCsvCommand: vi.fn(),
	killAllBrowsersCommand: vi.fn(),
	launchBrowserCommand: vi.fn(),
	sideloadExtensionCommand: vi.fn(),
	stopBrowserCommand: vi.fn(),
}));
vi.mock("../../commands/copyEscapedPath", () => ({
	copyEscapedPathCommand: vi.fn(),
}));
vi.mock("../../commands/storageSyncCommands", () => ({
	deleteStorageCampaignCommand: vi.fn(),
	deleteStorageWorkflowCommand: vi.fn(),
	exportStorageBackupCommand: vi.fn(),
	exportWorkflowToFileCommand: vi.fn(),
	importCampaignToDbCommand: vi.fn(),
	importWorkflowToDbCommand: vi.fn(),
}));
vi.mock("../../commands/historyCommands", () => ({
	clearHistoryCommand: vi.fn(),
	deleteHistoryItemCommand: vi.fn(),
	focusActiveRunnersCommand: vi.fn(),
	showJobHistoryCommand: vi.fn(),
}));
vi.mock("../../commands/killRunner", () => ({ killRunner: vi.fn() }));
vi.mock("../../commands/lintCheck", () => ({ lintCheckCommand: vi.fn() }));
vi.mock("../../commands/openInStudio", () => ({
	openInStudioCommand: vi.fn().mockReturnValue(vi.fn()),
}));
vi.mock("../../commands/runCampaign", () => ({
	createCampaignCommand: vi.fn(),
	runCampaignCommand: vi.fn(),
}));
vi.mock("../../commands/runWorkflow", () => ({
	createPackageCommand: vi.fn(),
	createWorkflowCommand: vi.fn(),
	runWorkflowCommand: vi.fn(),
	runWorkflowWithParamsCommand: vi.fn(),
}));
vi.mock("../../commands/selectDefaultBrowser", () => ({
	selectDefaultBrowserCommand: vi.fn(),
}));
vi.mock("../../commands/stopCampaign", () => ({
	stopCampaignCommand: vi.fn(),
}));
vi.mock("../../commands/storageCommands", () => ({
	addCredentialCommand: vi.fn(),
	addTableCommand: vi.fn(),
	addVariableCommand: vi.fn(),
	deleteStorageItemCommand: vi.fn(),
	encryptSecretCommand: vi.fn(),
	openTableCommand: vi.fn(),
}));
vi.mock("../../commands/systemCommands", () => ({
	installBrowserCommand: vi.fn().mockReturnValue(vi.fn()),
	openDaemonMenuCommand: vi.fn().mockReturnValue(vi.fn()),
	toggleDaemonCommand: vi.fn().mockReturnValue(vi.fn()),
	welcomeCommand: vi.fn().mockReturnValue(vi.fn()),
}));
vi.mock("../../commands/viewCommands", () => ({
	showCampaignPreviewCommand: vi.fn().mockReturnValue(vi.fn()),
	showCampaignSourceCommand: vi.fn().mockReturnValue(vi.fn()),
	showLiveLogCommand: vi.fn().mockReturnValue(vi.fn()),
	showLogPreviewCommand: vi.fn().mockReturnValue(vi.fn()),
	showLogSourceCommand: vi.fn().mockReturnValue(vi.fn()),
	showWorkflowPreviewCommand: vi.fn().mockReturnValue(vi.fn()),
	showWorkflowSourceCommand: vi.fn().mockReturnValue(vi.fn()),
}));

describe("CommandManager", () => {
	let context: vscode.ExtensionContext;
	let commandManager: CommandManager;

	beforeEach(() => {
		context = { subscriptions: [] } as unknown as vscode.ExtensionContext;
		commandManager = new CommandManager(context);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	it("should register all commands and add them to context subscriptions", () => {
		commandManager.registerAll();

		expect(vscode.commands.registerCommand).toHaveBeenCalled();
		expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
			"automa.runWorkflow",
			expect.anything(),
		);
		expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
			"automa.killRunner",
			expect.anything(),
		);
		expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
			"automa.storage.encryptSecret",
			expect.anything(),
		);

		expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
			"automa.startDaemon",
			expect.anything(),
		);
		expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
			"automa.toggleDaemon",
			expect.anything(),
		);
		expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
			"automa.openDaemonMenu",
			expect.anything(),
		);
		expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
			"automa.exportStorageBackup",
			expect.anything(),
		);
		expect(vscode.commands.registerCommand).toHaveBeenCalledWith(
			"automa.showJobHistory",
			expect.anything(),
		);

		// 49 canonical commands registered in CommandManager (tree refresh commands are registered by their respective providers)
		expect(vscode.commands.registerCommand).toHaveBeenCalledTimes(49);
		expect(context.subscriptions.length).toBe(49);
	});
});
