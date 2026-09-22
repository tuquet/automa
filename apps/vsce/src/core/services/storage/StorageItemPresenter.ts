import type {
	StorageCredential,
	StorageTable,
	StorageVariable,
} from "@automa/types/api";
import * as vscode from "vscode";

export class StorageItem extends vscode.TreeItem {
	constructor(
		public override readonly label: string,
		public override readonly collapsibleState: vscode.TreeItemCollapsibleState,
		public readonly type:
			| "Category"
			| "Variable"
			| "Credential"
			| "Table"
			| "Info"
			| "Error",
		iconName: string,
		public readonly value?: string,
		public override readonly resourceUri?: vscode.Uri,
		public readonly itemId?: string,
	) {
		super(label, collapsibleState);
		this.iconPath = new vscode.ThemeIcon(iconName);
		this.contextValue = type;
		if (value !== undefined) {
			this.description = value;
			this.tooltip = `${label}: ${value}`;
		}
		if (resourceUri) {
			this.command = {
				command: "vscode.open",
				title: "Open File",
				arguments: [resourceUri],
			};
		}
	}
}

export function createCategoryItem(
	label: string,
	icon: string,
	contextValue: string,
): StorageItem {
	const item = new StorageItem(
		label,
		vscode.TreeItemCollapsibleState.Expanded,
		"Category",
		icon,
	);
	item.contextValue = contextValue;
	return item;
}

export function createInfoItem(message: string, icon = "info"): StorageItem {
	return new StorageItem(
		message,
		vscode.TreeItemCollapsibleState.None,
		"Info",
		icon,
	);
}

export function createErrorItem(message: string): StorageItem {
	return new StorageItem(
		message,
		vscode.TreeItemCollapsibleState.None,
		"Error",
		"error",
	);
}

export function createVariableItem(v: StorageVariable): StorageItem {
	const valStr =
		typeof v.value === "string" ? v.value : JSON.stringify(v.value);
	const md = new vscode.MarkdownString();
	md.appendMarkdown(`### 🏷️ **Variable: \`${v.name || v.key || v.id}\`**\n\n`);
	md.appendMarkdown(`- **Value**: \`${valStr}\`\n`);
	if (v.id) md.appendMarkdown(`- **ID**: \`${v.id}\`\n`);

	const item = new StorageItem(
		v.name || v.key || v.id || "Unnamed Variable",
		vscode.TreeItemCollapsibleState.None,
		"Variable",
		"symbol-variable",
		`= ${valStr}`,
		undefined,
		v.id || v.name || v.key || undefined,
	);
	item.tooltip = md;
	return item;
}

export function createCredentialItem(c: StorageCredential): StorageItem {
	const md = new vscode.MarkdownString();
	md.appendMarkdown(`### 🔒 **Secret: \`${c.name || c.key || c.id}\`**\n\n`);
	if (c.key) md.appendMarkdown(`- **Key**: \`${c.key}\`\n`);
	md.appendMarkdown("- **Encryption**: `AES-256-GCM`\n");
	if (c.id) md.appendMarkdown(`- **Secret ID**: \`${c.id}\`\n`);

	const item = new StorageItem(
		c.name || c.key || c.id || "Unnamed Secret",
		vscode.TreeItemCollapsibleState.None,
		"Credential",
		"lock",
		"Encrypted",
		undefined,
		c.id || c.name || c.key || undefined,
	);
	item.tooltip = md;
	return item;
}

export function createTableItem(t: StorageTable): StorageItem {
	const md = new vscode.MarkdownString();
	md.appendMarkdown(`### 📊 **Data Table: \`${t.name || t.id}\`**\n\n`);
	if (t.id) md.appendMarkdown(`- **Table ID**: \`${t.id}\`\n`);
	md.appendMarkdown("*Click to view and edit rows in table viewer*\n");

	const item = new StorageItem(
		t.name || t.id || "Unnamed Table",
		vscode.TreeItemCollapsibleState.None,
		"Table",
		"database",
		t.id ? `ID: ${t.id}` : undefined,
		undefined,
		t.id || t.name || undefined,
	);
	item.command = {
		command: "automa.openTable",
		title: "Open Table",
		arguments: [item],
	};
	item.tooltip = md;
	return item;
}
