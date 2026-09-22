import * as vscode from "vscode";
import type { IWindowService } from "../ports/IWindowService";

/**
 * Production adapter for VS Code window interactions.
 */
export class VsCodeWindowAdapter implements IWindowService {
	public async showInformation(
		message: string,
		...items: string[]
	): Promise<string | undefined> {
		return vscode.window.showInformationMessage(message, ...items);
	}

	public async showWarning(
		message: string,
		optionsOrFirstItem?: vscode.MessageOptions | string,
		...items: string[]
	): Promise<string | undefined> {
		if (typeof optionsOrFirstItem === "string") {
			return vscode.window.showWarningMessage(
				message,
				optionsOrFirstItem,
				...items,
			);
		}
		if (optionsOrFirstItem) {
			return vscode.window.showWarningMessage(
				message,
				optionsOrFirstItem,
				...items,
			);
		}
		return vscode.window.showWarningMessage(message);
	}

	public async showError(
		message: string,
		optionsOrFirstItem?: vscode.MessageOptions | string,
		...items: string[]
	): Promise<string | undefined> {
		if (typeof optionsOrFirstItem === "string") {
			return vscode.window.showErrorMessage(
				message,
				optionsOrFirstItem,
				...items,
			);
		}
		if (optionsOrFirstItem) {
			return vscode.window.showErrorMessage(
				message,
				optionsOrFirstItem,
				...items,
			);
		}
		return vscode.window.showErrorMessage(message);
	}

	public async showQuickPick<T extends vscode.QuickPickItem>(
		items: T[] | Thenable<T[]>,
		options?: vscode.QuickPickOptions,
		token?: vscode.CancellationToken,
	): Promise<T | undefined> {
		return vscode.window.showQuickPick(items, options, token);
	}

	public async showInputBox(
		options?: vscode.InputBoxOptions,
		token?: vscode.CancellationToken,
	): Promise<string | undefined> {
		return vscode.window.showInputBox(options, token);
	}

	public async showOpenDialog(
		options?: vscode.OpenDialogOptions,
	): Promise<vscode.Uri[] | undefined> {
		return vscode.window.showOpenDialog(options);
	}

	public async showSaveDialog(
		options?: vscode.SaveDialogOptions,
	): Promise<vscode.Uri | undefined> {
		return vscode.window.showSaveDialog(options);
	}

	public withProgress<R>(
		options: vscode.ProgressOptions,
		task: (
			progress: vscode.Progress<{ message?: string; increment?: number }>,
			token: vscode.CancellationToken,
		) => Thenable<R>,
	): Thenable<R> {
		return vscode.window.withProgress(options, task);
	}
}
