import * as vscode from "vscode";
import { CommandManager } from "../commands/CommandManager";
import { activateLintDiagnostics } from "../commands/lintCheck";
import { ProviderManager } from "../providers/ProviderManager";
import { client } from "./api/client";
import { DAEMON_EVENTS, VIEW_TYPES } from "./constants";
import { DaemonService } from "./daemon/DaemonService";
import { globalEvents } from "./daemon/GlobalSseListener";
import { Logger } from "./Logger";
import { AutomaDbFileSystemProvider } from "./services/AutomaDbFileSystemProvider";
import { LintDiagnosticService } from "./services/LintDiagnosticService";
import { WebSocketService } from "./ws/WebSocketService";

export class ExtensionApp {
	private static instance: ExtensionApp;
	private context!: vscode.ExtensionContext;
	private commandManager!: CommandManager;
	private providerManager!: ProviderManager;

	private constructor() {}

	public static getInstance(): ExtensionApp {
		if (!ExtensionApp.instance) {
			ExtensionApp.instance = new ExtensionApp();
		}
		return ExtensionApp.instance;
	}

	public activate(context: vscode.ExtensionContext) {
		this.context = context;

		// Initialize Logger
		Logger.initialize(context);
		Logger.info("Automa VS Code Extension is now active!");

		// Initialize Diagnostics
		activateLintDiagnostics(context);
		const lintService = LintDiagnosticService.getInstance();
		this.context.subscriptions.push(
			vscode.workspace.onDidSaveTextDocument((doc) => {
				lintService.autoLint(doc);
			}),
			vscode.workspace.onDidCloseTextDocument((doc) => {
				lintService.clear(doc.uri);
			}),
		);

		// Show welcome popup only once
		this.showWelcomePopupOnce();

		// Initialize Managers
		this.providerManager = new ProviderManager(context);
		this.commandManager = new CommandManager(context);

		// Register Virtual File System Provider (automa-db:)
		AutomaDbFileSystemProvider.register(context);

		// Register Providers & Commands
		this.providerManager.registerAll();
		this.commandManager.registerAll();

		// Sync preview setting
		this.initializeSettingsSync();

		// Wire WebSocketService lifecycle
		const wsService = WebSocketService.getInstance();
		this.context.subscriptions.push(wsService);

		const onDaemonReady = () => {
			const port = DaemonService.getPort();
			wsService.connect(port);
		};
		const onDaemonStopped = () => {
			wsService.disconnect();
		};

		globalEvents.on(DAEMON_EVENTS.READY, onDaemonReady);
		globalEvents.on(DAEMON_EVENTS.STOPPED, onDaemonStopped);
		this.context.subscriptions.push({
			dispose: () => {
				globalEvents.off(DAEMON_EVENTS.READY, onDaemonReady);
				globalEvents.off(DAEMON_EVENTS.STOPPED, onDaemonStopped);
			},
		});

		// Start Backend Daemon
		DaemonService.setContext(context);
		DaemonService.start(context)
			.then(() => {
				const port = DaemonService.getPort();
				client.setConfig({
					baseUrl: `http://127.0.0.1:${port}`,
				});
				wsService.connect(port);
			})
			.catch((err) => {
				Logger.error(`Unhandled error during Daemon start: ${err}`);
			});
	}

	public deactivate() {
		WebSocketService.getInstance().disconnect();
		DaemonService.stop();
	}

	private showWelcomePopupOnce() {
		const hasShownWelcome = this.context.globalState.get<boolean>(
			"automa.hasShownWelcome",
		);
		if (!hasShownWelcome) {
			vscode.commands.executeCommand("automa.welcome").then(
				() => this.context.globalState.update("automa.hasShownWelcome", true),
				(err) => Logger.error(`Failed to show welcome: ${err}`),
			);
		}
	}

	private initializeSettingsSync() {
		this.syncPreviewSetting();

		this.context.subscriptions.push(
			vscode.workspace.onDidChangeConfiguration(async (e) => {
				if (e.affectsConfiguration("automa.preview.defaultOnClick")) {
					this.syncPreviewSetting();
				}
				if (
					e.affectsConfiguration("automa.core.port") ||
					e.affectsConfiguration("automa.daemon.port")
				) {
					const config = vscode.workspace.getConfiguration("automa");
					const newPort =
						config.get<number>("core.port") ||
						config.get<number>("daemon.port", 8765);
					client.setConfig({
						baseUrl: `http://127.0.0.1:${newPort}`,
					});
					WebSocketService.getInstance().disconnect();
					WebSocketService.getInstance().connect(newPort);
					Logger.info(`Updated Automa API client baseUrl to port ${newPort}`);
				}
			}),
		);
	}

	private syncPreviewSetting() {
		const config = vscode.workspace.getConfiguration("automa");
		const defaultOnClick = config.get<boolean>("preview.defaultOnClick", true);

		const workbenchConfig = vscode.workspace.getConfiguration("workbench");
		const editorAssociations: Record<string, string> =
			workbenchConfig.get("editorAssociations") || {};

		let updated = false;

		// Automate *.workflow.json -> automa.workflowEditor
		const currentWorkflowAssoc = editorAssociations["*.workflow.json"];
		if (defaultOnClick && currentWorkflowAssoc !== VIEW_TYPES.WORKFLOW_EDITOR) {
			editorAssociations["*.workflow.json"] = VIEW_TYPES.WORKFLOW_EDITOR;
			updated = true;
		} else if (
			!defaultOnClick &&
			currentWorkflowAssoc === VIEW_TYPES.WORKFLOW_EDITOR
		) {
			editorAssociations["*.workflow.json"] = "default";
			updated = true;
		}

		// Automate *.campaign.json & *.campaigns.json -> automa.campaignEditor
		for (const pattern of ["*.campaign.json", "*.campaigns.json"]) {
			const currentAssoc = editorAssociations[pattern];
			if (defaultOnClick && currentAssoc !== VIEW_TYPES.CAMPAIGN_EDITOR) {
				editorAssociations[pattern] = VIEW_TYPES.CAMPAIGN_EDITOR;
				updated = true;
			} else if (
				!defaultOnClick &&
				currentAssoc === VIEW_TYPES.CAMPAIGN_EDITOR
			) {
				editorAssociations[pattern] = "default";
				updated = true;
			}
		}

		if (updated) {
			workbenchConfig
				.update(
					"editorAssociations",
					editorAssociations,
					vscode.ConfigurationTarget.Global,
				)
				.then(undefined, (err) => {
					Logger.error(`Failed to update editor associations: ${err}`);
				});
		}
	}
}
