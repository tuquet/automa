import type { BrowserProfile } from './browser.js';
import type { Campaign } from './campaign.js';
import type { Workflow } from './workflow.js';

export interface WorkflowRunPayload {
  parameters?: Record<string, unknown>;
  keepBrowserOpen?: boolean;
  browserId?: string;
}

export type CampaignPreviewMessage =
  | { command: 'ready'; type?: 'ready' }
  | { command: 'run-campaign'; type?: 'run-campaign'; keepBrowserOpen?: boolean; browserId?: string }
  | { command: 'stop-campaign'; type?: 'stop-campaign' }
  | { command: 'save-campaign'; type?: 'save-campaign'; data: Partial<Campaign> }
  | { command: 'open-workflow'; type?: 'open-workflow'; id: string }
  | { command: 'open-browser'; type?: 'open-browser'; id: string }
  | { command: 'error'; type?: 'error'; text?: string };

export type WorkflowPreviewMessage =
  | { command?: 'ready'; type: 'ready' }
  | { command?: 'runWorkflow' | 'automa:run-workflow'; type: 'runWorkflow' | 'automa:run-workflow'; keepBrowserOpen?: boolean; parameters?: Record<string, unknown>; browserId?: string; data?: WorkflowRunPayload }
  | { command?: 'stopWorkflow'; type: 'stopWorkflow' }
  | { command?: 'showOutput'; type: 'showOutput' }
  | { command?: 'saveWorkflow' | 'automa:workflow-changed'; type: 'saveWorkflow' | 'automa:workflow-changed'; data: Partial<Workflow> }
  | { command?: 'viewLogs'; type: 'viewLogs' }
  | { command?: 'openInStudio'; type: 'openInStudio' }
  | { command?: 'pickWorkflowFile' | 'automa:pick-file'; type: 'pickWorkflowFile' | 'automa:pick-file' };

export type TableEditorMessage =
  | { command?: 'getTableRows'; type: 'getTableRows'; query?: string }
  | { command?: 'addTableRow'; type: 'addTableRow'; row: Record<string, unknown> };

export type LogEditorMessage =
  | { command: 'ready'; type?: 'ready' }
  | { command: 'open-workflow'; type?: 'open-workflow'; id: string };

export type BrowserPreviewMessage =
  | { command: 'ready'; type?: 'ready' }
  | { command: 'save-browser'; type?: 'save-browser'; data: Partial<BrowserProfile> }
  | { command: 'error'; type?: 'error'; text?: string };

export type PackagePreviewMessage = { command: 'ready'; type?: 'ready' };

export type ExecutionTelemetryMessage =
  | { type: 'task:started' }
  | { type: 'task:log'; data: { timestamp: string; level: 'info' | 'warn' | 'error'; message: string } }
  | { type: 'task:error'; error: string }
  | { type: 'task:completed' }
  | { type: 'task:stopped' };

export type WebviewViewType = 'dashboard' | 'browsers' | 'workflow' | 'campaign' | 'logs' | 'table';

export interface WebviewInitialData<T = unknown> {
  viewType: WebviewViewType;
  payload?: T;
}

export type DashboardToExtensionMessage =
  | { type: 'ready' }
  | { type: 'refresh' }
  | { type: 'runCampaign'; path: string }
  | { type: 'toggleCron'; path: string }
  | { type: 'openCampaign'; path: string }
  | { type: 'showLog'; id: string }
  | { type: 'killJob'; id: string }
  | { type: 'deleteHistory'; id: string }
  | { type: 'clearHistory' };

export type WebviewMessage =
  | CampaignPreviewMessage
  | WorkflowPreviewMessage
  | TableEditorMessage
  | LogEditorMessage
  | BrowserPreviewMessage
  | PackagePreviewMessage
  | ExecutionTelemetryMessage
  | DashboardToExtensionMessage;

export interface SseEvent<T = unknown> {
  event?: string;
  data: T;
  id?: string;
  retry?: number;
}

export interface AutomaEventData {
  type: string;
  jobId?: string;
  data?: unknown;
  [key: string]: unknown;
}
