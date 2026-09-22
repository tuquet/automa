/**
 * VS Code Command Identifiers for Automa Extension
 */
export const COMMAND_IDS = {
	RUN_WORKFLOW: "automa.runWorkflow",
	RUN_CAMPAIGN: "automa.runCampaign",
	CREATE_WORKFLOW: "automa.createWorkflow",
	CREATE_CAMPAIGN: "automa.createCampaign",
	INSTALL_BROWSER: "automa.installBrowser",
	SELECT_DEFAULT_BROWSER: "automa.selectDefaultBrowser",
	LINT_WORKFLOW: "automa.lintCheck",
	REFRESH_STORAGE: "automa.refreshStorage",
	REFRESH_WORKSPACE: "automa.refreshWorkspace",
	FOCUS_ACTIVE_RUNNERS: "automa.focusActiveRunners",
	IMPORT_WORKFLOW_TO_DB: "automa.importWorkflowToDb",
	IMPORT_BACKUP: "automa.importBackup",
	EXPORT_WORKFLOW_TO_FILE: "automa.exportWorkflowToFile",
	DELETE_STORAGE_ITEM: "automa.deleteStorageItem",
} as const;

export type CommandId = (typeof COMMAND_IDS)[keyof typeof COMMAND_IDS];
