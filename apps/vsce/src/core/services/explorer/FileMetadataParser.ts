import type {
	FileMetadata,
	TreeElement,
} from "../../../providers/AutomaFilesProvider";
import type {
	CampaignStorageItem,
	WorkflowStorageItem,
} from "../../api/client";

export function extractNamespace(
	name: string,
	data?: Record<string, unknown>,
): string | undefined {
	const nsMatch = name.match(/^\[([^\]]+)\]/);
	if (nsMatch) return nsMatch[1];
	if (typeof data?.namespace === "string") return data.namespace;
	return undefined;
}

export function extractNodesCount(
	data: Record<string, unknown>,
): number | undefined {
	if (Array.isArray(data.nodes)) return data.nodes.length;
	if (!data.drawflow || typeof data.drawflow !== "object") return undefined;

	const df = data.drawflow as Record<string, unknown>;
	if (Array.isArray(df.nodes)) return df.nodes.length;

	if (df.nodes && typeof df.nodes === "object") {
		return Object.keys(df.nodes as Record<string, unknown>).length;
	}
	return undefined;
}

export function parseCampaignElement(c: CampaignStorageItem): TreeElement {
	const data = (c.data || {}) as Record<string, unknown>;
	const browsers = Array.isArray(data.browsers)
		? data.browsers
		: Array.isArray(data.members)
			? data.members
			: [];
	const settings = (data.settings || {}) as Record<string, unknown>;
	const namespace = extractNamespace(c.name, data);

	const metadata: FileMetadata = {
		id: c.id,
		displayName: c.name,
		description: c.description || undefined,
		version: c.version || "1.0.0",
		browsersCount: browsers.length,
		concurrencyMode: (settings.concurrency_mode as string) || "parallel",
		cron: c.cron || (settings.cron as string) || undefined,
	};

	return {
		isFolder: false,
		id: c.id,
		name: c.name,
		path: c.id,
		namespace,
		rawData: data,
		metadata,
	};
}

export function parseWorkflowElement(w: WorkflowStorageItem): TreeElement {
	const data = (w.data || {}) as Record<string, unknown>;
	const settings = (data.settings || {}) as Record<string, unknown>;
	const isPackage =
		settings.asBlock === true ||
		w.name.includes(".package") ||
		Array.isArray(data.inputs) ||
		Array.isArray(data.outputs);

	const nodesCount = extractNodesCount(data);
	const namespace = extractNamespace(w.name, data);

	const metadata: FileMetadata = {
		id: w.id,
		displayName: w.name,
		description: w.description || undefined,
		version: w.version || "1.0.0",
		nodesCount,
		isPackage,
	};

	return {
		isFolder: false,
		id: w.id,
		name: w.name,
		path: w.id,
		namespace,
		rawData: data,
		metadata,
	};
}
