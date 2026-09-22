import * as assert from "node:assert";
import * as vscode from "vscode";

suite("Extension Test Suite", () => {
	vscode.window.showInformationMessage("Start all tests.");

	test("Extension should be present", () => {
		assert.ok(vscode.extensions.getExtension("tuquet.vscode-automa"));
	});

	test("Extension should activate", async () => {
		const ext = vscode.extensions.getExtension("tuquet.vscode-automa");
		if (ext) {
			await ext.activate();
			assert.strictEqual(ext.isActive, true);
		} else {
			assert.fail("Extension not found");
		}
	});

	test("Should register commands", async () => {
		const commands = await vscode.commands.getCommands(true);
		assert.ok(
			commands.includes("automa.showWorkflowSource"),
			"Command automa.showWorkflowSource not registered",
		);
		assert.ok(
			commands.includes("automa.runWorkflow"),
			"Command automa.runWorkflow not registered",
		);
	});
});
