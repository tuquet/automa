import { StorageDeletionService } from "../core/services/storage/StorageDeletionService";
import { WorkflowExportService } from "../core/services/storage/WorkflowExportService";
import { WorkflowImportService } from "../core/services/storage/WorkflowImportService";

const deletionService = new StorageDeletionService();
const importService = new WorkflowImportService();
const exportService = new WorkflowExportService();

/**
 * Imports workflow(s), package(s), or full Automa backup JSON from disk into SQLite Database.
 */
export async function importWorkflowToDbCommand(
	itemOrUri?: unknown,
): Promise<void> {
	await importService.importWorkflowsOrBackups(itemOrUri);
}

/**
 * Imports a campaign file (.campaign.json, .campaigns.json) from disk into SQLite Database.
 */
export async function importCampaignToDbCommand(
	itemOrUri?: unknown,
): Promise<void> {
	await importService.importCampaign(itemOrUri);
}

/**
 * Exports a workflow from SQLite Database to an .automa.json file format.
 */
export async function exportWorkflowToFileCommand(
	itemOrUri?: unknown,
): Promise<void> {
	await exportService.exportWorkflow(itemOrUri);
}

/**
 * Exports full Automa storage backup (workflows, variables, tables) to a JSON file.
 */
export async function exportStorageBackupCommand(): Promise<void> {
	await exportService.exportBackup();
}

/**
 * Deletes a workflow from SQLite Database.
 */
export async function deleteStorageWorkflowCommand(
	item?: unknown,
): Promise<void> {
	await deletionService.deleteEntity("workflow", item);
}

/**
 * Deletes a campaign from SQLite Database.
 */
export async function deleteStorageCampaignCommand(
	item?: unknown,
): Promise<void> {
	await deletionService.deleteEntity("campaign", item);
}
