import { type ChildProcess, spawn } from "node:child_process";
import { client, createClient, getHealth } from "@automa/types/api";
import * as vscode from "vscode";
import { DAEMON_CONSTANTS, DAEMON_EVENTS } from "../constants";
import { Logger } from "../Logger";
import { CoreBinaryManager } from "./CoreBinaryManager";
import { DaemonUIService } from "./DaemonUIService";
import {
	globalEvents,
	startGlobalSseListener,
	stopGlobalSseListener,
} from "./GlobalSseListener";

export class DaemonService implements vscode.Disposable {
	private static uiService = new DaemonUIService();
	private static daemonProcess: ChildProcess | null = null;
	private static currentPort: number = DAEMON_CONSTANTS.DEFAULT_PORT;
	private static isExternalDaemon = false;
	private static storedContext: vscode.ExtensionContext | null = null;
	private static startPromise: Promise<void> | null = null;

	public dispose(): void {
		DaemonService.stop();
		DaemonService.uiService.dispose();
	}

	public static disposeUI(): void {
		DaemonService.uiService.dispose();
	}

	public static setContext(context: vscode.ExtensionContext) {
		DaemonService.storedContext = context;
	}

	public static initUI() {
		DaemonService.uiService.init();
	}

	public static getPort(): number {
		return DaemonService.currentPort;
	}

	public static isRunning(): boolean {
		return (
			DaemonService.daemonProcess !== null || DaemonService.isExternalDaemon
		);
	}

	private static async checkHealth(port: number): Promise<boolean> {
		const controller = new AbortController();
		const timeoutId = setTimeout(
			() => controller.abort(),
			DAEMON_CONSTANTS.HEALTH_CHECK_TIMEOUT_MS,
		);
		try {
			const tempClient = createClient({
				baseUrl: `http://127.0.0.1:${port}`,
			});

			const res = await getHealth({
				client: tempClient,
				signal: controller.signal as unknown as AbortSignal,
			});

			if (res.data?.status === "ok") {
				return true;
			}
		} catch (_e) {
		} finally {
			clearTimeout(timeoutId);
		}
		return false;
	}

	public static async waitUntilHealthy(
		port: number,
		maxRetries = 20,
		delayMs = 500,
	): Promise<boolean> {
		for (let i = 0; i < maxRetries; i++) {
			await new Promise((resolve) => setTimeout(resolve, delayMs));
			if (
				DaemonService.daemonProcess?.exitCode !== null &&
				DaemonService.daemonProcess?.exitCode !== undefined
			) {
				return false;
			}
			if (await DaemonService.checkHealth(port)) {
				return true;
			}
		}
		return false;
	}

	public static async start(context?: vscode.ExtensionContext): Promise<void> {
		if (context) {
			DaemonService.storedContext = context;
		}

		if (DaemonService.daemonProcess || DaemonService.isExternalDaemon) {
			Logger.info("Automa daemon is already running or connected.");
			return;
		}

		if (DaemonService.startPromise) {
			return DaemonService.startPromise;
		}

		DaemonService.startPromise = DaemonService.doStart(context);
		try {
			await DaemonService.startPromise;
		} finally {
			DaemonService.startPromise = null;
		}
	}

