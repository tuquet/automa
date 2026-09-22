import type { TriggerParameter, Workflow, WorkflowNode } from "@automa/types";

export type { TriggerParameter };

export const WorkflowParser = {
	extractImplicitVariables(content: string): Set<string> {
		const implicitVars = new Set<string>();

		// 1. Scan for {{variables.xyz}}
		const varRegex1 = /\{\{\s*variables\.([a-zA-Z0-9_$]+)\s*\}\}/g;
		for (const match of content.matchAll(varRegex1)) {
			if (match[1]) implicitVars.add(match[1]);
		}

		// 2. Scan for automaRefData('variables', 'xyz')
		const varRegex2 =
			/automaRefData\(\s*['"]variables['"]\s*,\s*['"]([a-zA-Z0-9_$]+)['"]\s*\)/g;
		for (const match of content.matchAll(varRegex2)) {
			if (match[1]) implicitVars.add(match[1]);
		}

		return implicitVars;
	},

	extractNodes(
		jsonObj: Workflow | Record<string, unknown> | null | undefined,
	): WorkflowNode[] {
		const json = (jsonObj || {}) as Partial<Workflow> & Record<string, unknown>;
		if (json.nodes && Array.isArray(json.nodes)) {
			return json.nodes;
		}
		if (
			json.data &&
			typeof json.data === "object" &&
			Array.isArray((json.data as { nodes?: WorkflowNode[] }).nodes)
		) {
			return (json.data as { nodes: WorkflowNode[] }).nodes;
		}
		if (json.drawflow && typeof json.drawflow === "object") {
			const drawflow = json.drawflow;
			if (Array.isArray(drawflow.nodes)) {
				return drawflow.nodes;
			}
			const nodesList: WorkflowNode[] = [];
			const df = drawflow as Record<
				string,
				{ data?: Record<string, WorkflowNode> }
			>;
			for (const tab of Object.keys(df)) {
				const tabData = df[tab];
				if (tabData?.data) {
					for (const node of Object.values(tabData.data)) {
						nodesList.push(node);
					}
				}
			}
			return nodesList;
		}
		return [];
	},

	findTriggerNode(
		jsonObj: Workflow | Record<string, unknown> | null | undefined,
	): WorkflowNode | undefined {
		const nodesList = WorkflowParser.extractNodes(jsonObj);
		return nodesList.find(
			(n) =>
				n.label === "trigger" ||
				(n as unknown as { name?: string }).name === "trigger" ||
				n.type === "BlockTrigger",
		);
	},

	updateTriggerParameters(
		jsonObj: Workflow | Record<string, unknown> | null | undefined,
		triggerParams: Record<string, unknown>,
	): boolean {
		if (!jsonObj || !triggerParams) return false;
		const triggerNode = WorkflowParser.findTriggerNode(jsonObj);
		if (
			!triggerNode?.data ||
			typeof triggerNode.data !== "object" ||
			!Array.isArray(
				(
					triggerNode.data as {
						parameters?: Array<{ name: string; defaultValue?: unknown }>;
					}
				).parameters,
			)
		) {
			return false;
		}

		const paramsList = (
			triggerNode.data as {
				parameters: Array<{ name: string; defaultValue?: unknown }>;
			}
		).parameters;

		let updated = false;
		for (const param of paramsList) {
			if (param.name && triggerParams[param.name] !== undefined) {
				param.defaultValue = triggerParams[param.name];
				updated = true;
			}
		}
		return updated;
	},

	extractTriggerParameters(
		jsonObj: Workflow | Record<string, unknown> | null | undefined,
		implicitVars: Set<string>,
	): TriggerParameter[] {
		const triggerParams: TriggerParameter[] = [];
		const triggerNode = WorkflowParser.findTriggerNode(jsonObj);

		if (
			triggerNode?.data &&
			typeof triggerNode.data === "object" &&
			Array.isArray(
				(triggerNode.data as { parameters?: TriggerParameter[] }).parameters,
			)
		) {
			const params = (triggerNode.data as { parameters: TriggerParameter[] })
				.parameters;
			for (const param of params) {
				if (param.name && !triggerParams.some((p) => p.name === param.name)) {
					triggerParams.push({
						...param,
						isImplicit: false,
					});
					implicitVars.delete(param.name);
				}
			}
		}
		return triggerParams;
	},
};
