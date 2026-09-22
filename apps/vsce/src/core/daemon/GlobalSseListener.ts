import { EventEmitter } from "node:events";
import type { AutomaEventData } from "@automa/types";
import { DAEMON_EVENTS } from "../constants/events.constants";
import { Logger } from "../Logger";
import { DaemonService } from "./DaemonService";

export type { AutomaEventData };

export const globalEvents = new EventEmitter();
globalEvents.setMaxListeners(50);

let sseAbortController: AbortController | null = null;
let isListening = false;
let isExplicitlyStopped = false;
let reconnectTimer: NodeJS.Timeout | null = null;

export async function startGlobalSseListener() {
	if (isListening) return;
	isExplicitlyStopped = false;

	if (reconnectTimer) {
		clearTimeout(reconnectTimer);
		reconnectTimer = null;
	}

	const port = DaemonService.getPort();
	if (!port) return;

	try {
		isListening = true;
		sseAbortController = new AbortController();

		Logger.info(`Starting Global SSE Listener on port ${port}...`);

		const { subscribeEventsSse } = await import("../api/client");
		const { stream } = await subscribeEventsSse({
			baseUrl: `http://127.0.0.1:${port}`,
			signal: sseAbortController.signal,
		});

		for await (const event of stream) {
			try {
				let eventData: AutomaEventData | undefined;
				if (typeof event === "string") {
					eventData = JSON.parse(event) as AutomaEventData;
				} else if (event && typeof event === "object") {
					const evObj = event as Record<string, unknown>;
					if (typeof evObj.data === "string") {
						eventData = JSON.parse(evObj.data) as AutomaEventData;
					} else if (evObj.data && typeof evObj.data === "object") {
						eventData = evObj.data as AutomaEventData;
					} else if (typeof evObj.type === "string") {
						eventData = evObj as unknown as AutomaEventData;
					}
				}

				if (eventData?.type) {
					globalEvents.emit(eventData.type, eventData);

					if (
						eventData.type === DAEMON_EVENTS.BROWSER_ONLINE ||
						eventData.type === DAEMON_EVENTS.BROWSER_OFFLINE
					) {
						globalEvents.emit(DAEMON_EVENTS.BROWSER_STATUS_CHANGED, eventData);
					}

					if (eventData.type === DAEMON_EVENTS.WORKFLOW_FINISHED) {
						globalEvents.emit(DAEMON_EVENTS.JOB_STATUS_CHANGED, {
							...eventData,
							status: "completed",
						});
					}
				}
			} catch (_e) {
				// Ignore parse error
			}
		}
	} catch (err: unknown) {
		const e = err as Error;
		if (e.name !== "AbortError") {
			Logger.error(`Global SSE Listener error: ${e.message}`);
		}
	} finally {
		isListening = false;
		sseAbortController = null;

		if (DaemonService.isRunning() && !isExplicitlyStopped) {
			reconnectTimer = setTimeout(startGlobalSseListener, 2000);
		}
	}
}

export function stopGlobalSseListener() {
	isExplicitlyStopped = true;
	if (reconnectTimer) {
		clearTimeout(reconnectTimer);
		reconnectTimer = null;
	}
	if (sseAbortController) {
		sseAbortController.abort();
		sseAbortController = null;
	}
	isListening = false;
}
