/**
 * Canonical Button Business Logic Prototype Schema & Event-Driven Contracts
 * Defines strict state machine, OpenAPI operation bindings, and event-driven reaction rules for all UI action triggers.
 */

import type { ApiErrorResponse } from './api/types.gen.js';
import type { AutomaWsCommand } from './ws.js';

/**
 * Context scopes where buttons can be mounted in the UI
 */
export type ButtonContextScope =
  | 'WorkflowCanvas'
  | 'CampaignMatrix'
  | 'BrowserManager'
  | 'StorageExplorer'
  | 'HistoryLogs'
  | 'SystemTitlebar'
  | 'CommandPalette';

/**
 * Finite State Machine (FSM) execution states for a button
 */
export type ButtonExecutionState =
  | 'IDLE'
  | 'VALIDATING'
  | 'DISPATCHING'
  | 'EXECUTING'
  | 'TERMINATING'
  | 'COMPLETED'
  | 'FAILED';

/**
 * Confirmation modal schema for destructive or high-impact actions
 */
export interface ConfirmationModalConfig {
  title: string;
  message: string;
  confirmText: string;
  cancelText?: string;
  variant: 'default' | 'destructive' | 'warning';
}

/**
 * REST Endpoint Dispatch Contract mapped to an OpenAPI operation
 */
export interface RestDispatchContract {
  type: 'REST';
  operationId: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  pathTemplate: string;
  buildPayload?: (context: unknown) => Record<string, unknown> | undefined;
}

/**
 * WebSocket Command Dispatch Contract
 */
export interface WebSocketDispatchContract {
  type: 'WEBSOCKET';
  commandType: AutomaWsCommand['type'];
  buildCommand: (context: unknown) => AutomaWsCommand;
}

/**
 * IPC Dispatch Contract (Tauri v2 / VS Code Webview)
 */
export interface IpcDispatchContract {
  type: 'IPC';
  channel: string;
  buildPayload?: (context: unknown) => unknown;
}

export type ButtonDispatchContract =
  | RestDispatchContract
  | WebSocketDispatchContract
  | IpcDispatchContract;

/**
 * Real-time event reaction rule for an executing button
 */
export interface EventReactionRule {
  source: 'SSE' | 'WEBSOCKET' | 'IPC';
  eventType: string;
  handler: (eventData: unknown, buttonContext: unknown) => void;
}

/**
 * Cross-Component Reactive Reflection Specification
 * Defines what dependent components/stores/selects MUST reactively update when this action succeeds
 */
export interface ReactiveReflectionRule {
  /** Target dependent entity ID (e.g. "select.browser.profile", "panel.browsers", "store.workflow.isDirty") */
  targetId: string;

  /** Nature of reactive reflection */
  reflectionType: 'INVALIDATE_CACHE' | 'MUTATE_STATE' | 'ENABLE_DISABLE' | 'FOCUS_VIEW' | 'UPDATE_BADGE';

  /** Event emitted to broadcast this change (SSE/WS/IPC) */
  broadcastEvent?: string;

  /** Description of the reactive reflection behavior */
  description: string;
}

/**
 * Complete Button Business Logic Schema Definition
 */
export interface ButtonBusinessLogicSchema<TContext = unknown, TResponse = unknown> {
  /** Unique dot-delimited identifier: domain.subdomain.action */
  id: string;

  /** Visual and functional context scope */
  context: ButtonContextScope;

  /** Presentation and accessibility configuration */
  presentation: {
    label: string;
    icon: string;
    dataTestId: string;
    tooltip?: string;
    keyboardShortcut?: string;
    badgeCountKey?: string;
  };

  /** Preconditions required before the button can be triggered */
  preConditions: {
    requiresDaemonHealthy?: boolean;
    requiresSelection?: boolean;
    requiresDirtyState?: boolean;
    customValidator?: (context: TContext) => boolean | Promise<boolean>;
    confirmationModal?: ConfirmationModalConfig;
  };

  /** Outbound dispatch protocol and endpoint specification */
  dispatch: ButtonDispatchContract;

  /** Real-time inbound event listeners during execution */
  eventReactions?: EventReactionRule[];

  /** Cross-Component Reactive Reflections triggered upon successful execution */
  reactiveReflections?: ReactiveReflectionRule[];

