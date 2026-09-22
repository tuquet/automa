/**
 * System Invariants and Daemon Constants
 */

export const DAEMON_DEFAULT_PORT = 8765
export const DAEMON_BASE_URL = `http://127.0.0.1:${DAEMON_DEFAULT_PORT}`
export const DAEMON_WS_URL = `ws://127.0.0.1:${DAEMON_DEFAULT_PORT}/api/v1/ws`
export const DAEMON_SSE_URL = `http://127.0.0.1:${DAEMON_DEFAULT_PORT}/api/v1/events`
export const STUDIO_EMBED_URL = `http://127.0.0.1:${DAEMON_DEFAULT_PORT}/studio/`
export const STUDIO_EMBED_HEADLESS_URL = `${STUDIO_EMBED_URL}?headless=true`

export const HEALTH_CHECK_INTERVAL_MS = 5000
export const RECONNECT_DELAY_MS = 3000
export const DAEMON_DOCS_URL = `${DAEMON_BASE_URL}/api/v1/docs`
