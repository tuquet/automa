/**
 * Global Daemon and Extension Event identifiers
 */
export const DAEMON_EVENTS = {
	READY: "daemon_ready",
	STOPPED: "daemon_stopped",
	BROWSER_STATUS_CHANGED: "browser_status_changed",
	BROWSER_ONLINE: "browser_online",
	BROWSER_OFFLINE: "browser_offline",
	JOB_STATUS_CHANGED: "job_status_changed",
	WORKFLOW_FINISHED: "workflow_finished",
	STORAGE_CHANGED: "storage_changed",
	SETTINGS_CHANGED: "settings_changed",
	TELEMETRY: "telemetry",
	LOG: "log",
	MATRIX_STARTED: "matrix_started",
	MATRIX_SLOT_UPDATED: "matrix_slot_updated",
	MATRIX_FINISHED: "matrix_finished",
} as const;

export type DaemonEventName =
	(typeof DAEMON_EVENTS)[keyof typeof DAEMON_EVENTS];
