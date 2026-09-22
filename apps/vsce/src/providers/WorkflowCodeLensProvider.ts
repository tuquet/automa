import * as vscode from "vscode";

/**
 * Provides actionable inline CodeLens buttons above workflow and campaign JSON documents.
 * Adheres to SOLID Single Responsibility and the Thin-Client IDE Invariant.
 */
export class WorkflowCodeLensProvider implements vscode.CodeLensProvider {
	provideCodeLenses(
		document: vscode.TextDocument,
		_token: vscode.CancellationToken,
	): vscode.CodeLens[] {
		const fileName = document.fileName.toLowerCase();
		const isWorkflow =
			fileName.endsWith(".workflow.json") ||
			(document.uri.scheme === "automa-db" &&
				document.uri.path.startsWith("/workflows/"));
		const isCampaign =
			fileName.endsWith(".campaign.json") ||
			fileName.endsWith(".campaigns.json") ||
			(document.uri.scheme === "automa-db" &&
				document.uri.path.startsWith("/campaigns/"));

		if (!isWorkflow && !isCampaign) {
			return [];
		}

		const topRange = new vscode.Range(0, 0, 0, 0);

		if (isCampaign) {
			return [
				new vscode.CodeLens(topRange, {
					title: "▶️ Run Campaign",
					command: "automa.runCampaign",
					arguments: [document.uri],
					tooltip:
						"Execute multi-instance campaign matrix via Automa Core Daemon",
				}),
				new vscode.CodeLens(topRange, {
					title: "🎨 Open Campaign Editor",
					command: "automa.showCampaignPreview",
					arguments: [document.uri],
					tooltip: "Open visual campaign matrix editor",
				}),
			];
		}

		return [
			new vscode.CodeLens(topRange, {
				title: "▶️ Run Workflow",
				command: "automa.runWorkflow",
				arguments: [document.uri],
				tooltip:
					"Execute workflow on active Chromium instance via Automa Core Daemon",
			}),
			new vscode.CodeLens(topRange, {
				title: "🎨 Open Studio Canvas",
				command: "automa.openInStudio",
				arguments: [document.uri],
				tooltip: "Open workflow in standalone Web Studio Canvas",
			}),
			new vscode.CodeLens(topRange, {
				title: "🔍 Lint AST",
				command: "automa.lintCheck",
				arguments: [document.uri],
				tooltip: "Validate graph AST nodes and edge connections via Core API",
			}),
		];
	}
}
