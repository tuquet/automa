import type * as vscode from "vscode";

/**
 * Port contract for VS Code UI window interactions.
 * Enables zero-mock testing and decouples business logic from vscode.window.
 */
export interface IWindowService {
	showInformation(
		message: string,
		...items: string[]
	): Promise<string | undefined>;
	showWarning(
		message: string,
		optionsOrFirstItem?: vscode.MessageOptions | string,
		...items: string[]
	): Promise<string | undefined>;
	showError(
		message: string,
		optionsOrFirstItem?: vscode.MessageOptions | string,
		...items: string[]
	): Promise<string | undefined>;
	showQuickPick<T extends vscode.QuickPickItem>(
		items: T[] | Thenable<T[]>,
		options?: vscode.QuickPickOptions,
		token?: vscode.CancellationToken,
	): Promise<T | undefined>;
	showInputBox(
		options?: vscode.InputBoxOptions,
		token?: vscode.CancellationToken,
	): Promise<string | undefined>;
	showOpenDialog(
		options?: vscode.OpenDialogOptions,
	): Promise<vscode.Uri[] | undefined>;
	showSaveDialog(
		options?: vscode.SaveDialogOptions,
	): Promise<vscode.Uri | undefined>;
	withProgress<R>(
		options: vscode.ProgressOptions,
		task: (
			progress: vscode.Progress<{ message?: string; increment?: number }>,
			token: vscode.CancellationToken,
		) => Thenable<R>,
	): Thenable<R>;
}
