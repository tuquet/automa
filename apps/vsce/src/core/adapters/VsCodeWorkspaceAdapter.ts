import * as vscode from "vscode";
import type { IWorkspaceService } from "../ports/IWorkspaceService";

/**
 * Production adapter for VS Code workspace interactions.
 */
export class VsCodeWorkspaceAdapter implements IWorkspaceService {
	public getConfiguration(
		section?: string,
		scope?: vscode.ConfigurationScope | null,
	): vscode.WorkspaceConfiguration {
		return vscode.workspace.getConfiguration(section, scope);
	}

	public async readFile(uri: vscode.Uri): Promise<Uint8Array> {
		return vscode.workspace.fs.readFile(uri);
	}

	public async writeFile(uri: vscode.Uri, content: Uint8Array): Promise<void> {
		return vscode.workspace.fs.writeFile(uri, content);
	}

	public async applyEdit(edit: vscode.WorkspaceEdit): Promise<boolean> {
		return vscode.workspace.applyEdit(edit);
	}

	public getWorkspaceFolders(): readonly vscode.WorkspaceFolder[] | undefined {
		return vscode.workspace.workspaceFolders;
	}

	public async openTextDocument(uri: vscode.Uri): Promise<vscode.TextDocument> {
		return vscode.workspace.openTextDocument(uri);
	}
}
