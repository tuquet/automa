import { describe, expect, it } from "vitest";
import * as vscode from "vscode";
import { WorkflowCodeLensProvider } from "../../providers/WorkflowCodeLensProvider";

describe("WorkflowCodeLensProvider", () => {
	const provider = new WorkflowCodeLensProvider();
	const dummyToken = {} as vscode.CancellationToken;

	it("should return empty array for non-workflow/campaign files", () => {
		const doc = {
			fileName: "/path/to/some-script.ts",
			uri: vscode.Uri.file("/path/to/some-script.ts"),
		} as vscode.TextDocument;

		const lenses = provider.provideCodeLenses(doc, dummyToken);
		expect(lenses).toHaveLength(0);
	});

	it("should return 3 CodeLenses for *.workflow.json files", () => {
		const doc = {
			fileName: "/workspace/login.workflow.json",
			uri: vscode.Uri.file("/workspace/login.workflow.json"),
		} as vscode.TextDocument;

		const lenses = provider.provideCodeLenses(doc, dummyToken);
		expect(lenses).toHaveLength(3);

		expect(lenses[0]?.command?.title).toBe("▶️ Run Workflow");
		expect(lenses[0]?.command?.command).toBe("automa.runWorkflow");

		expect(lenses[1]?.command?.title).toBe("🎨 Open Studio Canvas");
		expect(lenses[1]?.command?.command).toBe("automa.openInStudio");

		expect(lenses[2]?.command?.title).toBe("🔍 Lint AST");
		expect(lenses[2]?.command?.command).toBe("automa.lintCheck");
	});

	it("should return 3 CodeLenses for automa-db:/workflows/* URIs", () => {
		const doc = {
			fileName: "wf_123",
			uri: vscode.Uri.parse("automa-db:/workflows/wf_123"),
		} as vscode.TextDocument;

		const lenses = provider.provideCodeLenses(doc, dummyToken);
		expect(lenses).toHaveLength(3);
		expect(lenses[0]?.command?.title).toBe("▶️ Run Workflow");
	});

	it("should return 2 CodeLenses for *.campaign.json files", () => {
		const doc = {
			fileName: "/workspace/daily.campaign.json",
			uri: vscode.Uri.file("/workspace/daily.campaign.json"),
		} as vscode.TextDocument;

		const lenses = provider.provideCodeLenses(doc, dummyToken);
		expect(lenses).toHaveLength(2);

		expect(lenses[0]?.command?.title).toBe("▶️ Run Campaign");
		expect(lenses[0]?.command?.command).toBe("automa.runCampaign");

		expect(lenses[1]?.command?.title).toBe("🎨 Open Campaign Editor");
		expect(lenses[1]?.command?.command).toBe("automa.showCampaignPreview");
	});

	it("should return 2 CodeLenses for automa-db:/campaigns/* URIs", () => {
		const doc = {
			fileName: "camp_789",
			uri: vscode.Uri.parse("automa-db:/campaigns/camp_789"),
		} as vscode.TextDocument;

		const lenses = provider.provideCodeLenses(doc, dummyToken);
		expect(lenses).toHaveLength(2);
		expect(lenses[0]?.command?.title).toBe("▶️ Run Campaign");
	});
});
