import { EventEmitter } from "node:events";
import type { TaskOptions } from "@automa/types";
import * as vscode from "vscode";
import { killJob, type SubmitJobPayload, submitJob } from "./api/client";
import { DaemonService } from "./daemon/DaemonService";
import { type AutomaEventData, globalEvents } from "./daemon/GlobalSseListener";
import { Logger } from "./Logger";
import { TaskUIService } from "./ui/TaskUIService";

export type { TaskOptions };

const telemetryEmitter = new EventEmitter();

export const TaskRunner = {
	telemetryEmitter,

	async submitJob(
		payload: SubmitJobPayload,
		options: TaskOptions,
		uiService: TaskUIService = new TaskUIService(),
	): Promise<void> {
		Logger.info(`submitJob called for: ${options.name}`);
		uiService.showStartMessage(options.startMessage);
		uiService.initStatusBar(options.statusBarText);

		const outputChannel = Logger.getOutputChannel();
		if (outputChannel) outputChannel.show(false);

		return vscode.window.withProgress(
			{
				location: vscode.ProgressLocation.Notification,
				title: options.startMessage || `Executing: ${options.name}`,
				cancellable: true,
			},
			async (progress, token) => {
				progress.report({ message: "Initializing..." });

				try {
					const daemon = DaemonService;
					if (!daemon.isRunning()) {
						TaskRunner.telemetryEmitter.emit("telemetry", {
							message: "[Daemon] Booting Automa Core background daemon...",
						});
						await daemon.start();
					}
					const port = daemon.getPort();

					TaskRunner.telemetryEmitter.emit("telemetry", {
						message: `[Daemon] Connected to Daemon on port ${port}. Submitting job...`,
					});

					const res = await submitJob({
						baseUrl: `http://127.0.0.1:${port}`,
						body: payload as SubmitJobPayload,
					});
					if (res.error) {
						const errObj = res.error as unknown as Record<string, unknown>;
						const errDetail =
							errObj?.message ||
							JSON.stringify(res.error) ||
							"Internal Server Error";
						throw new Error(`[API Error] ${errDetail}`);
					}

					const jobId = res.data?.jobId || `job_${Date.now()}`;

					Logger.info(`Job submitted successfully with ID: ${jobId}`);
					TaskRunner.telemetryEmitter.emit("telemetry", {
						message: `[Job] Job ID: ${jobId}`,
					});

					await TaskRunner.listenJobLogs(
						port,
						jobId,
						options,
						uiService,
						progress,
						token,
					);
				} catch (error: unknown) {
					const e = error instanceof Error ? error : new Error(String(error));
					Logger.error(`[Daemon Error] ${e.message}`);
					TaskRunner.telemetryEmitter.emit("telemetry", {
						message: `[Error] ${e.message}`,
					});

					if (!token.isCancellationRequested) {
						const action = await vscode.window.showErrorMessage(
							`${options.errorMessage || "An error occurred."} Details: ${e.message}`,
							"View Logs",
						);
						if (action === "View Logs" && outputChannel) {
							outputChannel.show(true);
						}
					}
					throw e;
				} finally {
					uiService.disposeStatusBar();
				}
			},
		);
	},

	async listenJobLogs(
		_port: number,
		jobId: string,
		options: TaskOptions,
		uiService: TaskUIService,
		progress: vscode.Progress<{ message?: string; increment?: number }>,
		token: vscode.CancellationToken,
	): Promise<void> {
		let isCompleted = false;
		let resolveCompletion: () => void = () => {};
		let rejectCompletion: (err: Error) => void = () => {};
		const completionPromise = new Promise<void>((resolve, reject) => {
			resolveCompletion = resolve;
			rejectCompletion = reject;
		});

		const markCompleted = () => {
			if (!isCompleted) {
				isCompleted = true;
				resolveCompletion();
			}
		};

		const markFailed = (error: Error) => {
			if (!isCompleted) {
				isCompleted = true;
				rejectCompletion(error);
			}
		};

		const abortController = new AbortController();
		const cancelListener = token.onCancellationRequested(async () => {
			Logger.warn(`Task ${jobId} was cancelled by user.`);
			markCompleted();
			abortController.abort();
			try {
				await killJob({
					baseUrl: `http://127.0.0.1:${_port}`,
					path: { job_id: jobId },
				});
			} catch (err: unknown) {
				Logger.warn(`Failed to kill job ${jobId} on cancel: ${String(err)}`);
			}
		});

		const globalListener = (eventData: AutomaEventData) => {
			if (isCompleted || eventData?.jobId !== jobId) return;

			switch (eventData.type) {
				case "workflow_finished":
					markCompleted();
					break;

				case "job_status_changed": {
					const status = String(eventData.status || "");
					if (
						["completed", "success", "failed", "error", "cancelled"].includes(
							status,
						)
					) {
						abortController.abort();

						if (["completed", "success"].includes(status)) {
							markCompleted();
							uiService.showSuccessMessage(options.successMessage);
						} else if (["failed", "error"].includes(status)) {
							const msg =
								options.errorMessage || `Job ${jobId} execution failed.`;
							markFailed(new Error(msg));
						} else if (status === "cancelled") {
							markFailed(new Error(`Job ${jobId} was cancelled.`));
						}
					}
					break;
				}

				case "log": {
					const rawMsg =
						typeof eventData.data === "string"
							? eventData.data
							: eventData.data
								? JSON.stringify(eventData.data)
								: "";
					const strippedMessage = TaskUIService.stripAnsi(rawMsg);

					progress.report({ message: strippedMessage });

					if (
						strippedMessage.toLowerCase().includes("error") ||
						strippedMessage.toLowerCase().includes("failed")
					) {
						Logger.error(`[log] ${strippedMessage}`);
					} else {
						Logger.info(`[log] ${strippedMessage}`);
					}
					uiService.updateStatusBar(options.statusBarText, strippedMessage);
					TaskRunner.telemetryEmitter.emit("telemetry", {
						taskId: jobId,
						type: "log",
						message: strippedMessage,
						data: eventData.data,
					});
					break;
				}
			}
		};

		let timeoutHandle: NodeJS.Timeout | undefined;
		try {
			globalEvents.on("log", globalListener);
			globalEvents.on("workflow_finished", globalListener);
			globalEvents.on("job_status_changed", globalListener);

			// Setup timeout of 5 minutes
			timeoutHandle = setTimeout(async () => {
				if (!isCompleted) {
					Logger.error(`Job ${jobId} timed out after 5 minutes.`);
					markFailed(new Error(`Job ${jobId} timed out after 5 minutes.`));
					abortController.abort();
					try {
						await killJob({
							baseUrl: `http://127.0.0.1:${_port}`,
							path: { job_id: jobId },
						});
					} catch (err: unknown) {
						Logger.warn(
							`Failed to kill job ${jobId} on timeout: ${String(err)}`,
						);
					}
				}
			}, 300000);

			// Wait for completion event or timeout
			await completionPromise;
		} catch (error: unknown) {
			if (
				error instanceof Error &&
				error.name !== "AbortError" &&
				error.message !== "Job was cancelled by user."
			) {
				Logger.error(`[Job Error] ${error.message}`);
			}
			if (
				token.isCancellationRequested ||
				(error instanceof Error &&
					error.message === "Job was cancelled by user.")
			) {
				return;
			}
			throw error;
		} finally {
			if (timeoutHandle) clearTimeout(timeoutHandle);
			globalEvents.off("log", globalListener);
			globalEvents.off("workflow_finished", globalListener);
			globalEvents.off("job_status_changed", globalListener);
			abortController.abort();
			cancelListener.dispose();
		}
	},
};
