import { describe, expect, it } from "vitest";
import { WorkflowPayloadBuilder } from "../../../core/services/preview/WorkflowPayloadBuilder";

describe("WorkflowPayloadBuilder", () => {
	it("should correctly identify package metadata", () => {
		const pkgJson = {
			name: "My Package",
			inputs: ["input1"],
			outputs: ["output1"],
			variable: ["var1"],
		};
		const meta = WorkflowPayloadBuilder.extractPackageMetadata(pkgJson);
		expect(meta.isPackage).toBe(true);
		expect(meta.pkgInputs).toEqual(["input1"]);
		expect(meta.pkgOutputs).toEqual(["output1"]);
		expect(meta.pkgVars).toEqual(["var1"]);

		const normalJson = {
			name: "Normal Workflow",
			drawflow: { nodes: [], edges: [] },
		};
		const normalMeta =
			WorkflowPayloadBuilder.extractPackageMetadata(normalJson);
		expect(normalMeta.isPackage).toBe(false);
	});

	it("should prepare trigger parameters with global variable defaults", () => {
		const json = {
			drawflow: {
				nodes: [
					{
						id: "trigger_1",
						type: "BlockTrigger",
						data: { parameters: [{ name: "page", defaultValue: 1 }] },
					},
				],
				edges: [],
			},
		};
		const content = "{{variables.username}} and {{$globalVar}}";
		const globals = { username: "admin", globalVar: "prod_env" };

		const params = WorkflowPayloadBuilder.prepareTriggerParameters(
			json,
			content,
			globals,
		);

		expect(params.length).toBeGreaterThan(0);
		const userParam = params.find((p) => p.name === "username");
		expect(userParam?.defaultValue).toBe("admin");
	});

	it("should sanitize workflow AST through WorkflowSanitizer", () => {
		const dirty = {
			name: "Test Workflow",
			drawflow: {
				nodes: [{ id: "n1", type: "BlockDelay" }],
				edges: [],
			},
		};
		const clean = WorkflowPayloadBuilder.sanitizeWorkflow(dirty);
		expect(clean).toBeDefined();
		expect(clean.name).toBe("Test Workflow");
	});
});
