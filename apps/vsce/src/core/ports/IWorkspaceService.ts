import type * as vscode from "vscode";

/**
 * Port contract for VS Code Workspace interactions.
 * Enables zero-mock testing and decouples business logic from vscode.workspace.
 */
export interface IWorkspaceService {
	getConfiguration(
		section?: string,
		scope?: vscode.ConfigurationScope | null,
	): vscode.WorkspaceConfiguration;
	readFile(uri: vscode.Uri): Promise<Uint8Array>;
	writeFile(uri: vscode.Uri, content: Uint8Array): Promise<void>;
	applyEdit(edit: vscode.WorkspaceEdit): Promise<boolean>;
	getWorkspaceFolders(): readonly vscode.WorkspaceFolder[] | undefined;
	openTextDocument(uri: vscode.Uri): Promise<vscode.TextDocument>;
}
