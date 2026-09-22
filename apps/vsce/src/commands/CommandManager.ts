import * as vscode from "vscode";
import { safeCommand } from "../utils/safeCommand";

import {
	createBrowserCommand,
	deleteBrowserCommand,
	editBrowserCommand,
	executeWorkflowOnBrowserCommand,
	importBrowsersFromCsvCommand,
	killAllBrowsersCommand,
	launchBrowserCommand,
	sideloadExtensionCommand,
	stopBrowserCommand,
} from "./browserCommands";
import { copyEscapedPathCommand } from "./copyEscapedPath";
import {
	clearHistoryCommand,
	deleteHistoryItemCommand,
	focusActiveRunnersCommand,
	showJobHistoryCommand,
} from "./historyCommands";
import { killRunner } from "./killRunner";
import { lintCheckCommand } from "./lintCheck";
import { openInStudioCommand } from "./openInStudio";
import { createCampaignCommand, runCampaignCommand } from "./runCampaign";
import {
	createPackageCommand,
	createWorkflowCommand,
	runWorkflowCommand,
} from "./runWorkflow";
import { selectDefaultBrowserCommand } from "./selectDefaultBrowser";
import { stopCampaignCommand } from "./stopCampaign";
import {
	addCredentialCommand,
	addTableCommand,
	addVariableCommand,
	deleteStorageItemCommand,
	encryptSecretCommand,
	openTableCommand,
} from "./storageCommands";
import {
	deleteStorageCampaignCommand,
	deleteStorageWorkflowCommand,
	exportStorageBackupCommand,
	exportWorkflowToFileCommand,
	importCampaignToDbCommand,
	importWorkflowToDbCommand,
} from "./storageSyncCommands";
import {
	installBrowserCommand,
	openDaemonMenuCommand,
	toggleDaemonCommand,
} from "./systemCommands";
import {
	showCampaignPreviewCommand,
	showCampaignSourceCommand,
	showLiveLogCommand,
	showLogPreviewCommand,
	showLogSourceCommand,
	showWorkflowPreviewCommand,
	showWorkflowSourceCommand,
} from "./viewCommands";

/**
 * CommandManager orchestrates command registration grouped by domain categories.
 * Follows Single Responsibility and Object Calisthenics (methods < 25 lines).
 */
export class CommandManager {
	private readonly context: vscode.ExtensionContext;

	constructor(context: vscode.ExtensionContext) {
		this.context = context;
	}

	public registerAll(): void {
		const disposables = [
			...this.registerSystemCommands(),
			...this.registerViewCommands(),
			...this.registerWorkflowCommands(),
			...this.registerCampaignCommands(),
			...this.registerBrowserCommands(),
			...this.registerStorageCommands(),
			...this.registerHistoryCommands(),
		];

		this.context.subscriptions.push(...disposables);
	}

	private registerSystemCommands(): vscode.Disposable[] {
		return [
			vscode.commands.registerCommand(
				"automa.installBrowser",
				safeCommand("Install Browser", installBrowserCommand()),
			),
			vscode.commands.registerCommand(
				"automa.toggleDaemon",
				safeCommand("Toggle Daemon", toggleDaemonCommand()),
			),
			vscode.commands.registerCommand(
				"automa.startDaemon",
				safeCommand("Start Daemon", async () => {
					await toggleDaemonCommand()();
				}),
			),
			vscode.commands.registerCommand(
				"automa.openDaemonMenu",
				safeCommand("Open Daemon Menu", openDaemonMenuCommand()),
			),
			vscode.commands.registerCommand(
				"automa.openInStudio",
				safeCommand("Open in Studio", openInStudioCommand(this.context)),
			),
			vscode.commands.registerCommand(
				"automa.lintCheck",
				safeCommand("Lint Check", lintCheckCommand),
			),
			vscode.commands.registerCommand(
				"automa.killRunner",
				safeCommand("Kill Runner", killRunner),
			),
			vscode.commands.registerCommand(
				"automa.copyEscapedPath",
				safeCommand("Copy Escaped Path", copyEscapedPathCommand),
			),
		];
	}

	private registerViewCommands(): vscode.Disposable[] {
		return [
			vscode.commands.registerCommand(
				"automa.showWorkflowSource",
				safeCommand("Show Workflow Source", showWorkflowSourceCommand()),
			),
			vscode.commands.registerCommand(
				"automa.showWorkflowPreview",
				safeCommand("Show Workflow Preview", showWorkflowPreviewCommand()),
			),
			vscode.commands.registerCommand(
				"automa.showCampaignSource",
				safeCommand("Show Campaign Source", showCampaignSourceCommand()),
			),
			vscode.commands.registerCommand(
				"automa.showCampaignPreview",
				safeCommand("Show Campaign Preview", showCampaignPreviewCommand()),
			),
			vscode.commands.registerCommand(
				"automa.showLogSource",
				safeCommand("Show Log Source", showLogSourceCommand()),
			),
			vscode.commands.registerCommand(
				"automa.showLogPreview",
				safeCommand("Show Log Preview", showLogPreviewCommand(this.context)),
			),
			vscode.commands.registerCommand(
				"automa.showLiveLog",
				safeCommand("Show Live Log", showLiveLogCommand(this.context)),
			),
		];
	}

