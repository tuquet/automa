import { describe, expect, it } from "vitest";
import { WorkflowSanitizer } from "../../core/Sanitizer";

describe("WorkflowSanitizer", () => {
	it("should add missing id and version to root", () => {
		const json: Record<string, unknown> = {};
		const { isModified, sanitizedJson } = WorkflowSanitizer.sanitize(json);

		const result = sanitizedJson as Record<string, unknown>;

		expect(isModified).toBe(true);
		expect(result.id).toBeDefined();
		expect(typeof result.id).toBe("string");
		expect(result.version).toBe("1.28.0");
	});

	it("should sanitize package nodes and edges", () => {
		const json = {
			id: "existing-id",
			version: "1.28.0",
			data: {
				nodes: [
					{ id: "invalid id #!", type: "InvalidType" },
					{ id: "valid-id", type: "BlockDelay" },
				],
				edges: [{ id: "edge1", source: "invalid id #!", target: "valid-id" }],
			},
		};

		const { isModified, sanitizedJson } = WorkflowSanitizer.sanitize(json);

		expect(isModified).toBe(true);
		const result = sanitizedJson as {
			data: {
				nodes: Array<{ id: string; type: string }>;
				edges: Array<{ id: string; source: string; target: string }>;
			};
		};

		const nodes = result.data.nodes;
		expect(nodes[0]?.id).not.toBe("invalid id #!");
		expect(nodes[0]?.id).toMatch(/^[A-Za-z0-9_-]{4,21}$/);
		expect(nodes[0]?.type).toBe("BlockBasic"); // InvalidType fallback to BlockBasic

		expect(nodes[1]?.id).toBe("valid-id"); // Should not change valid id
		expect(nodes[1]?.type).toBe("BlockDelay");

		const edges = result.data.edges;
		expect(edges[0]?.source).toBe(nodes[0]?.id); // Edge source should be updated to new node id
	});

	it("should recursively sanitize nested nodes (e.g. BlockGroup)", () => {
		const json = {
			id: "existing-id",
			version: "1.28.0",
			drawflow: {
				nodes: [
					{
						id: "valid-group",
						type: "BlockGroup",
						data: {
							data: {
								nodes: [{ id: "nested id bad", type: "bad" }],
								edges: [],
							},
						},
					},
				],
				edges: [],
			},
		};

		const { isModified, sanitizedJson } = WorkflowSanitizer.sanitize(json);

		expect(isModified).toBe(true);
		const result = sanitizedJson as unknown as {
			drawflow: {
				nodes: Array<{
					id: string;
					type: string;
					data: {
						data: {
							nodes: Array<{ id: string; type: string }>;
							edges: unknown[];
						};
					};
				}>;
				edges: unknown[];
			};
		};
		const rootNodes = result.drawflow.nodes;
		const nestedNodes = rootNodes[0]?.data.data.nodes;
		expect(nestedNodes?.[0]?.id).not.toBe("nested id bad");
		expect(nestedNodes?.[0]?.type).toBe("BlockBasic");
	});

	it("should add disableBlock: false if missing", () => {
		const json = {
			id: "existing-id",
			version: "1.28.0",
			data: {
				nodes: [{ id: "valid-id", type: "BlockBasic", data: {} }],
				edges: [],
			},
		};

		const { isModified, sanitizedJson } = WorkflowSanitizer.sanitize(json);

		expect(isModified).toBe(true);
		const result = sanitizedJson as {
			data: {
				nodes: Array<{
					id: string;
					type: string;
					data: { disableBlock?: boolean };
				}>;
				edges: unknown[];
			};
		};
		const rootNodes = result.data.nodes;
		const nodeData = rootNodes[0]?.data;
		expect(nodeData?.disableBlock).toBe(false);
	});

	it("should handle null or primitive inputs without throwing errors", () => {
		const resNull = WorkflowSanitizer.sanitize(null);
		expect(resNull.isModified).toBe(false);

		const resString = WorkflowSanitizer.sanitize(
			"not-json" as unknown as Record<string, unknown>,
		);
		expect(resString.isModified).toBe(false);

		const resArray = WorkflowSanitizer.sanitize([1, 2, 3] as unknown as Record<
			string,
			unknown
		>);
		expect(resArray.isModified).toBe(false);
	});
});
