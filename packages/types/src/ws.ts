/**
 * Automa WebSocket Protocol Contracts
 * Provides 2-way real-time bidirectional communication between Clients (Studio/VS Code) and Automa Core.
 */

/**
 * Commands sent from Client -> Automa Core
 */
export type AutomaWsCommand =
  | { type: 'PING'; timestamp?: number }
  | { type: 'SUBSCRIBE_EVENTS'; channels?: string[] }
  | { type: 'PAUSE_JOB'; jobId: string }
  | { type: 'RESUME_JOB'; jobId: string }
  | { type: 'KILL_JOB'; jobId: string }
  | { type: 'EXECUTE_WORKFLOW'; workflowPath: string; browserId?: string; options?: Record<string, unknown> }
  | { type: 'CDP_COMMAND'; browserId: string; method: string; params?: Record<string, unknown> };

/**
 * Events streamed from Automa Core -> Client
 */
export type AutomaWsEvent =
  | { type: 'PONG'; timestamp: number }
  | { type: 'CONNECTED'; serverVersion: string; clientId: string }
  | { type: 'JOB_PROGRESS'; jobId: string; step: number; log?: unknown }
  | { type: 'JOB_STATUS_CHANGED'; jobId: string; status: 'running' | 'completed' | 'failed' | 'paused' | 'stopped'; error?: string }
  | { type: 'SYSTEM_METRICS'; cpuUsage: number; memoryFree: number; memoryTotal: number; activeRunners: number }
  | { type: 'ERROR'; code: string; message: string; details?: unknown };

/**
 * Universal WebSocket Envelope
 */
export type AutomaWsMessage = AutomaWsCommand | AutomaWsEvent;
