import type { AutomaWsCommand, AutomaWsEvent } from "@automa/types/ws";
import type * as vscode from "vscode";
import { DaemonService } from "../daemon/DaemonService";
import { Logger } from "../Logger";

export type WsEventHandler = (event: AutomaWsEvent) => void;

/**
 * Robust 2-way real-time WebSocket client for Automa Core (/api/v1/ws).
 * Supports live breakpoint debugging, pausing, resuming, and bidirectional controls.
 */
export class WebSocketService implements vscode.Disposable {
	private static instance: WebSocketService | null = null;
	private ws: WebSocket | null = null;
	private reconnectTimer: NodeJS.Timeout | null = null;
	private isExplicitlyClosed = false;
	private eventListeners: Map<string, Set<WsEventHandler>> = new Map();
	private messageListeners: Set<(raw: AutomaWsEvent) => void> = new Set();

	private constructor() {}

	public dispose(): void {
		this.disconnect();
	}

	public static getInstance(): WebSocketService {
		if (!WebSocketService.instance) {
			WebSocketService.instance = new WebSocketService();
		}
		return WebSocketService.instance;
	}

	/**
	 * Connects to Automa Core WebSocket endpoint.
	 */
	public connect(port?: number): void {
		if (
			this.ws &&
			(this.ws.readyState === WebSocket.OPEN ||
				this.ws.readyState === WebSocket.CONNECTING)
		) {
			return;
		}

		this.isExplicitlyClosed = false;
		const daemonPort = port || DaemonService.getPort() || 8765;
		const wsUrl = `ws://127.0.0.1:${daemonPort}/api/v1/ws`;

		try {
			if (typeof globalThis.WebSocket === "undefined") {
				Logger.warn(
					"[WebSocket] Native WebSocket client not supported in this runtime.",
				);
				return;
			}

			this.ws = new globalThis.WebSocket(wsUrl);

			this.ws.onopen = () => {
				Logger.info(`[WebSocket] Connected to Automa Core at ${wsUrl}`);
				// Subscribe to broadcast event streams by default
				this.sendCommand({ type: "SUBSCRIBE_EVENTS" });
			};

			this.ws.onmessage = (event: MessageEvent) => {
				try {
					const data = JSON.parse(String(event.data)) as AutomaWsEvent;
					this.dispatchMessage(data);
				} catch (err) {
					Logger.warn(`[WebSocket] Failed to parse message: ${String(err)}`);
				}
			};

			this.ws.onclose = () => {
				this.ws = null;
				if (!this.isExplicitlyClosed) {
					this.scheduleReconnect(daemonPort);
				}
			};

			this.ws.onerror = (err) => {
				Logger.warn(`[WebSocket] Connection error on ${wsUrl}: ${String(err)}`);
			};
		} catch (err) {
			Logger.warn(`[WebSocket] Exception creating WebSocket: ${String(err)}`);
			this.scheduleReconnect(daemonPort);
		}
	}

	/**
	 * Sends a typed command to Automa Core.
	 */
	public sendCommand(command: AutomaWsCommand): boolean {
		if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
			Logger.warn("[WebSocket] Cannot send command: socket is not open.");
			return false;
		}

		try {
			this.ws.send(JSON.stringify(command));
			return true;
		} catch (err) {
			Logger.error(`[WebSocket] Failed to send command: ${String(err)}`);
			return false;
		}
	}

	/**
	 * Pauses a running job for live step-debugging and inspecting variables.
	 */
	public pauseJob(jobId: string): boolean {
		return this.sendCommand({ type: "PAUSE_JOB", jobId });
	}

	/**
	 * Resumes a paused job execution.
	 */
	public resumeJob(jobId: string): boolean {
		return this.sendCommand({ type: "RESUME_JOB", jobId });
	}

	/**
	 * Forcibly kills an active job.
	 */
	public killJob(jobId: string): boolean {
		return this.sendCommand({ type: "KILL_JOB", jobId });
	}

	/**
	 * Subscribes to a specific event type (e.g. 'JOB_PROGRESS', 'JOB_STATUS_CHANGED').
	 */
	public on(
		eventType: AutomaWsEvent["type"] | "*",
		handler: WsEventHandler,
	): vscode.Disposable {
		if (!this.eventListeners.has(eventType)) {
			this.eventListeners.set(eventType, new Set());
		}
		this.eventListeners.get(eventType)?.add(handler);

		return {
			dispose: () => {
				this.eventListeners.get(eventType)?.delete(handler);
			},
		};
	}

	/**
	 * Registers a global raw message listener.
	 */
	public onMessage(listener: (msg: AutomaWsEvent) => void): vscode.Disposable {
		this.messageListeners.add(listener);
		return {
			dispose: () => {
				this.messageListeners.delete(listener);
			},
		};
	}

	/**
	 * Dispatches parsed WS events to registered listeners.
	 */
	private dispatchMessage(message: AutomaWsEvent): void {
		// Specific event type listeners
		const listeners = this.eventListeners.get(message.type);
		if (listeners) {
			for (const listener of listeners) {
				try {
					listener(message);
				} catch (err) {
					Logger.error(`[WebSocket] Error in event listener: ${String(err)}`);
				}
			}
		}

		// Wildcard listeners
		const wildcardListeners = this.eventListeners.get("*");
		if (wildcardListeners) {
			for (const listener of wildcardListeners) {
				try {
					listener(message);
				} catch (err) {
					Logger.error(
						`[WebSocket] Error in wildcard listener: ${String(err)}`,
					);
				}
			}
		}

		// Message listeners
		for (const listener of this.messageListeners) {
			try {
				listener(message);
			} catch (err) {
				Logger.error(`[WebSocket] Error in message listener: ${String(err)}`);
			}
		}
	}

	private scheduleReconnect(port: number): void {
		if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
		this.reconnectTimer = setTimeout(() => {
			if (DaemonService.isRunning() && !this.isExplicitlyClosed) {
				this.connect(port);
			}
		}, 3000);
	}

	/**
	 * Explicitly disconnects and cleans up resources.
	 */
	public disconnect(): void {
		this.isExplicitlyClosed = true;
		if (this.reconnectTimer) {
			clearTimeout(this.reconnectTimer);
			this.reconnectTimer = null;
		}
		if (this.ws) {
			try {
				this.ws.close();
			} catch (_) {}
			this.ws = null;
		}
		this.eventListeners.clear();
		this.messageListeners.clear();
	}
}
