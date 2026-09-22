import { formatApiError } from "../../../utils/errorUtils";
import {
	createStorageCampaign,
	createStorageWorkflow,
	deleteStorageCampaign,
	deleteStorageWorkflow,
	getStorageCampaign,
	getStorageCampaigns,
	getStorageWorkflow,
	getStorageWorkflows,
	updateStorageCampaign,
	updateStorageWorkflow,
} from "../../api/client";

export interface DbResourceStrategy {
	read(id: string): Promise<Record<string, unknown>>;
	write(id: string, data: Record<string, unknown>): Promise<void>;
	delete(id: string): Promise<void>;
	list(): Promise<string[]>;
}

export class WorkflowDbStrategy implements DbResourceStrategy {
	public async read(id: string): Promise<Record<string, unknown>> {
		const res = await getStorageWorkflow({ path: { id } });
		if (!res.data) {
			throw new Error(`Workflow ${id} not found`);
		}
		return (res.data.data ?? res.data) as Record<string, unknown>;
	}

	public async write(
		id: string,
		parsed: Record<string, unknown>,
	): Promise<void> {
		const name = (parsed.name as string) || id;
		const res = await updateStorageWorkflow({
			path: { id },
			body: {
				name,
				description: (parsed.description as string) || undefined,
				data: parsed,
			},
		});
		if (res.error) {
			const createRes = await createStorageWorkflow({
				body: {
					id,
					name,
					description: (parsed.description as string) || undefined,
					data: parsed,
				},
			});
			if (createRes.error) {
				throw new Error(
					`Failed to save workflow to SQLite: ${formatApiError(createRes.error)}`,
				);
			}
		}
	}

	public async delete(id: string): Promise<void> {
		await deleteStorageWorkflow({ path: { id } });
	}

	public async list(): Promise<string[]> {
		const res = await getStorageWorkflows();
		const items = res.data || [];
		return items.map((w) => `${w.id}.workflow.json`);
	}
}

export class CampaignDbStrategy implements DbResourceStrategy {
	public async read(id: string): Promise<Record<string, unknown>> {
		const res = await getStorageCampaign({ path: { id } });
		if (!res.data) {
			throw new Error(`Campaign ${id} not found`);
		}
		return (res.data.data ?? res.data) as Record<string, unknown>;
	}

	public async write(
		id: string,
		parsed: Record<string, unknown>,
	): Promise<void> {
		const name = (parsed.name as string) || id;
		const res = await updateStorageCampaign({
			path: { id },
			body: {
				name,
				description: (parsed.description as string) || undefined,
				data: parsed,
			},
		});
		if (res.error) {
			const createRes = await createStorageCampaign({
				body: {
					id,
					name,
					description: (parsed.description as string) || undefined,
					data: parsed,
					cron: (parsed.cron as string) || undefined,
				},
			});
			if (createRes.error) {
				throw new Error(
					`Failed to save campaign to SQLite: ${formatApiError(createRes.error)}`,
				);
			}
		}
	}

	public async delete(id: string): Promise<void> {
		await deleteStorageCampaign({ path: { id } });
	}

	public async list(): Promise<string[]> {
		const res = await getStorageCampaigns();
		const items = res.data || [];
		return items.map((c) => `${c.id}.campaign.json`);
	}
}
