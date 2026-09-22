import * as fs from "node:fs";
import type * as vscode from "vscode";
import { WorkflowSanitizer } from "../../Sanitizer";
import { WorkflowParser } from "../../WorkflowParser";

export interface PackageMetadata {
	isPackage: boolean;
	pkgInputs: unknown[];
	pkgOutputs: unknown[];
	pkgVars: unknown[];
}

export interface WorkflowPreviewPayload {
	data: Record<string, unknown>;
	triggerParams: Record<string, unknown>[];
	updatedAtStr: string;
	isPackage: boolean;
	pkgInputs: unknown[];
	pkgOutputs: unknown[];
	pkgVars: unknown[];
	daemonPort: number;
	isDaemonRunning: boolean;
}

export function sanitizeWorkflow(
	json: Record<string, unknown>,
): Record<string, unknown> {
	const { sanitizedJson } = WorkflowSanitizer.sanitize(json);
	return (sanitizedJson as Record<string, unknown>) || json;
}

export function extractPackageMetadata(
	json: Record<string, unknown>,
): PackageMetadata {
	const isPackage =
		(json.settings as Record<string, unknown>)?.asBlock === true ||
		Array.isArray(json.inputs) ||
		Array.isArray(json.outputs);

	return {
		isPackage,
		pkgInputs: Array.isArray(json.inputs) ? json.inputs : [],
		pkgOutputs: Array.isArray(json.outputs) ? json.outputs : [],
		pkgVars: Array.isArray(json.variable) ? json.variable : [],
	};
}

export function prepareTriggerParameters(
	json: Record<string, unknown>,
	content: string,
	globalVariables: Record<string, unknown> = {},
): Record<string, unknown>[] {
	const implicitVars = WorkflowParser.extractImplicitVariables(content);
	const triggerParams = WorkflowParser.extractTriggerParameters(
		json,
		implicitVars,
	);

	for (const varName of implicitVars) {
		let defaultVal = "";
		const strippedName = varName.startsWith("$$") ? varName.slice(2) : varName;

		if (globalVariables[varName] !== undefined) {
			defaultVal = String(globalVariables[varName]);
		} else if (globalVariables[strippedName] !== undefined) {
			defaultVal = String(globalVariables[strippedName]);
		}

		triggerParams.push({
			name: varName,
			description: varName.startsWith("$$")
				? "(Auto-detected Global Var)"
				: "(Auto-detected Implicit Var)",
			defaultValue: defaultVal,
			value: defaultVal,
			required: false,
			isImplicit: true,
		});
	}

	return triggerParams;
}

export function getUpdatedAtString(uri: vscode.Uri): string {
	try {
		if (uri.scheme === "file") {
			const updatedAt = fs.statSync(uri.fsPath).mtimeMs;
			return new Date(updatedAt).toLocaleString();
		}
	} catch (_err) {
		// Ignore file read error
	}
	return "";
}

export function buildPayload(
	document: vscode.TextDocument,
	globalVariables: Record<string, unknown>,
	daemonPort: number,
	isDaemonRunning: boolean,
): WorkflowPreviewPayload {
	const content = document.getText();
	const rawJson = JSON.parse(content) as Record<string, unknown>;
	const sanitizedJson = sanitizeWorkflow(rawJson);
	const triggerParams = prepareTriggerParameters(
		sanitizedJson,
		content,
		globalVariables,
	);
	const packageMeta = extractPackageMetadata(sanitizedJson);
	const updatedAtStr = getUpdatedAtString(document.uri);

	return {
		data: sanitizedJson,
		triggerParams,
		updatedAtStr,
		isPackage: packageMeta.isPackage,
		pkgInputs: packageMeta.pkgInputs,
		pkgOutputs: packageMeta.pkgOutputs,
		pkgVars: packageMeta.pkgVars,
		daemonPort,
		isDaemonRunning,
	};
}

export const WorkflowPayloadBuilder = {
	sanitizeWorkflow,
	extractPackageMetadata,
	prepareTriggerParameters,
	getUpdatedAtString,
	buildPayload,
};
