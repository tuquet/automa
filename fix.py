import os

content = """import * as vscode from 'vscode';
import { DaemonService } from '../core/daemon/DaemonService';
import type { VaultItem } from '../providers/VaultTreeDataProvider';

export class TablePanel {
	private static currentPanel: vscode.WebviewPanel | undefined;

	public static async show(context: vscode.ExtensionContext, item: VaultItem) {
		if (TablePanel.currentPanel) {
			TablePanel.currentPanel.dispose();
		}

		TablePanel.currentPanel = vscode.window.createWebviewPanel(
			'automaTableEditor',
			'Table: ' + item.label,
			vscode.ViewColumn.One,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
			}
		);

		TablePanel.currentPanel.onDidDispose(
			() => {
				TablePanel.currentPanel = undefined;
			},
			null,
			context.subscriptions
		);

		try {
			const port = DaemonService.getPort();
			const url = 'http://127.0.0.1:' + port + '/studio/#/storage/tables/' + item.itemId;
            
			TablePanel.currentPanel.webview.html = `<!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${item.label}</title>
                <style>
                    body, html { margin: 0; padding: 0; height: 100%; overflow: hidden; background-color: var(--vscode-editor-background); }
                    iframe { width: 100%; height: 100%; border: none; }
                </style>
            </head>
            <body>
                <iframe src="${url}"></iframe>
            </body>
            </html>`;
		} catch (error: any) {
			TablePanel.currentPanel.webview.html = `<body><h2>Error</h2><p>${error.message}</p></body>`;
		}
	}
}
"""
with open('automa-vscode/src/panels/TablePanel.ts', 'w') as f:
    f.write(content)

