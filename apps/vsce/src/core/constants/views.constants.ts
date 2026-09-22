/**
 * View IDs, TreeView Identifiers and Custom Editor ViewTypes
 */
export const VIEW_TYPES = {
	WORKSPACE_TREE: "automa.workspace",
	STORAGE_TREE: "automa.storage",
	BROWSERS_VIEW: "automa.browsers",
	WORKFLOW_EDITOR: "automa.workflowEditor",
	CAMPAIGN_EDITOR: "automa.campaignEditor",
	BROWSER_EDITOR: "automa.browserEditor",
	LOG_EDITOR: "automa.logEditor",
	TABLE_PANEL: "automa.tablePanel",
	TABLE_EDITOR: "automa.tablePanel",
	WELCOME_PANEL: "automa.welcomePanel",
} as const;

export type ViewTypeId = (typeof VIEW_TYPES)[keyof typeof VIEW_TYPES];
