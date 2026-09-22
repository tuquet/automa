/**
 * Canonical Domain Value Objects & Branded Types
 * Strictly eliminates Primitive Obsession mirroring automa-core define_id! pattern.
 */

declare const __brand: unique symbol;

export type Brand<T, B extends string> = T & { readonly [__brand]: B };

export type WorkflowId = Brand<string, "WorkflowId">;
export type BrowserId = Brand<string, "BrowserId">;
export type JobId = Brand<string, "JobId">;
export type CampaignId = Brand<string, "CampaignId">;
export type TableId = Brand<string, "TableId">;
export type VariableKey = Brand<string, "VariableKey">;
export type CredentialKey = Brand<string, "CredentialKey">;

export const WorkflowId = {
	create(raw: string): WorkflowId {
		const trimmed = raw.trim();
		if (!trimmed) {
			throw new Error("WorkflowId cannot be empty");
		}
		return trimmed as WorkflowId;
	},
	fromString(raw: string): WorkflowId {
		return raw as WorkflowId;
	},
	fromPath(filePath: string): WorkflowId {
		const basename = filePath.split("/").pop()?.split("\\").pop() || "";
		const cleanId = basename.replace(/\.workflow\.json$|\.json$/, "");
		return WorkflowId.create(cleanId || "workflow");
	},
};

export const BrowserId = {
	create(raw: string): BrowserId {
		const normalized = raw
			.trim()
			.toLowerCase()
			.replace(/[^a-z0-9_-]/g, "_");
		if (!normalized) {
			throw new Error("BrowserId cannot be empty");
		}
		return normalized as BrowserId;
	},
	fromString(raw: string): BrowserId {
		return raw as BrowserId;
	},
	DEFAULT_WORKER: "daemon_worker" as BrowserId,
};

export const JobId = {
	create(raw: string): JobId {
		const trimmed = raw.trim();
		if (!trimmed) {
			throw new Error("JobId cannot be empty");
		}
		return trimmed as JobId;
	},
	fromString(raw: string): JobId {
		return raw as JobId;
	},
	generate(): JobId {
		return `job_${Date.now()}` as JobId;
	},
};

export const CampaignId = {
	create(raw: string): CampaignId {
		const trimmed = raw.trim();
		if (!trimmed) {
			throw new Error("CampaignId cannot be empty");
		}
		return trimmed as CampaignId;
	},
	fromString(raw: string): CampaignId {
		return raw as CampaignId;
	},
	fromPath(filePath: string): CampaignId {
		const basename = filePath.split("/").pop()?.split("\\").pop() || "";
		const cleanId = basename.replace(/\.campaign\.json$|\.json$/, "");
		return CampaignId.create(cleanId || "campaign");
	},
};

export const TableId = {
	create(raw: string): TableId {
		const trimmed = raw.trim();
		if (!trimmed) {
			throw new Error("TableId cannot be empty");
		}
		return trimmed as TableId;
	},
	fromString(raw: string): TableId {
		return raw as TableId;
	},
};

export const VariableKey = {
	create(raw: string): VariableKey {
		const trimmed = raw.trim();
		if (!trimmed) {
			throw new Error("VariableKey cannot be empty");
		}
		return trimmed as VariableKey;
	},
	fromString(raw: string): VariableKey {
		return raw as VariableKey;
	},
};

export const CredentialKey = {
	create(raw: string): CredentialKey {
		const trimmed = raw.trim();
		if (!trimmed) {
			throw new Error("CredentialKey cannot be empty");
		}
		return trimmed as CredentialKey;
	},
	fromString(raw: string): CredentialKey {
		return raw as CredentialKey;
	},
};