  /** Postconditions, state mutations, and error handling */
  postConditions: {
    onSuccess: (response: TResponse, context: TContext) => void;
    onError: (error: ApiErrorResponse | Error, context: TContext) => void;
    mutateStoreKeys?: string[];
    refreshQueries?: string[];
  };
}

/**
 * Canonical Catalog of 37 standard UI Action Triggers / Buttons
 * Fully compliant with docs/SRS_BUTTON_BUSINESS_LOGIC_EVENT_DRIVEN.md
 */
export const BUTTON_CATALOG: readonly ButtonBusinessLogicSchema[] = [
  // 4.1 Workflow & Canvas Execution
  {
    id: 'btn.workflow.run',
    context: 'WorkflowCanvas',
    presentation: {
      label: 'Run Workflow',
      icon: 'Play',
      dataTestId: 'btn-run-workflow',
      tooltip: 'Execute active workflow in configured browser instance',
      keyboardShortcut: 'F5',
    },
    preConditions: {
      requiresDaemonHealthy: true,
      requiresSelection: false,
      requiresDirtyState: false,
    },
    dispatch: {
      type: 'REST',
      operationId: 'submit_job',
      method: 'POST',
      pathTemplate: '/api/v1/jobs',
    },
    postConditions: {
      onSuccess: () => {},
      onError: () => {},
    },
  },
  {
    id: 'btn.workflow.pause',
    context: 'WorkflowCanvas',
    presentation: {
      label: 'Pause Execution',
      icon: 'Pause',
      dataTestId: 'btn-pause-workflow',
      tooltip: 'Pause running workflow execution at current breakpoint',
    },
    preConditions: {
      requiresDaemonHealthy: true,
    },
    dispatch: {
      type: 'WEBSOCKET',
      commandType: 'PAUSE_JOB',
      buildCommand: (ctx: unknown) => ({
        type: 'PAUSE_JOB',
        jobId: (ctx as { jobId: string }).jobId,
      }),
    },
    postConditions: {
      onSuccess: () => {},
      onError: () => {},
    },
  },
  {
    id: 'btn.workflow.resume',
    context: 'WorkflowCanvas',
    presentation: {
      label: 'Resume Execution',
      icon: 'Play',
      dataTestId: 'btn-resume-workflow',
      tooltip: 'Resume paused workflow execution',
    },
    preConditions: {
      requiresDaemonHealthy: true,
    },
    dispatch: {
      type: 'WEBSOCKET',
      commandType: 'RESUME_JOB',
      buildCommand: (ctx: unknown) => ({
        type: 'RESUME_JOB',
        jobId: (ctx as { jobId: string }).jobId,
      }),
    },
    postConditions: {
      onSuccess: () => {},
      onError: () => {},
    },
  },
  {
    id: 'btn.workflow.stop',
    context: 'WorkflowCanvas',
    presentation: {
      label: 'Stop / Kill',
      icon: 'Square',
      dataTestId: 'btn-stop-workflow',
      tooltip: 'Force stop and terminate active job session',
      keyboardShortcut: 'Shift+F5',
    },
    preConditions: {
      requiresDaemonHealthy: true,
    },
    dispatch: {
      type: 'REST',
      operationId: 'kill_job',
      method: 'DELETE',
      pathTemplate: '/api/v1/jobs/{job_id}',
    },
    postConditions: {
      onSuccess: () => {},
      onError: () => {},
    },
  },
  {
    id: 'btn.workflow.save',
    context: 'WorkflowCanvas',
    presentation: {
      label: 'Save Workflow',
      icon: 'Save',
      dataTestId: 'btn-save-workflow',
      tooltip: 'Save workflow changes to storage',
      keyboardShortcut: 'Ctrl+S',
    },
    preConditions: {
      requiresDirtyState: true,
    },
    dispatch: {
      type: 'REST',
      operationId: 'save_workflow',
      method: 'PUT',
      pathTemplate: '/api/v1/storage/workflow',
    },
    postConditions: {
      onSuccess: () => {},
      onError: () => {},
    },
  },
  {
    id: 'btn.workflow.lint',
    context: 'WorkflowCanvas',
    presentation: {
      label: 'Lint & Check',
      icon: 'Sparkles',
      dataTestId: 'btn-lint-workflow',
      tooltip: 'Validate workflow syntax, schema, and connection topology',
    },
    preConditions: {
      requiresDaemonHealthy: true,
    },
    dispatch: {
      type: 'REST',
      operationId: 'lint_workflow',
      method: 'POST',
      pathTemplate: '/api/v1/lint',
    },
    postConditions: {
      onSuccess: () => {},
      onError: () => {},
    },
  },
  {
    id: 'btn.workflow.open_studio',
    context: 'WorkflowCanvas',
    presentation: {
      label: 'Open in Studio',
      icon: 'ExternalLink',
      dataTestId: 'btn-open-studio',
      tooltip: 'Open workflow canvas in standalone web studio',
    },
    preConditions: {},
    dispatch: {
      type: 'REST',
      operationId: 'open_web_studio',
      method: 'POST',
      pathTemplate: '/api/v1/system/studio/session',
    },
    postConditions: {
      onSuccess: () => {},
      onError: () => {},
    },
  },

  // 4.2 Campaign & Matrix Fleet Scheduling
  {
    id: 'btn.campaign.run_matrix',
    context: 'CampaignMatrix',
    presentation: {
      label: 'Execute Matrix',
      icon: 'Rocket',
      dataTestId: 'btn-run-campaign',
      tooltip: 'Execute multi-browser campaign matrix with parallel slots',
    },
    preConditions: {
      requiresDaemonHealthy: true,
    },
    dispatch: {
      type: 'REST',
      operationId: 'execute_campaign',
      method: 'POST',
      pathTemplate: '/api/v1/campaigns/execute',
    },
    postConditions: {
      onSuccess: () => {},
      onError: () => {},
    },
  },
  {
    id: 'btn.campaign.abort',
    context: 'CampaignMatrix',
    presentation: {
      label: 'Abort Matrix',
      icon: 'OctagonAlert',
      dataTestId: 'btn-abort-campaign',
      tooltip: 'Abort all running jobs in this campaign matrix',
    },
    preConditions: {
      requiresDaemonHealthy: true,
    },
    dispatch: {
      type: 'REST',
      operationId: 'abort_campaign',
      method: 'DELETE',
      pathTemplate: '/api/v1/campaigns/{id}',
    },
    postConditions: {
      onSuccess: () => {},
      onError: () => {},
    },
  },
  {
    id: 'btn.campaign.refresh',
    context: 'CampaignMatrix',
    presentation: {
      label: 'Refresh Matrix',
      icon: 'RefreshCw',
      dataTestId: 'btn-refresh-matrix',
      tooltip: 'Refresh real-time matrix grid slot status',
    },
    preConditions: {
      requiresDaemonHealthy: true,
    },
    dispatch: {
      type: 'REST',
      operationId: 'get_campaign_matrix_status',
      method: 'GET',
      pathTemplate: '/api/v1/campaigns/{id}/matrix-status',
    },
    postConditions: {
      onSuccess: () => {},
      onError: () => {},
    },
  },
  {
    id: 'btn.campaign.create',
    context: 'CampaignMatrix',
    presentation: {
      label: 'New Campaign',
      icon: 'Plus',
      dataTestId: 'btn-create-campaign',
      tooltip: 'Create a new matrix automation campaign',
    },
    preConditions: {
      requiresDaemonHealthy: true,
    },
    dispatch: {
      type: 'REST',
      operationId: 'create_storage_campaign',
      method: 'POST',
      pathTemplate: '/api/v1/storage/campaigns',
    },
    postConditions: {
      onSuccess: () => {},
      onError: () => {},
    },
  },
  {
    id: 'btn.campaign.delete',
    context: 'CampaignMatrix',
    presentation: {
      label: 'Delete Campaign',
      icon: 'Trash2',
      dataTestId: 'btn-delete-campaign',
      tooltip: 'Permanently remove campaign from database',
    },
    preConditions: {
      requiresDaemonHealthy: true,
      confirmationModal: {
        title: 'Delete Campaign',
        message: 'Are you sure you want to permanently delete this campaign?',
        confirmText: 'Delete',
        variant: 'destructive',
      },
    },
    dispatch: {
      type: 'REST',
      operationId: 'delete_storage_campaign',
      method: 'DELETE',
      pathTemplate: '/api/v1/storage/campaigns/{id}',
    },
    postConditions: {
      onSuccess: () => {},
      onError: () => {},
    },
  },

  // 4.3 Anti-Detect Browser Profiles
  {
    id: 'btn.browser.launch',
    context: 'BrowserManager',
    presentation: {
      label: 'Launch Browser',
      icon: 'Globe',
      dataTestId: 'btn-launch-browser',
      tooltip: 'Start isolated Chromium browser instance for this profile',
    },
    preConditions: {
      requiresDaemonHealthy: true,
    },
    dispatch: {
      type: 'REST',
      operationId: 'start_browser_session',
      method: 'POST',
      pathTemplate: '/api/v1/browsers/{id}/session',
    },
    postConditions: {
      onSuccess: () => {},
      onError: () => {},
    },
  },
  {
    id: 'btn.browser.stop',
    context: 'BrowserManager',
    presentation: {
      label: 'Stop Session',
      icon: 'Power',
      dataTestId: 'btn-stop-browser',
      tooltip: 'Terminate browser process session',
    },
    preConditions: {
      requiresDaemonHealthy: true,
    },
    dispatch: {
      type: 'REST',
      operationId: 'stop_browser_session',
      method: 'DELETE',
      pathTemplate: '/api/v1/browsers/{id}/session',
    },
    postConditions: {
      onSuccess: () => {},
      onError: () => {},
    },
  },
  {
    id: 'btn.browser.kill_all',
    context: 'BrowserManager',
    presentation: {
      label: 'Kill All Sessions',
      icon: 'ZapOff',
      dataTestId: 'btn-kill-all-browsers',
      tooltip: 'Emergency shutdown of all browser processes',
    },
    preConditions: {
      requiresDaemonHealthy: true,
      confirmationModal: {
        title: 'Kill All Browser Sessions',
        message: 'Force terminate all managed Chromium child processes?',
        confirmText: 'Kill All',
        variant: 'destructive',
      },
    },
    dispatch: {
      type: 'REST',
      operationId: 'kill_all_browsers',
      method: 'DELETE',
      pathTemplate: '/api/v1/browsers/sessions',
    },
    postConditions: {
      onSuccess: () => {},
      onError: () => {},
    },
  },
  {
    id: 'btn.browser.create',
    context: 'BrowserManager',
    presentation: {
      label: 'Create Profile',
      icon: 'Plus',
      dataTestId: 'btn-create-browser',
      tooltip: 'Register a new anti-detect browser profile',
    },
    preConditions: {
      requiresDaemonHealthy: true,
    },
    dispatch: {
      type: 'REST',
      operationId: 'create_browser',
      method: 'POST',
      pathTemplate: '/api/v1/browsers',
    },
    postConditions: {
      onSuccess: () => {},
      onError: () => {},
    },
  },
  {
    id: 'btn.browser.import_csv',
    context: 'BrowserManager',
    presentation: {
      label: 'Import CSV',
      icon: 'Upload',
      dataTestId: 'btn-import-browsers-csv',
      tooltip: 'Batch import browser profiles from CSV file',
    },
    preConditions: {
      requiresDaemonHealthy: true,
    },
    dispatch: {
      type: 'REST',
      operationId: 'import_browsers_csv',
      method: 'POST',
      pathTemplate: '/api/v1/browsers/import-csv',
    },
    postConditions: {
      onSuccess: () => {},
      onError: () => {},
    },
  },
  {
    id: 'btn.browser.import_cookies',
    context: 'BrowserManager',
    presentation: {
      label: 'Import Cookies',
      icon: 'Cookie',
      dataTestId: 'btn-import-cookies',
      tooltip: 'Inject Netscape JSON cookies into browser session',
    },
    preConditions: {
      requiresDaemonHealthy: true,
    },
    dispatch: {
      type: 'REST',
      operationId: 'import_browser_cookies',
      method: 'POST',
      pathTemplate: '/api/v1/browsers/{id}/cookies',
    },
    postConditions: {
      onSuccess: () => {},
      onError: () => {},
    },
  },
  {
    id: 'btn.browser.sideload_ext',
    context: 'BrowserManager',
    presentation: {
      label: 'Add Extension',
      icon: 'Puzzle',
      dataTestId: 'btn-sideload-ext',
      tooltip: 'Attach unpacked extension or CRX to browser profile',
    },
    preConditions: {
      requiresDaemonHealthy: true,
    },
    dispatch: {
      type: 'REST',
      operationId: 'sideload_browser_extension',
      method: 'POST',
      pathTemplate: '/api/v1/browsers/{id}/extensions',
    },
    postConditions: {
      onSuccess: () => {},
      onError: () => {},
    },
  },
  {
    id: 'btn.browser.set_default',
    context: 'BrowserManager',
    presentation: {
      label: 'Set as Default',
      icon: 'Star',
      dataTestId: 'btn-set-default-browser',
      tooltip: 'Set as default browser for workflow executions',
    },
    preConditions: {
      requiresDaemonHealthy: true,
    },
    dispatch: {
      type: 'REST',
      operationId: 'patch_app_settings',
      method: 'PATCH',
      pathTemplate: '/api/v1/system/settings',
    },
    postConditions: {
      onSuccess: () => {},
      onError: () => {},
    },
  },
  {
    id: 'btn.browser.auto_detect',
    context: 'BrowserManager',
    presentation: {
      label: 'Auto-Detect Host Browsers',
      icon: 'Scan',
      dataTestId: 'btn-autodetect-browsers',
      tooltip: 'Scan host system for Chrome/Edge/Brave and create profiles',
    },
    preConditions: {
      requiresDaemonHealthy: true,
    },
    dispatch: {
      type: 'REST',
      operationId: 'auto_detect_browsers',
      method: 'POST',
      pathTemplate: '/api/v1/browsers/auto-detect',
    },
    postConditions: {
      onSuccess: () => {},
      onError: () => {},
    },
  },
  {
    id: 'btn.browser.download_binary',
    context: 'BrowserManager',
    presentation: {
      label: 'Download Managed Chromium',
      icon: 'DownloadCloud',
      dataTestId: 'btn-download-chromium',
      tooltip: 'Download and install portable managed Chromium binary',
    },
    preConditions: {
      requiresDaemonHealthy: true,
    },
    dispatch: {
      type: 'REST',
      operationId: 'install_browser_binary',
      method: 'POST',
      pathTemplate: '/api/v1/system/browser-binaries',
    },
    postConditions: {
      onSuccess: () => {},
      onError: () => {},
    },
  },

  // 4.4 Global Storage
  {
    id: 'btn.storage.table.add',
    context: 'StorageExplorer',
    presentation: {
      label: 'Create Table',
      icon: 'Plus',
      dataTestId: 'btn-add-table',
      tooltip: 'Create new structured data table in SQLite',
    },
    preConditions: {
      requiresDaemonHealthy: true,
    },
    dispatch: {
      type: 'REST',
      operationId: 'add_storage_table',
      method: 'POST',
      pathTemplate: '/api/v1/storage/tables',
    },
    postConditions: {
      onSuccess: () => {},
      onError: () => {},
    },
  },
  {
    id: 'btn.storage.table.add_row',
    context: 'StorageExplorer',
    presentation: {
      label: 'Add Row',
      icon: 'PlusCircle',
      dataTestId: 'btn-add-table-row',
      tooltip: 'Insert a new record row into current table',
    },
    preConditions: {
      requiresDaemonHealthy: true,
    },
    dispatch: {
      type: 'REST',
      operationId: 'add_storage_table_row',
      method: 'POST',
      pathTemplate: '/api/v1/storage/tables/{id}/rows',
    },
    postConditions: {
      onSuccess: () => {},
      onError: () => {},
    },
  },
  {
    id: 'btn.storage.table.delete',
    context: 'StorageExplorer',
    presentation: {
      label: 'Delete Table',
      icon: 'Trash',
      dataTestId: 'btn-delete-table',
      tooltip: 'Drop table and all rows permanently',
    },
    preConditions: {
      requiresDaemonHealthy: true,
      confirmationModal: {
        title: 'Delete Storage Table',
        message: 'Are you sure you want to drop this table and all its records?',
        confirmText: 'Delete Table',
        variant: 'destructive',
      },
    },
    dispatch: {
      type: 'REST',
      operationId: 'delete_storage_table',
      method: 'DELETE',
      pathTemplate: '/api/v1/storage/tables/{id}',
    },
    postConditions: {
      onSuccess: () => {},
      onError: () => {},
    },
  },
  {
    id: 'btn.storage.var.add',
    context: 'StorageExplorer',
    presentation: {
      label: 'New Variable',
      icon: 'Plus',
      dataTestId: 'btn-add-variable',
      tooltip: 'Add global plaintext configuration variable',
    },
    preConditions: {
      requiresDaemonHealthy: true,
    },
    dispatch: {
      type: 'REST',
      operationId: 'add_storage_variable',
      method: 'POST',
      pathTemplate: '/api/v1/storage/variables',
    },
    postConditions: {
      onSuccess: () => {},
      onError: () => {},
    },
  },
  {
    id: 'btn.storage.var.delete',
    context: 'StorageExplorer',
    presentation: {
      label: 'Delete Variable',
      icon: 'Trash',
      dataTestId: 'btn-delete-variable',
      tooltip: 'Delete configuration variable from storage',
    },
    preConditions: {
      requiresDaemonHealthy: true,
      confirmationModal: {
        title: 'Delete Variable',
        message: 'Delete this global configuration variable?',
        confirmText: 'Delete',
        variant: 'destructive',
      },
    },
    dispatch: {
      type: 'REST',
      operationId: 'delete_storage_variable',
      method: 'DELETE',
      pathTemplate: '/api/v1/storage/variables/{id}',
    },
    postConditions: {
      onSuccess: () => {},
      onError: () => {},
    },
  },
  {
    id: 'btn.storage.cred.add',
    context: 'StorageExplorer',
    presentation: {
      label: 'New Credential',
      icon: 'Lock',
      dataTestId: 'btn-add-credential',
      tooltip: 'Store new AES-256 encrypted credential secret',
    },
    preConditions: {
      requiresDaemonHealthy: true,
    },
    dispatch: {
      type: 'REST',
      operationId: 'add_storage_credential',
      method: 'POST',
      pathTemplate: '/api/v1/storage/credentials',
    },
    postConditions: {
      onSuccess: () => {},
      onError: () => {},
    },
  },
  {
    id: 'btn.storage.cred.delete',
    context: 'StorageExplorer',
    presentation: {
      label: 'Delete Credential',
      icon: 'Trash',
      dataTestId: 'btn-delete-credential',
      tooltip: 'Delete encrypted secret credential',
    },
    preConditions: {
      requiresDaemonHealthy: true,
      confirmationModal: {
        title: 'Delete Encrypted Credential',
        message: 'Permanently remove this encrypted secret from SQLite?',
        confirmText: 'Delete Secret',
        variant: 'destructive',
      },
    },
    dispatch: {
      type: 'REST',
      operationId: 'delete_storage_credential',
      method: 'DELETE',
      pathTemplate: '/api/v1/storage/credentials/{id}',
    },
    postConditions: {
      onSuccess: () => {},
      onError: () => {},
    },
  },

  // 4.5 Telemetry & Execution History
  {
    id: 'btn.history.clear_all',
    context: 'HistoryLogs',
    presentation: {
      label: 'Clear History',
      icon: 'Trash2',
      dataTestId: 'btn-clear-history',
      tooltip: 'Purge all execution history records and logs',
    },
    preConditions: {
      requiresDaemonHealthy: true,
      confirmationModal: {
        title: 'Clear All Execution History',
        message: 'Purge all job logs and execution history records from SQLite?',
        confirmText: 'Clear All',
        variant: 'destructive',
      },
    },
    dispatch: {
      type: 'REST',
      operationId: 'clear_all_job_history',
      method: 'DELETE',
      pathTemplate: '/api/v1/history',
    },
    postConditions: {
      onSuccess: () => {},
      onError: () => {},
    },
  },
  {
    id: 'btn.history.delete_item',
    context: 'HistoryLogs',
    presentation: {
      label: 'Delete Log Item',
      icon: 'X',
      dataTestId: 'btn-delete-history-item',
      tooltip: 'Delete execution log record',
    },
    preConditions: {
      requiresDaemonHealthy: true,
      confirmationModal: {
        title: 'Delete History Entry',
        message: 'Delete this execution trace and log file?',
        confirmText: 'Delete',
        variant: 'destructive',
      },
    },
    dispatch: {
      type: 'REST',
      operationId: 'delete_job_history_item',
      method: 'DELETE',
      pathTemplate: '/api/v1/history/{job_id}',
    },
    postConditions: {
      onSuccess: () => {},
      onError: () => {},
    },
  },
  {
    id: 'btn.history.view_logs',
    context: 'HistoryLogs',
    presentation: {
      label: 'Inspect Logs',
      icon: 'FileText',
      dataTestId: 'btn-view-job-logs',
      tooltip: 'Inspect step-by-step logs for selected job execution',
    },
    preConditions: {
      requiresDaemonHealthy: true,
    },
    dispatch: {
      type: 'REST',
      operationId: 'get_job_execution_logs',
      method: 'GET',
      pathTemplate: '/api/v1/history/{job_id}/logs',
    },
    postConditions: {
      onSuccess: () => {},
      onError: () => {},
    },
  },
  {
    id: 'btn.history.export_logs',
    context: 'HistoryLogs',
    presentation: {
      label: 'Export JSON/Text',
      icon: 'Download',
      dataTestId: 'btn-export-logs',
      tooltip: 'Export execution logs to local file',
    },
    preConditions: {},
    dispatch: {
      type: 'IPC',
      channel: 'storage:export_logs',
    },
    postConditions: {
      onSuccess: () => {},
      onError: () => {},
    },
  },

  // 4.6 System, Window Ergonomics & Command Palette
  {
    id: 'btn.system.health_check',
    context: 'SystemTitlebar',
    presentation: {
      label: 'Daemon Status',
      icon: 'Activity',
      dataTestId: 'btn-health-check',
      tooltip: 'Check Automa Core daemon health status',
    },
    preConditions: {},
    dispatch: {
      type: 'REST',
      operationId: 'get_health',
      method: 'GET',
      pathTemplate: '/api/v1/health',
    },
    postConditions: {
      onSuccess: () => {},
      onError: () => {},
    },
  },
  {
    id: 'btn.system.command_palette',
    context: 'CommandPalette',
    presentation: {
      label: 'Command Palette',
      icon: 'Command',
      dataTestId: 'btn-command-palette',
      tooltip: 'Open Command Palette for fuzzy search',
      keyboardShortcut: 'Ctrl+K',
    },
    preConditions: {},
    dispatch: {
      type: 'IPC',
      channel: 'system:toggle_command_palette',
    },
    postConditions: {
      onSuccess: () => {},
      onError: () => {},
    },
  },
  {
    id: 'btn.system.toggle_theme',
    context: 'SystemTitlebar',
    presentation: {
      label: 'Theme Mode',
      icon: 'Sun',
      dataTestId: 'btn-toggle-theme',
      tooltip: 'Toggle Dark / Light mode theme',
    },
    preConditions: {},
    dispatch: {
      type: 'REST',
      operationId: 'update_app_settings',
      method: 'PATCH',
      pathTemplate: '/api/v1/system/settings',
    },
    postConditions: {
      onSuccess: () => {},
      onError: () => {},
    },
  },
  {
    id: 'btn.window.minimize',
    context: 'SystemTitlebar',
    presentation: {
      label: 'Minimize',
      icon: 'Minus',
      dataTestId: 'btn-window-minimize',
      tooltip: 'Minimize window to taskbar',
    },
    preConditions: {},
    dispatch: {
      type: 'IPC',
      channel: 'window:minimize',
    },
    postConditions: {
      onSuccess: () => {},
      onError: () => {},
    },
  },
  {
    id: 'btn.window.maximize',
    context: 'SystemTitlebar',
    presentation: {
      label: 'Maximize/Restore',
      icon: 'Square',
      dataTestId: 'btn-window-maximize',
      tooltip: 'Maximize or restore window size',
    },
    preConditions: {},
    dispatch: {
      type: 'IPC',
      channel: 'window:maximize',
    },
    postConditions: {
      onSuccess: () => {},
      onError: () => {},
    },
  },
  {
    id: 'btn.window.close',
    context: 'SystemTitlebar',
    presentation: {
      label: 'Close Window',
      icon: 'Close',
      dataTestId: 'btn-window-close',
      tooltip: 'Close window',
    },
    preConditions: {},
    dispatch: {
      type: 'IPC',
      channel: 'window:close',
    },
    postConditions: {
      onSuccess: () => {},
      onError: () => {},
    },
  },
] as const;

