import type { Workflow, WorkflowUpdatePayload } from "@automa/types";
import * as vscode from "vscode";
import { WorkflowParser } from "../../WorkflowParser";

export type { WorkflowUpdatePayload };

const WORKFLOW_SCALAR_KEYS: (keyof WorkflowUpdatePayload)[] = [
	"name",
	"description",
	"version",
	"extVersion",
	"icon",
	"globalData",
	"drawflow",
	"nodes",
	"edges",
];

const RAW_ADDITIONAL_KEYS = ["variable", "variables", "inputs", "outputs"];

function parseJsonField<T>(
	value: unknown,
	defaultValue: T,
	fieldName: string,
): T {
	if (value === undefined) return defaultValue;
	if (typeof value !== "string") return value as T;
	const trimmed = value.trim();
	if (!trimmed) return defaultValue;
	try {
		return JSON.parse(trimmed) as T;
	} catch (error: unknown) {
		const e = error instanceof Error ? error : new Error(String(error));
		throw new Error(`Invalid JSON in ${fieldName}: ${e.message}`);
	}
}

export class WorkflowSaveService {
	public async handleSaveWorkflow(
		document: vscode.TextDocument,
		updateData: WorkflowUpdatePayload,
		saveDoc?: (doc: vscode.TextDocument, content: string) => Promise<boolean>,
	): Promise<void> {
		try {
			const content = document.getText();
			const json = JSON.parse(content) as Workflow & Record<string, unknown>;

			this.applyFields(json, updateData);
			this.applyJsonFields(json, updateData);

			if (updateData.triggerParams) {
				WorkflowParser.updateTriggerParameters(json, updateData.triggerParams);
			}

			const formattedContent = JSON.stringify(json, null, 4);
			await this.persistDocument(document, formattedContent, saveDoc);

			vscode.window.setStatusBarMessage("$(check) Workflow saved", 2000);
		} catch (error: unknown) {
			const e = error instanceof Error ? error : new Error(String(error));
			vscode.window.showErrorMessage(`Failed to save workflow: ${e.message}`);
		}
	}

	private applyFields(
		json: Workflow & Record<string, unknown>,
		updateData: WorkflowUpdatePayload,
	): void {
		for (const key of WORKFLOW_SCALAR_KEYS) {
			if (updateData[key] !== undefined) {
				(json as Record<string, unknown>)[key] = updateData[key];
			}
		}

		const rawUpdate = updateData as Record<string, unknown>;
		for (const key of RAW_ADDITIONAL_KEYS) {
			if (rawUpdate[key] !== undefined) {
				json[key] = rawUpdate[key];
			}
		}
	}

	private applyJsonFields(
		json: Workflow & Record<string, unknown>,
		updateData: WorkflowUpdatePayload,
	): void {
		if (updateData.settings !== undefined) {
			json.settings = parseJsonField(updateData.settings, {}, "Settings");
		}
		if (updateData.table !== undefined) {
			json.table = parseJsonField(updateData.table, [], "Table");
		}
		if (updateData.includedWorkflows !== undefined) {
			json.includedWorkflows = parseJsonField(
				updateData.includedWorkflows,
				{},
				"Included Workflows",
			);
		}
	}

	private async persistDocument(
		document: vscode.TextDocument,
		formattedContent: string,
		saveDoc?: (doc: vscode.TextDocument, content: string) => Promise<boolean>,
	): Promise<void> {
		if (saveDoc) {
			await saveDoc(document, formattedContent);
			return;
		}
		const edit = new vscode.WorkspaceEdit();
		edit.replace(
			document.uri,
			new vscode.Range(0, 0, document.lineCount, 0),
			formattedContent,
		);
		await vscode.workspace.applyEdit(edit);
		await document.save();
	}
}
