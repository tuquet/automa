import type * as vscode from "vscode";

/**
 * Port contract for application logging.
 * Decouples consumers from static logger singletons.
 */
export interface ILogger {
	info(message: string): void;
	warn(message: string): void;
	error(message: string): void;
	getOutputChannel(): vscode.OutputChannel | null;
	dispose?(): void;
}
