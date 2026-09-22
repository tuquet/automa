import * as vscode from "vscode";
import { installBrowserBinary } from "../core/api/client";
import { DaemonService } from "../core/daemon/DaemonService";

export function installBrowserCommand() {
	return () => {
		return vscode.window.withProgress(
			{
				location: vscode.ProgressLocation.Notification,
				title: "Installing Automa Browser...",
				cancellable: false,
			},
			async (progress) => {
				try {
					const daemon = DaemonService;
					const port = daemon.getPort();

					try {
						const res = await installBrowserBinary({
							baseUrl: `http://127.0.0.1:${port}`,
						});
						if (res.error) throw new Error(String(res.error));
						progress.report({
							message: res.data?.message || "Installed successfully",
						});
					} catch (daemonErr: unknown) {
						const e =
							daemonErr instanceof Error
								? daemonErr
								: new Error(String(daemonErr));
						throw new Error(
							`[Install Browser] Failed to connect to Daemon: ${e.message}`,
						);
					}

					vscode.window.showInformationMessage(
						"Browser installed successfully!",
					);
				} catch (err: unknown) {
					const e = err instanceof Error ? err : new Error(String(err));
					vscode.window.showErrorMessage(
						`Failed to install browser: ${e.message}`,
					);
					throw e;
				}
			},
		);
	};
}

export function toggleDaemonCommand() {
	return async () => {
		const daemon = DaemonService;
		if (daemon.isRunning()) {
			daemon.stop();
		} else {
			await daemon.start();
		}
	};
}

export function openDaemonMenuCommand() {
	return async () => {
		const isRunning = DaemonService.isRunning();
		const port = DaemonService.getPort();

		interface DaemonMenuItem extends vscode.QuickPickItem {
			action: string;
		}

		const items: DaemonMenuItem[] = isRunning
			? [
					{
						label: "$(link-external) Open Web Studio Canvas",
						description: `http://127.0.0.1:${port}/studio`,
						action: "studio",
					},
					{
						label: "$(new-file) Create New Workflow",
						description: "Create a new automation workflow in SQLite",
						action: "newWorkflow",
					},
					{
						label: "$(globe) Launch Browser Profile",
						description: "Start an anti-detect Chromium instance",
						action: "launchBrowser",
					},
					{
						label: "$(output) View Daemon Live Logs",
						description: "Focus output channel stream",
						action: "logs",
					},
					{
						label: "$(sync) Restart Daemon",
						description: `Restart core process on port ${port}`,
						action: "restart",
					},
					{
						label: "$(stop-circle) Stop Daemon",
						description: "Shut down background daemon process",
						action: "stop",
					},
					{
						label: "$(gear) Configure Settings",
						description: "Open extension configuration",
						action: "settings",
					},
				]
			: [
					{
						label: "$(play) Start Automa Core Daemon",
						description: `Start daemon on port ${port}`,
						action: "start",
					},
					{
						label: "$(output) View Logs",
						description: "Focus output channel",
						action: "logs",
					},
					{
						label: "$(gear) Configure Settings",
						description: "Open extension configuration",
						action: "settings",
					},
				];

		const picked = await vscode.window.showQuickPick(items, {
			placeHolder: `Automa Core Daemon [${isRunning ? `Online :${port}` : "Offline"}]`,
		});

		if (!picked) return;

		switch (picked.action) {
			case "studio":
				await vscode.commands.executeCommand("automa.openInStudio");
				break;
			case "newWorkflow":
				await vscode.commands.executeCommand("automa.createWorkflow");
				break;
			case "launchBrowser":
				await vscode.commands.executeCommand("automa.launchBrowser");
				break;
			case "logs":
				await vscode.commands.executeCommand("automa.showLiveLog");
				break;
			case "restart":
				DaemonService.stop();
				await DaemonService.start();
				break;
			case "start":
			case "stop":
				await toggleDaemonCommand()();
				break;
			case "settings":
				await vscode.commands.executeCommand(
					"workbench.action.openSettings",
					"automa",
				);
				break;
		}
	};
}
