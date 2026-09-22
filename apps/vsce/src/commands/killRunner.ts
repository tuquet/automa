import type { RunnerItem } from "@automa/types";
import * as vscode from "vscode";
import { killJob } from "../core/api/client";
import { formatApiError } from "../utils/errorUtils";

export async function killRunner(item?: RunnerItem) {
	if (!item?.jobId) {
		vscode.window.showErrorMessage("No runner selected to kill.");
		return;
	}

	try {
		const res = await killJob({ path: { job_id: item.jobId } });
		if (res.error) throw new Error(formatApiError(res.error));

		vscode.window.showInformationMessage(`Stopped runner: ${item.jobId}`);
		vscode.commands.executeCommand("automa.refreshLogs");
	} catch (error: unknown) {
		vscode.window.showErrorMessage(
			`Failed to stop runner: ${formatApiError(error)}`,
		);
	}
}