	private static async doStart(
		context?: vscode.ExtensionContext,
	): Promise<void> {
		const effectiveContext =
			context || DaemonService.storedContext || undefined;

		DaemonService.initUI();
		DaemonService.uiService.updateStatusStarting();

		try {
			const config = vscode.workspace.getConfiguration("automa");
			const basePort =
				config.get<number>("core.port") ||
				config.get<number>("daemon.port", DAEMON_CONSTANTS.DEFAULT_PORT);

			// 1. Luôn thử kết nối trước (Reuse)
			if (await DaemonService.checkHealth(basePort)) {
				Logger.info(`[Daemon] Connected to Rust Daemon on port ${basePort}.`);
				DaemonService.currentPort = basePort;
				DaemonService.isExternalDaemon = true;
				client.setConfig({
					baseUrl: `http://127.0.0.1:${DaemonService.currentPort}`,
				});
				startGlobalSseListener();
				DaemonService.uiService.updateStatusExternal(DaemonService.currentPort);
				globalEvents.emit(DAEMON_EVENTS.READY);
				return;
			}

			// 2. Locate or auto-download binary
			const binaryPath =
				await CoreBinaryManager.ensureBinaryExists(effectiveContext);
			DaemonService.currentPort = basePort;

			Logger.info(
				`Starting Automa Rust background daemon on port ${DaemonService.currentPort} via ${binaryPath}...`,
			);

			const env = { ...process.env };
			const cwd = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

			// Kích hoạt tiến trình ngầm
			DaemonService.daemonProcess = spawn(
				binaryPath,
				["serve", "--port", DaemonService.currentPort.toString()],
				{
					cwd,
					shell: false,
					detached: false,
					stdio: "pipe",
					env,
				},
			);
			DaemonService.attachProcessListeners();
			const isHealthy = await DaemonService.waitUntilHealthy(
				DaemonService.currentPort,
				DAEMON_CONSTANTS.SPAWN_HEALTH_CHECK_RETRIES,
				DAEMON_CONSTANTS.SPAWN_HEALTH_CHECK_DELAY_MS,
			);

			if (!isHealthy) {
				throw new Error(
					`Rust Daemon did not respond on port ${DaemonService.currentPort} within 10 seconds.`,
				);
			}

			Logger.info("Automa Rust background daemon started and healthy.");
			client.setConfig({
				baseUrl: `http://127.0.0.1:${DaemonService.currentPort}`,
			});
			DaemonService.uiService.updateStatusRunning(DaemonService.currentPort);
			globalEvents.emit(DAEMON_EVENTS.READY);
		} catch (error: unknown) {
			const e = error instanceof Error ? error : new Error(String(error));
			Logger.error(`Failed to connect to daemon: ${e.message}`);
			DaemonService.uiService.updateStatusStopped();
			globalEvents.emit(DAEMON_EVENTS.STOPPED);
			vscode.window.showErrorMessage(e.message);
			throw e;
		}
	}

	public static stop(): void {
		DaemonService.isExternalDaemon = false;
		if (DaemonService.daemonProcess) {
			DaemonService.daemonProcess.kill();
			DaemonService.daemonProcess = null;
			Logger.info("Automa Rust background daemon stopped.");
		}
		stopGlobalSseListener();
		DaemonService.uiService.updateStatusStopped();
		globalEvents.emit(DAEMON_EVENTS.STOPPED);
	}

	private static onProcessExit() {
		DaemonService.isExternalDaemon = false;
		stopGlobalSseListener();
		DaemonService.uiService.updateStatusStopped();
		globalEvents.emit(DAEMON_EVENTS.STOPPED);
	}

	private static attachProcessListeners() {
		if (!DaemonService.daemonProcess) return;

		const cleanLog = (msg: string) =>
			msg.replace(
				new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*[a-zA-Z]`, "g"),
				"",
			);

		if (DaemonService.daemonProcess.stdout) {
			DaemonService.daemonProcess.stdout.on("data", (data) => {
				const msg = data.toString().trim();
				if (msg) Logger.info(`[Rust Daemon] ${cleanLog(msg)}`);
			});
		}

		if (DaemonService.daemonProcess.stderr) {
			DaemonService.daemonProcess.stderr.on("data", (data) => {
				const msg = data.toString().trim();
				if (msg) Logger.error(`[Rust Daemon] ${cleanLog(msg)}`);
			});
		}

		DaemonService.daemonProcess.on("error", (err) => {
			Logger.error(`Failed to start Automa daemon: ${err.message}`);
			DaemonService.daemonProcess = null;
			DaemonService.onProcessExit();
		});

		DaemonService.daemonProcess.on("exit", (code) => {
			Logger.warn(`Automa daemon exited with code ${code}`);
			if (code !== 0 && code !== null) {
				vscode.window
					.showWarningMessage(
						"Automa Rust Daemon exited unexpectedly.",
						"View Logs",
					)
					.then((selection) => {
						if (selection === "View Logs") {
							const outputChannel = Logger.getOutputChannel();
							if (outputChannel) outputChannel.show(true);
						}
					});
			}
			DaemonService.daemonProcess = null;
			DaemonService.onProcessExit();
		});
	}
}
