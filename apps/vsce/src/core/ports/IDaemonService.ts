import type * as vscode from "vscode";

/**
 * Port contract for Automa Core Rust Daemon management.
 * Strictly separates high-level daemon lifecycle policies from process spawning.
 */
export interface IDaemonService {
	isRunning(): boolean;
	start(context?: vscode.ExtensionContext): Promise<void>;
	stop(): void;
	getPort(): number;
	waitUntilHealthy(port: number): Promise<boolean>;
}