	private registerWorkflowCommands(): vscode.Disposable[] {
		return [
			vscode.commands.registerCommand(
				"automa.runWorkflow",
				safeCommand("Run Workflow", runWorkflowCommand),
			),
			vscode.commands.registerCommand(
				"automa.createWorkflow",
				safeCommand("Create Workflow", createWorkflowCommand),
			),
			vscode.commands.registerCommand(
				"automa.importWorkflowToDb",
				safeCommand("Import Workflow", importWorkflowToDbCommand),
			),
			vscode.commands.registerCommand(
				"automa.importBackup",
				safeCommand("Import Backup", importWorkflowToDbCommand),
			),
			vscode.commands.registerCommand(
				"automa.deleteWorkflow",
				safeCommand("Delete Workflow", deleteStorageWorkflowCommand),
			),
			vscode.commands.registerCommand(
				"automa.exportWorkflowToFile",
				safeCommand("Export Workflow", exportWorkflowToFileCommand),
			),
			vscode.commands.registerCommand(
				"automa.createPackage",
				safeCommand("Create Package", createPackageCommand),
			),
		];
	}

	private registerCampaignCommands(): vscode.Disposable[] {
		return [
			vscode.commands.registerCommand(
				"automa.runCampaign",
				safeCommand("Run Campaign", runCampaignCommand),
			),
			vscode.commands.registerCommand(
				"automa.stopCampaign",
				safeCommand("Stop Campaign", stopCampaignCommand),
			),
			vscode.commands.registerCommand(
				"automa.createCampaign",
				safeCommand("Create Campaign", createCampaignCommand),
			),
			vscode.commands.registerCommand(
				"automa.importCampaignToDb",
				safeCommand("Import Campaign", importCampaignToDbCommand),
			),
			vscode.commands.registerCommand(
				"automa.deleteCampaign",
				safeCommand("Delete Campaign", deleteStorageCampaignCommand),
			),
		];
	}

	private registerBrowserCommands(): vscode.Disposable[] {
		return [
			vscode.commands.registerCommand(
				"automa.selectDefaultBrowser",
				safeCommand("Select Default Browser", selectDefaultBrowserCommand),
			),
			vscode.commands.registerCommand(
				"automa.createBrowser",
				safeCommand("Create Browser", createBrowserCommand),
			),
			vscode.commands.registerCommand(
				"automa.importBrowsersFromCsv",
				safeCommand("Import Browsers from CSV", importBrowsersFromCsvCommand),
			),
			vscode.commands.registerCommand(
				"automa.sideloadExtension",
				safeCommand("Sideload Extension", sideloadExtensionCommand),
			),
			vscode.commands.registerCommand(
				"automa.executeWorkflowOnBrowser",
				safeCommand(
					"Execute Workflow on Browser",
					executeWorkflowOnBrowserCommand,
				),
			),
			vscode.commands.registerCommand(
				"automa.launchBrowser",
				safeCommand("Launch Browser", launchBrowserCommand),
			),
			vscode.commands.registerCommand(
				"automa.stopBrowser",
				safeCommand("Stop Browser", stopBrowserCommand),
			),
			vscode.commands.registerCommand(
				"automa.killBrowser",
				safeCommand("Kill Browser", (item?: { id?: string }) =>
					vscode.commands.executeCommand("automa.stopBrowser", item),
				),
			),
			vscode.commands.registerCommand(
				"automa.deleteBrowser",
				safeCommand("Delete Browser", deleteBrowserCommand),
			),
			vscode.commands.registerCommand(
				"automa.editBrowser",
				safeCommand("Edit Browser", editBrowserCommand),
			),
			vscode.commands.registerCommand(
				"automa.killAllBrowsers",
				safeCommand("Kill All Browsers", killAllBrowsersCommand),
			),
		];
	}

	private registerStorageCommands(): vscode.Disposable[] {
		return [
			vscode.commands.registerCommand(
				"automa.addVariable",
				safeCommand("Add Variable", addVariableCommand),
			),
			vscode.commands.registerCommand(
				"automa.addCredential",
				safeCommand("Add Credential", () => addCredentialCommand(this.context)),
			),
			vscode.commands.registerCommand(
				"automa.addTable",
				safeCommand("Add Table", addTableCommand),
			),
			vscode.commands.registerCommand(
				"automa.storage.encryptSecret",
				safeCommand("Encrypt Secret", () => encryptSecretCommand(this.context)),
			),
			vscode.commands.registerCommand(
				"automa.deleteStorageItem",
				safeCommand("Delete Storage Item", deleteStorageItemCommand),
			),
			vscode.commands.registerCommand(
				"automa.openTable",
				safeCommand("Open Table", (item) =>
					openTableCommand(item, this.context),
				),
			),
			vscode.commands.registerCommand(
				"automa.exportStorageBackup",
				safeCommand("Export Storage Backup", exportStorageBackupCommand),
			),
		];
	}

	private registerHistoryCommands(): vscode.Disposable[] {
		return [
			vscode.commands.registerCommand(
				"automa.clearHistory",
				clearHistoryCommand,
			),
			vscode.commands.registerCommand(
				"automa.deleteHistoryItem",
				deleteHistoryItemCommand,
			),
			vscode.commands.registerCommand(
				"automa.focusActiveRunners",
				focusActiveRunnersCommand,
			),
			vscode.commands.registerCommand(
				"automa.showJobHistory",
				safeCommand("View Execution History", showJobHistoryCommand),
			),
		];
	}
}
