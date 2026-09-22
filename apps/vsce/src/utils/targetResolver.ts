import * as fs from "node:fs";
import * as path from "node:path";
import * as vscode from "vscode";

export type ResolvableTarget =
	| vscode.Uri
	| { fsPath: string; label?: string }
	| { fullPath: string; label?: string }
	| { resourceUri: vscode.Uri; label?: string }
	| unknown;

export interface EntityTarget {
	id?: string;
	name?: string;
	uri?: vscode.Uri;
	targetPath?: string;
	rawData?: Record<string, unknown>;
}

function parseAutomaDbUri(uri: vscode.Uri): string | undefined {
	const str = uri.path || uri.fsPath;
	const match = str.match(/(?:workflows|campaigns)\/([^/]+)/);
	return match?.[1] ? decodeURIComponent(match[1]) : undefined;
}

export function resolveEntityTarget(item: unknown): EntityTarget | null {
	if (!item) return null;

	if (typeof item === "string") {
		return { id: item, name: item };
	}

	if (item instanceof vscode.Uri) {
		if (
			item.scheme === "automa-db" ||
			item.fsPath.startsWith("automa-db:") ||
			item.path.startsWith("automa-db:")
		) {
			const id = parseAutomaDbUri(item);
			return { id, name: id, uri: item };
		}
		const fileName = path.basename(item.fsPath);
		const id = fileName
			.replace(/\.(workflow|campaign|package|automa)\.json$/i, "")
			.replace(/\.json$/i, "");
		return {
			id,
			name: fileName,
			uri: item,
			targetPath: item.fsPath,
		};
	}

	if (typeof item !== "object") return null;

	const obj = item as Record<string, unknown>;

	if (obj.element && typeof obj.element === "object") {
		const el = obj.element as Record<string, unknown>;
		const meta = (el.metadata || {}) as Record<string, unknown>;
		const id = (el.id || meta.id || el.name || obj.id) as string | undefined;
		const name = (meta.displayName || el.name || el.id || obj.label || id) as
			| string
			| undefined;
		const uri = (el.uri || obj.resourceUri) as vscode.Uri | undefined;
		const rawData = el.rawData as Record<string, unknown> | undefined;

		return { id, name, uri, rawData };
	}

	if (
		obj.resourceUri instanceof vscode.Uri &&
		(obj.resourceUri.scheme === "automa-db" ||
			obj.resourceUri.fsPath.startsWith("automa-db:") ||
			obj.resourceUri.path.startsWith("automa-db:"))
	) {
		const id = parseAutomaDbUri(obj.resourceUri);
		return { id, name: id, uri: obj.resourceUri };
	}

	if (
		typeof obj.id === "string" ||
		typeof obj.name === "string" ||
		typeof obj.label === "string"
	) {
		const id = (obj.id || obj.name) as string | undefined;
		const name = (obj.label || obj.name || obj.id) as string | undefined;
		const uri =
			obj.resourceUri instanceof vscode.Uri ? obj.resourceUri : undefined;
		return { id, name, uri };
	}

	const resolvedUri = resolveTargetUri(item);
	if (resolvedUri) {
		return {
			uri: resolvedUri,
			targetPath: resolvedUri.fsPath,
			name: path.basename(resolvedUri.fsPath),
		};
	}

	return null;
}

export function resolveTargetUri(item: ResolvableTarget): vscode.Uri | null {
	if (item instanceof vscode.Uri) {
		return item;
	}
	if (item && typeof item === "object") {
		const obj = item as Record<string, unknown>;
		if ("resourceUri" in obj && obj.resourceUri instanceof vscode.Uri) {
			return obj.resourceUri;
		}
		if (
			"element" in obj &&
			obj.element &&
			typeof obj.element === "object" &&
			"uri" in obj.element &&
			(obj.element as { uri?: unknown }).uri instanceof vscode.Uri
		) {
			return (obj.element as { uri: vscode.Uri }).uri;
		}
		if ("fsPath" in obj && typeof obj.fsPath === "string") {
			return vscode.Uri.file(obj.fsPath);
		}
		if ("fullPath" in obj && typeof obj.fullPath === "string") {
			return vscode.Uri.file(obj.fullPath);
		}
	}
	return null;
}

export async function resolveTarget(
	nodeOrUri?: ResolvableTarget,
	fileExtension: string | string[] = ".json",
	selectLabel: string = "Select File",
): Promise<{ targetPath: string; displayName: string } | null> {
	const extensions = Array.isArray(fileExtension)
		? fileExtension
		: [fileExtension];
	const matchesExtension = (p: string) =>
		extensions.some((ext) => p.endsWith(ext));

	let targetPath = "";
	let displayName = "";

	if (nodeOrUri && typeof nodeOrUri === "object") {
		const obj = nodeOrUri as Record<string, unknown>;
		if (typeof obj.label === "string" && obj.label.trim().length > 0) {
			displayName = obj.label;
		}
	}

	const resolvedUri = resolveTargetUri(nodeOrUri);
	if (resolvedUri) {
		targetPath = resolvedUri.fsPath;
		if (!displayName) {
			displayName = path.basename(targetPath);
		}
	}

	if (!targetPath) {
		const activeEditor = vscode.window.activeTextEditor;
		if (activeEditor && matchesExtension(activeEditor.document.uri.fsPath)) {
			targetPath = activeEditor.document.uri.fsPath;
			displayName = path.basename(targetPath);
		} else {
			const filterExtensions = extensions.map((ext) => ext.replace(/^\./, ""));
			const uris = await vscode.window.showOpenDialog({
				canSelectMany: false,
				openLabel: selectLabel,
				filters: {
					Files: filterExtensions,
				},
			});
			const selectedUri = uris?.[0];
			if (!selectedUri) return null;

			targetPath = selectedUri.fsPath;
			displayName = path.basename(targetPath);
		}
	}

	if (!matchesExtension(targetPath)) {
		vscode.window.showErrorMessage(
			`Invalid file type. Only ${extensions.join(", ")} files are supported.`,
		);
		return null;
	}

	try {
		// Validate it's readable
		fs.accessSync(targetPath, fs.constants.R_OK);
	} catch (e: unknown) {
		vscode.window.showErrorMessage(
			`Failed to access file: ${(e as Error).message}`,
		);
		return null;
	}

	return { targetPath, displayName };
}
