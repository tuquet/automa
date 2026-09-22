import * as vscode from "vscode";
import {
	type BrowserResponse,
	getBrowsers,
	patchAppSettings,
} from "../core/api/client";
import { DaemonService } from "../core/daemon/DaemonService";

export async function selectDefaultBrowserCommand(
	item?: { id?: string } | string,
) {
	if (!DaemonService.isRunning()) {
		await DaemonService.start();
	}

	const directId = typeof item === "string" ? item : item?.id;
	if (directId) {
		await vscode.workspace
			.getConfiguration("automa.run")
			.update("defaultBrowser", directId, vscode.ConfigurationTarget.Global);

		try {
			const port = DaemonService.getPort();
			await patchAppSettings({
				baseUrl: `http://127.0.0.1:${port}`,
				body: {
					browser: {
						default_profile_id: directId,
					},
				},
			});
			vscode.window.showInformationMessage(
				`Default browser set to: ${directId}`,
			);
		} catch {
			// Ignored
		}
		return;
	}

	try {
		const res = await getBrowsers();
		const data = (res.data || []) as BrowserResponse[];

		const currentDefault = vscode.workspace
			.getConfiguration("automa.run")
			.get<string>("defaultBrowser", "daemon_worker");

		const items: vscode.QuickPickItem[] = [
			{
				label: "Default Worker (Automa Core)",
				description: "daemon_worker",
				detail: `Isolated background Chromium worker${currentDefault === "daemon_worker" ? " (Current Default ⭐)" : ""}`,
			},
			...data.map((p) => ({
				label: p.name || p.id || "Unknown Browser",
				description: p.id || undefined,
				detail: `Browser Instance${p.id === currentDefault ? " (Current Default ⭐)" : ""}`,
			})),
		];

		const selected = await vscode.window.showQuickPick(items, {
			placeHolder: "Select the default Browser to run Workflows",
			title: "Automa Run: Select Default Browser",
		});

		if (selected?.description) {
			await vscode.workspace
				.getConfiguration("automa.run")
				.update(
					"defaultBrowser",
					selected.description,
					vscode.ConfigurationTarget.Global,
				);

			try {
				const daemon = DaemonService;
				const port = daemon.getPort();
				await patchAppSettings({
					baseUrl: `http://127.0.0.1:${port}`,
					body: {
						browser: {
							default_profile_id: selected.description,
						},
					},
				});
			} catch {
				// Ignore daemon sync errors if daemon is offline
			}

			vscode.window.showInformationMessage(
				`Default Browser set to: ${selected.label} ⭐`,
			);
			await vscode.commands.executeCommand("automa.refreshBrowsers");
		}
	} catch (e: unknown) {
		const msg = e instanceof Error ? e.message : String(e);
		vscode.window.showErrorMessage(`Failed to load browsers: ${msg}`);
	}
}
