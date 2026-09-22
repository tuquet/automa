import * as vscode from "vscode";
import { openWebStudio } from "../core/api/client";
import { formatApiError } from "../utils/errorUtils";

export function openInStudioCommand(_context: vscode.ExtensionContext) {
	return async () => {
		try {
			const res = await openWebStudio();

			if (res.error) {
				vscode.window.showErrorMessage(
					`Failed to open studio: ${formatApiError(res.error)}`,
				);
			}
		} catch (e: unknown) {
			vscode.window.showErrorMessage(
				`Error opening studio: Is Automa Core running? ${formatApiError(e)}`,
			);
		}
	};
}
