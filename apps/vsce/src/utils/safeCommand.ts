import * as vscode from "vscode";
import { Logger } from "../core/Logger";
import { formatApiError } from "./errorUtils";

export interface SafeCommandOptions {
	showLogsButton?: boolean;
	rethrow?: boolean;
}

/**
 * Higher-Order Function that intercepts synchronous and asynchronous errors for VS Code commands.
 * Automatically logs errors via Logger and presents an interactive error toast with a "View Logs" CTA.
 */
export function safeCommand<Args extends unknown[], R>(
	commandTitle: string,
	handler: (...args: Args) => R,
	options: SafeCommandOptions = {},
): (...args: Args) => Promise<R | undefined> {
	return async (...args: Args): Promise<R | undefined> => {
		try {
			return await handler(...args);
		} catch (error: unknown) {
			const formattedError = formatApiError(error);
			Logger.error(`[${commandTitle}] Failed: ${formattedError}`);

			const actions: string[] = [];
			const showLogs = options.showLogsButton !== false;
			if (showLogs) {
				actions.push("View Logs");
			}

			const selectedAction = await vscode.window.showErrorMessage(
				`${commandTitle} failed: ${formattedError}`,
				...actions,
			);

			if (selectedAction === "View Logs") {
				Logger.getOutputChannel()?.show(true);
			}

			if (options.rethrow) {
				throw error;
			}

			return undefined;
		}
	};
}
