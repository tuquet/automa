import * as vscode from "vscode";

export async function copyEscapedPathCommand(uri?: vscode.Uri) {
	if (!uri) {
		return;
	}
	const fsPath = uri.fsPath;
	const escapedPath = fsPath.replace(/\\/g, "/");
	await vscode.env.clipboard.writeText(escapedPath);
	vscode.window.showInformationMessage(`Copied: ${escapedPath}`);
}
