import * as vscode from "vscode";
import { formatApiError } from "../../../utils/errorUtils";
import { addStorageTableRow, getStorageTableRows } from "../../api/client";

export interface TableIpcMessage {
	type?: string;
	command?: string;
	query?: string;
	data?: Record<string, unknown>;
}

export async function fetchTableRows(
	tableId: string,
	query = "",
): Promise<Array<Record<string, unknown>>> {
	const res = await getStorageTableRows({
		path: { id: tableId },
		query: { search: query.trim() || undefined },
	});
	return (res.data as Array<Record<string, unknown>>) || [];
}

export async function addTableRow(
	tableId: string,
	rowData: Record<string, unknown>,
): Promise<Array<Record<string, unknown>>> {
	const res = await addStorageTableRow({
		path: { id: tableId },
		body: rowData,
	});
	if (res.error) {
		throw new Error(formatApiError(res.error));
	}
	return await fetchTableRows(tableId);
}

export async function handleWebviewMessage(
	tableId: string,
	message: TableIpcMessage,
	postMessage: (msg: unknown) => void,
): Promise<void> {
	if (!tableId) return;
	const cmd = message.type || message.command;

	try {
		if (cmd === "getTableRows") {
			const query = typeof message.query === "string" ? message.query : "";
			const rows = await fetchTableRows(tableId, query);
			postMessage({ type: "tableRowsData", data: rows });
			return;
		}

		if (cmd === "addTableRow") {
			const rowData = (message.data as Record<string, unknown>) || {};
			const rows = await addTableRow(tableId, rowData);
			vscode.window.showInformationMessage("Row added successfully.");
			postMessage({ type: "tableRowsData", data: rows });
		}
	} catch (err: unknown) {
		vscode.window.showErrorMessage(
			`Table operation failed: ${formatApiError(err)}`,
		);
	}
}

export const TableDataService = {
	fetchTableRows,
	addTableRow,
	handleWebviewMessage,
};
