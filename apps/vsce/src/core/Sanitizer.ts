import * as crypto from "node:crypto";
import type { Workflow, WorkflowEdge, WorkflowNode } from "@automa/types";

function generateShortId(): string {
	return crypto.randomBytes(16).toString("base64url").slice(0, 21);
}

export const WorkflowSanitizer = {
	sanitize(
		inputJson: Partial<Workflow> | Record<string, unknown> | null | undefined,
	): {
		isModified: boolean;
		sanitizedJson: Partial<Workflow> | null;
	} {
		if (
			!inputJson ||
			typeof inputJson !== "object" ||
			Array.isArray(inputJson)
		) {
			return { isModified: false, sanitizedJson: null };
		}
		let json: Partial<Workflow> & Record<string, unknown>;
		try {
			json = JSON.parse(JSON.stringify(inputJson));
		} catch (_e) {
			return { isModified: false, sanitizedJson: null };
		}
		let isModified = false;

		// 1. Ensure Root properties
		if (!json.id) {
			json.id = generateShortId();
			isModified = true;
		}
		if (!json.version) {
			json.version = "1.28.0";
			isModified = true;
		}

		const isPackage = !json.drawflow && json.data;
		const idMap = new Map<string, string>();

		let nodes: WorkflowNode[] = [];
		let edges: WorkflowEdge[] = [];

		if (isPackage && json.data) {
			const data = json.data as {
				nodes?: WorkflowNode[];
				edges?: WorkflowEdge[];
			};
			if (Array.isArray(data.nodes)) nodes = data.nodes;
			if (Array.isArray(data.edges)) edges = data.edges;
		} else if (!isPackage && json.drawflow) {
			const drawflow = json.drawflow;
			if (Array.isArray(drawflow.nodes)) nodes = drawflow.nodes;
			if (Array.isArray(drawflow.edges)) edges = drawflow.edges;
			// Fallback for object-based nodes
			if (
				!Array.isArray(drawflow.nodes) &&
				(
					drawflow as unknown as {
						Home?: { data?: Record<string, WorkflowNode> };
					}
				).Home?.data
			) {
				const homeData = (
					drawflow as unknown as {
						Home: { data: Record<string, WorkflowNode> };
					}
				).Home.data;
				Object.entries(homeData).forEach(([key, node]) => {
					if (!node.id) node.id = key;
					nodes.push(node);
				});
				drawflow.nodes = nodes; // normalize to array
				isModified = true;
			}
		}

		const idRegex = /^[A-Za-z0-9_-]{4,21}$/;
		const validTypes = [
			"BlockBasic",
			"BlockDelay",
			"BlockRepeatTask",
			"BlockConditions",
			"BlockElementExists",
			"BlockBasicWithFallback",
			"BlockLoopBreakpoint",
			"BlockGroup",
			"BlockGroup2",
			"BlockPackage",
			"BlockNote",
			"BlockWebhook",
		];

		const sanitizeNodesAndEdges = (
			nList: WorkflowNode[],
			eList: WorkflowEdge[],
		) => {
			// Sanitize Nodes
			nList.forEach((node) => {
				if (!node || typeof node !== "object") return;
				const originalId = node.id;
				if (!node.id || !idRegex.test(node.id)) {
					const newId = generateShortId();
					node.id = newId;
					if (originalId) idMap.set(originalId, newId);
					isModified = true;
				}

				if (!node.type || !validTypes.includes(node.type)) {
					node.type = "BlockBasic";
					isModified = true;
				}

				if (node.data) {
					const nodeData = node.data as Record<string, unknown>;
					if (typeof nodeData.disableBlock !== "boolean") {
						nodeData.disableBlock = false;
						isModified = true;
					}

					// Recursively sanitize nested nodes/edges (e.g. in BlockPackage/BlockGroup)
					const nestedData = nodeData.data
						? (nodeData.data as {
								nodes?: WorkflowNode[];
								edges?: WorkflowEdge[];
							})
						: (node.data as unknown as {
								nodes?: WorkflowNode[];
								edges?: WorkflowEdge[];
							});
					if (
						nestedData &&
						Array.isArray(nestedData.nodes) &&
						Array.isArray(nestedData.edges)
					) {
						sanitizeNodesAndEdges(nestedData.nodes, nestedData.edges);
					}
				}
			});

			// Sanitize Edges
			eList.forEach((edge) => {
				if (!edge || typeof edge !== "object") return;
				if (!edge.id || !idRegex.test(edge.id)) {
					edge.id = generateShortId();
					isModified = true;
				}

				if (edge.source && idMap.has(edge.source)) {
					const newSource = idMap.get(edge.source) || edge.source;
					if (edge.sourceHandle) {
						edge.sourceHandle = edge.sourceHandle.replace(
							edge.source,
							newSource,
						);
					}
					edge.source = newSource;
					isModified = true;
				}

				if (edge.target && idMap.has(edge.target)) {
					const newTarget = idMap.get(edge.target) || edge.target;
					if (edge.targetHandle) {
						edge.targetHandle = edge.targetHandle.replace(
							edge.target,
							newTarget,
						);
					}
					edge.target = newTarget;
					isModified = true;
				}
			});
		};

		sanitizeNodesAndEdges(nodes, edges);

		return { isModified, sanitizedJson: json };
	},
};
