import * as vscode from "vscode";
import { AutomaFilesProvider } from "./AutomaFilesProvider";
import { BrowserEditorProvider } from "./BrowserEditorProvider";
import { BrowsersTreeDataProvider } from "./BrowsersTreeDataProvider";
import { CampaignEditorProvider } from "./CampaignEditorProvider";
import { LogEditorProvider } from "./LogEditorProvider";
import { StorageTreeDataProvider } from "./StorageTreeDataProvider";
import { WorkflowCodeLensProvider } from "./WorkflowCodeLensProvider";
import { WorkflowEditorProvider } from "./WorkflowEditorProvider";
import { WorkspaceTreeDataProvider } from "./WorkspaceTreeDataProvider";

export class ProviderManager {
	private readonly context: vscode.ExtensionContext;

	constructor(context: vscode.ExtensionContext) {
		this.context = context;
	}

	public registerAll() {
		// Register Custom Editor Providers
		LogEditorProvider.register(this.context);
		WorkflowEditorProvider.register(this.context);
		CampaignEditorProvider.register(this.context);
		BrowserEditorProvider.register(this.context);

		// --- NATIVE TREE VIEWS (AUTOMATIONS, STORAGE, BROWSERS) --- //

		// 1. Storage Panel (Secrets, Variables, Tables)
		const storageProvider = new StorageTreeDataProvider();
		storageProvider.register(this.context);
		this.context.subscriptions.push(storageProvider);

		// 2. Automations Panel (Workflows, Campaigns, Packages)
		const workflowsProvider = new AutomaFilesProvider(
			"play-circle",
			"automa.workflows",
			"workflow",
		);
		const campaignsProvider = new AutomaFilesProvider(
			"rocket",
			"automa.campaigns",
			"campaign",
		);
		const packagesProvider = new AutomaFilesProvider(
			"package",
			"automa.packages",
			"package",
		);
		const workspaceProvider = new WorkspaceTreeDataProvider(
			workflowsProvider,
			campaignsProvider,
			packagesProvider,
		);
		workspaceProvider.register(this.context);
		this.context.subscriptions.push(workspaceProvider);

		// 3. Native Browsers Panel
		const browsersProvider = new BrowsersTreeDataProvider();
		browsersProvider.register(this.context);
		this.context.subscriptions.push(browsersProvider);

		// 4. CodeLens for Workflows & Campaigns
		this.context.subscriptions.push(
			vscode.languages.registerCodeLensProvider(
				[
					{ pattern: "**/*.{workflow,campaign,campaigns}.json" },
					{ scheme: "automa-db" },
				],
				new WorkflowCodeLensProvider(),
			),
		);
	}
}
