export type CampaignPreviewMessage =
  | { command: 'ready' }
  | { command: 'run-campaign'; keepBrowserOpen: boolean }
  | { command: 'stop-campaign' }
  | { command: 'save-campaign'; data: unknown }
  | { command: 'open-workflow'; id: string }
  | { command: 'open-browser'; id: string }
  | { command: 'error'; text?: string };

export type WorkflowPreviewMessage =
  | { command: 'ready' }
  | { command: 'runWorkflow'; keepBrowserOpen: boolean; parameters?: unknown }
  | { command: 'stopWorkflow' }
  | { command: 'saveWorkflow'; data: unknown }
  | { command: 'viewLogs' }
  | { command: 'openInStudio' };

export type LogEditorMessage =
  | { command: 'ready' }
  | { command: 'open-workflow'; id: string };

export type BrowserPreviewMessage =
  | { command: 'ready' }
  | { command: 'save-browser'; data: unknown }
  | { command: 'error'; text?: string };

export type PackagePreviewMessage = { command: 'ready' };

export type WebviewMessage =
  | CampaignPreviewMessage
  | WorkflowPreviewMessage
  | LogEditorMessage
  | BrowserPreviewMessage
  | PackagePreviewMessage;

export interface SseEvent<T = unknown> {
  event?: string;
  data: T;
  id?: string;
  retry?: number;
}
