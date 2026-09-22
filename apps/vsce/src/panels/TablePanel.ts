import * as vscode from "vscode";
import { VIEW_TYPES } from "../core/constants";
import { handleWebviewMessage } from "../core/services/storage/TableDataService";
import type { StorageItem } from "../providers/StorageTreeDataProvider";

export const TablePanel = {
	currentPanels: new Map<string, vscode.WebviewPanel>(),

	async show(_context: vscode.ExtensionContext, item: StorageItem) {
		const tableId = item.itemId || item.label;
		const existingPanel = TablePanel.currentPanels.get(tableId);

		if (existingPanel) {
			existingPanel.reveal(vscode.ViewColumn.One);
			return;
		}

		const panel = vscode.window.createWebviewPanel(
			VIEW_TYPES.TABLE_PANEL,
			`Table: ${item.label}`,
			vscode.ViewColumn.One,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
			},
		);

		TablePanel.currentPanels.set(tableId, panel);

		panel.onDidDispose(() => {
			TablePanel.currentPanels.delete(tableId);
		});

		panel.webview.html = this.getTableHtml(tableId, item.label);

		panel.webview.onDidReceiveMessage(async (message) => {
			await handleWebviewMessage(tableId, message, (msg) => {
				panel.webview.postMessage(msg);
			});
		});
	},

	getTableHtml(_tableId: string, label: string): string {
		return `<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<title>Table: ${label}</title>
			<style>
				body { font-family: var(--vscode-font-family); background: var(--vscode-editor-background); color: var(--vscode-editor-foreground); padding: 16px; margin: 0; }
				.toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; gap: 8px; }
				input { background: var(--vscode-input-background); color: var(--vscode-input-foreground); border: 1px solid var(--vscode-input-border); padding: 6px 10px; border-radius: 4px; flex: 1; max-width: 320px; outline: none; }
				button { background: var(--vscode-button-background); color: var(--vscode-button-foreground); border: none; padding: 6px 14px; border-radius: 4px; cursor: pointer; }
				button:hover { background: var(--vscode-button-hoverBackground); }
				table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 13px; }
				th, td { border: 1px solid var(--vscode-panel-border); padding: 8px 12px; text-align: left; }
				th { background: var(--vscode-sideBar-background); font-weight: 600; }
				tr:hover td { background: var(--vscode-list-hoverBackground); }
				.empty { padding: 32px; text-align: center; opacity: 0.7; }
			</style>
		</head>
		<body>
			<div class="toolbar">
				<input id="searchInput" type="text" placeholder="Search rows in table..." />
				<button id="refreshBtn">Refresh</button>
			</div>
			<div id="tableContainer">Loading data...</div>

			<script>
				const vscode = acquireVsCodeApi();
				const searchInput = document.getElementById('searchInput');
				const refreshBtn = document.getElementById('refreshBtn');
				const tableContainer = document.getElementById('tableContainer');

				function renderTable(rows) {
					if (!rows || rows.length === 0) {
						tableContainer.innerHTML = '<div class="empty">No rows found in this table.</div>';
						return;
					}
					const columns = Object.keys(rows[0]);
					let html = '<table><thead><tr>' + columns.map(c => '<th>' + c + '</th>').join('') + '</tr></thead><tbody>';
					for (const row of rows) {
						html += '<tr>' + columns.map(c => '<td>' + (row[c] !== undefined ? row[c] : '') + '</td>').join('') + '</tr>';
					}
					html += '</tbody></table>';
					tableContainer.innerHTML = html;
				}

				window.addEventListener('message', event => {
					const msg = event.data;
					if (msg && msg.type === 'tableRowsData') {
						renderTable(msg.data);
					}
				});

				function loadData() {
					vscode.postMessage({ type: 'getTableRows', query: searchInput.value });
				}

				searchInput.addEventListener('input', () => {
					loadData();
				});
				refreshBtn.addEventListener('click', () => loadData());

				loadData();
			</script>
		</body>
		</html>`;
	},
};
