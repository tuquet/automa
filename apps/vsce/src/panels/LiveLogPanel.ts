import * as vscode from "vscode";
import { TaskRunner } from "../core/TaskRunner";

export const LiveLogPanelManager = {
	currentPanels: new Map<string, vscode.WebviewPanel>(),

	showLiveLog(
		_context: vscode.ExtensionContext,
		taskId: string,
		taskName: string,
	) {
		let panel = LiveLogPanelManager.currentPanels.get(taskId);

		if (panel) {
			panel.reveal(vscode.ViewColumn.One);
			return;
		}

		panel = vscode.window.createWebviewPanel(
			"automaLiveLog",
			`Live Log: ${taskName}`,
			vscode.ViewColumn.One,
			{
				enableScripts: true,
				retainContextWhenHidden: true,
			},
		);

		LiveLogPanelManager.currentPanels.set(taskId, panel);
		panel.webview.html = this.getLiveLogHtml(taskName);

		const listener = (data: Record<string, unknown>) => {
			if (
				data &&
				(data.taskId === taskId ||
					data.id === taskId ||
					data.runnerId === taskId)
			) {
				panel?.webview.postMessage({
					type: "custom",
					event: "telemetry",
					payload: data,
				});
			}
		};

		TaskRunner.telemetryEmitter.on("telemetry", listener);

		panel.onDidDispose(() => {
			TaskRunner.telemetryEmitter.off("telemetry", listener);
			LiveLogPanelManager.currentPanels.delete(taskId);
		});
	},

	getLiveLogHtml(taskName: string): string {
		return `<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="UTF-8">
			<title>Live Log: ${taskName}</title>
			<style>
				body { font-family: var(--vscode-editor-font-family, monospace); font-size: 12px; background: var(--vscode-terminal-background, #1e1e1e); color: var(--vscode-terminal-foreground, #cccccc); padding: 12px; margin: 0; }
				.header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--vscode-panel-border, #333); padding-bottom: 8px; margin-bottom: 8px; font-family: var(--vscode-font-family); }
				.title { font-weight: 600; font-size: 13px; }
				#logsContainer { white-space: pre-wrap; word-break: break-all; line-height: 1.5; }
				.log-entry { margin-bottom: 4px; }
				.log-time { opacity: 0.6; margin-right: 8px; }
				.log-info { color: var(--vscode-terminal-ansiCyan, #4fc1ff); }
				.log-warn { color: var(--vscode-terminal-ansiYellow, #cca700); }
				.log-error { color: var(--vscode-terminal-ansiRed, #f14c4c); }
			</style>
		</head>
		<body>
			<div class="header">
				<div class="title">⚡ ${taskName}</div>
				<label><input type="checkbox" id="autoScroll" checked> Auto-scroll</label>
			</div>
			<div id="logsContainer"></div>

			<script>
				const container = document.getElementById('logsContainer');
				const autoScroll = document.getElementById('autoScroll');

				window.addEventListener('message', event => {
					const msg = event.data;
					if (msg && msg.event === 'telemetry' && msg.payload) {
						const d = msg.payload;
						const time = new Date().toLocaleTimeString();
						const text = d.message || JSON.stringify(d);
						const level = (d.level || (text.includes('error') ? 'error' : text.includes('warn') ? 'warn' : 'info')).toLowerCase();
						const div = document.createElement('div');
						div.className = 'log-entry';
						div.innerHTML = '<span class="log-time">[' + time + ']</span> <span class="log-' + level + '">' + text + '</span>';
						container.appendChild(div);
						if (autoScroll.checked) {
							window.scrollTo(0, document.body.scrollHeight);
						}
					}
				});
			</script>
		</body>
		</html>`;
	},
};

/** @deprecated Use LiveLogPanelManager */
export const LiveLogEditorProvider = LiveLogPanelManager;
