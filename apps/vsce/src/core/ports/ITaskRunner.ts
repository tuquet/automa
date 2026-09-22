import type * as vscode from "vscode";
import type { JobId } from "../models/id";
import type { TaskOptions } from "../TaskRunner";
import type { TaskUIService } from "../ui/TaskUIService";

export interface ITaskRunner {
	submitJob(
		jobPayload: Record<string, unknown>,
		options: TaskOptions,
		uiService?: TaskUIService,
	): Promise<void>;
	listenJobLogs(
		port: number,
		jobId: string | JobId,
		options: TaskOptions,
		uiService: TaskUIService,
		progress?: vscode.Progress<{ message?: string; increment?: number }>,
		token?: vscode.CancellationToken,
	): Promise<void>;
}
