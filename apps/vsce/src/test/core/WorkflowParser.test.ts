import { describe, expect, it } from "vitest";
import { WorkflowParser } from "../../core/WorkflowParser";

describe("WorkflowParser", () => {
	describe("extractImplicitVariables", () => {
		it("should extract variables from handlebars syntax", () => {
			const content =
				"Hello {{variables.name}}, welcome to {{ variables.city }}";
			const vars = WorkflowParser.extractImplicitVariables(content);

			expect(vars.has("name")).toBe(true);
			expect(vars.has("city")).toBe(true);
			expect(vars.size).toBe(2);
		});

		it("should extract variables from automaRefData syntax", () => {
			const content =
				'const x = automaRefData("variables", "token"); const y = automaRefData("variables","api_key")';
			const vars = WorkflowParser.extractImplicitVariables(content);

			expect(vars.has("token")).toBe(true);
			expect(vars.has("api_key")).toBe(true);
			expect(vars.size).toBe(2);
		});
	});

	describe("extractTriggerParameters", () => {
		it("should extract parameters from Trigger block and remove them from implicitVars", () => {
			const json = {
				drawflow: {
					nodes: [
						{
							type: "BlockTrigger",
							label: "trigger",
							data: {
								parameters: [
									{ name: "userId", type: "string" },
									{ name: "action", type: "string" },
								],
							},
						},
					],
				},
			};

			const implicitVars = new Set(["userId", "action", "otherVar"]);

			const triggerParams = WorkflowParser.extractTriggerParameters(
				json,
				implicitVars,
			);

			expect(triggerParams.length).toBe(2);
			expect(triggerParams[0]?.name).toBe("userId");
			expect(triggerParams[1]?.name).toBe("action");

			// Should remove found trigger params from implicitVars
			expect(implicitVars.has("userId")).toBe(false);
			expect(implicitVars.has("action")).toBe(false);
			expect(implicitVars.has("otherVar")).toBe(true); // Should remain
		});

		it("should return empty array if no trigger block found", () => {
			const json = {
				drawflow: {
					nodes: [
						{
							type: "BlockBasic",
							data: {},
						},
					],
				},
			};

			const implicitVars = new Set(["userId"]);
			const triggerParams = WorkflowParser.extractTriggerParameters(
				json,
				implicitVars,
			);

			expect(triggerParams.length).toBe(0);
			expect(implicitVars.has("userId")).toBe(true);
		});

		it("should handle null or malformed json safely without throwing", () => {
			const implicitVars = new Set(["test"]);
			const params1 = WorkflowParser.extractTriggerParameters(
				null,
				implicitVars,
			);
			expect(params1.length).toBe(0);

			const params2 = WorkflowParser.extractTriggerParameters(
				{} as unknown as Record<string, unknown>,
				implicitVars,
			);
			expect(params2.length).toBe(0);

			const params3 = WorkflowParser.extractTriggerParameters(
				{ drawflow: null } as unknown as Record<string, unknown>,
				implicitVars,
			);
			expect(params3.length).toBe(0);
		});

		it("should extract variables from complex multi-line text", () => {
			const multiline = `
				const a = "{{variables.username}}";
				const b = "{{ variables.password }}";
				const c = automaRefData("variables", "session_id");
				const d = "{{$variables.extra}}";
			`;
			const vars = WorkflowParser.extractImplicitVariables(multiline);
			expect(vars.has("username")).toBe(true);
			expect(vars.has("password")).toBe(true);
			expect(vars.has("session_id")).toBe(true);
		});
	});

	describe("findTriggerNode & updateTriggerParameters", () => {
		it("should find trigger node and update default values", () => {
			const json = {
				nodes: [
					{
						id: "node_1",
						type: "BlockTrigger",
						data: {
							parameters: [
								{ name: "count", defaultValue: 1 },
								{ name: "query", defaultValue: "hello" },
							],
						},
					},
				],
			};

			const triggerNode = WorkflowParser.findTriggerNode(json);
			expect(triggerNode?.id).toBe("node_1");

			const updated = WorkflowParser.updateTriggerParameters(json, {
				count: 10,
				query: "world",
			});
			expect(updated).toBe(true);

			const nodeData = triggerNode?.data as
				| { parameters: Array<{ name: string; defaultValue: unknown }> }
				| undefined;
			expect(nodeData?.parameters[0]?.defaultValue).toBe(10);
			expect(nodeData?.parameters[1]?.defaultValue).toBe("world");
		});

		it("should safely return false when no trigger node exists", () => {
			const json = { nodes: [{ type: "BlockDelay", data: {} }] };
			expect(WorkflowParser.findTriggerNode(json)).toBeUndefined();
			expect(WorkflowParser.updateTriggerParameters(json, { test: 1 })).toBe(
				false,
			);
		});
	});
});
