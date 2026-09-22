import type * as vscode from "vscode";
import { ExtensionApp } from "./core/ExtensionApp";

export let isDevMode = false;

export function activate(context: vscode.ExtensionContext) {
	isDevMode = context.extensionMode === 2; // vscode.ExtensionMode.Development is 2
	ExtensionApp.getInstance().activate(context);
}

export function deactivate() {
	ExtensionApp.getInstance().deactivate();
}
