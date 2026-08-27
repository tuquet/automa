/**
 * Canonical Feature Store Contracts & Reactive State Topology
 * Defines strict state interfaces, getters, actions, and SSE/WS reactive event bindings
 * for all 6 domain feature stores across the ecosystem.
 */

import type { Workflow } from './workflow.js';
import type { BrowserResponse, JobInfo, AppSettings } from './api/types.gen.js';
import type { ButtonExecutionState } from './button.js';
import type { SelectOption } from './select.js';

// ==========================================
// 1. WORKFLOW CANVAS STORE
// ==========================================
export interface WorkflowStoreState {
  /** Active workflow AST document */
  workflow: Partial<Workflow>;
  /** Filepath or Storage ID of the workflow */
  workflowId: string;
  /** Whether unsaved modifications exist in the canvas */
  isDirty: boolean;
  /** Currently selected / highlighted node ID on the canvas */
  activeNodeId: string | null;
  /** Set of node IDs marked as execution breakpoints */
  breakpoints: string[];
  /** Execution status of the workflow editor */
  fsmState: ButtonExecutionState;
  /** Array of active linter diagnostic issues */
  lintIssues: Array<{ id: string; nodeId?: string; message: string; severity: 'error' | 'warning' | 'info' }>;
}

export interface WorkflowStoreActions {
  setWorkflow(data: Partial<Workflow>, id?: string): void;
  updateNodeData(nodeId: string, data: Record<string, unknown>): void;
  toggleBreakpoint(nodeId: string): void;
  setActiveNode(nodeId: string | null): void;
  markDirty(dirty?: boolean): void;
  setFsmState(state: ButtonExecutionState): void;
  setLintIssues(issues: WorkflowStoreState['lintIssues']): void;
}

// ==========================================
// 2. BROWSER PROFILES & FLEET STORE
// ==========================================
export interface BrowserStoreState {
  /** Array of all known browser profiles from SQLite */
  browsers: BrowserResponse[];
  /** Currently selected target browser profile ID */
  selectedBrowserId: string;
  /** Set of browser profile IDs currently running (Online) */
  onlineBrowserIds: string[];
  /** Active browser executable waterfall resolution status */
  waterfallResolution: {
    activeType: string;
    executablePath: string | null;
    isDetected: boolean;
  };
  /** Loading state indicator for remote profile operations */
  isLoading: boolean;
  /** Search filter query string */
  searchQuery: string;
}

export interface BrowserStoreActions {
  setBrowsers(browsers: BrowserResponse[]): void;
  addBrowser(browser: BrowserResponse): void;
  removeBrowser(id: string): void;
  setSelectedBrowser(id: string): void;
  setBrowserOnline(id: string, online: boolean): void;
  setWaterfallResolution(data: BrowserStoreState['waterfallResolution']): void;
  setSearchQuery(query: string): void;
}

// ==========================================
// 3. CAMPAIGN MATRIX FLEET STORE
// ==========================================
export interface CampaignStoreState {
  /** Currently loaded campaign ID */
  campaignId: string | null;
  /** Campaign name */
  campaignName: string;
  /** Real-time allocated grid slots */
  activeSlots: Array<{
    slotIndex: number;
    browserId: string;
    workflowId: string;
    status: 'idle' | 'running' | 'completed' | 'failed';
    progressPercent: number;
  }>;
  /** Campaign execution state */
  status: 'idle' | 'running' | 'aborted' | 'completed';
  /** Total slots configured in current matrix */
  totalSlots: number;
}

export interface CampaignStoreActions {
  setCampaign(id: string, name: string): void;
  updateSlot(slotIndex: number, data: Partial<CampaignStoreState['activeSlots'][0]>): void;
  setCampaignStatus(status: CampaignStoreState['status']): void;
  resetMatrix(): void;
}

// ==========================================
// 4. GLOBAL STORAGE STORE (TABLES, VARS, SECRETS)
// ==========================================
export interface StorageStoreState {
  /** List of database storage tables */
  tables: Array<{ id: string; name: string; rowCount?: number }>;
  /** Active table ID being viewed in TableView */
  activeTableId: string | null;
  /** Current page rows of active table */
  activeTableRows: Array<{ id: string; [key: string]: unknown }>;
  /** List of global variables */
  variables: Array<{ id: string; key: string; name: string; value: unknown }>;
  /** List of encrypted credential keys */
  credentials: Array<{ id: string; key: string; name: string }>;
  /** Loading indicator */
  isLoading: boolean;
}

export interface StorageStoreActions {
  setTables(tables: StorageStoreState['tables']): void;
  setActiveTable(id: string | null, rows?: StorageStoreState['activeTableRows']): void;
  setVariables(variables: StorageStoreState['variables']): void;
  setCredentials(credentials: StorageStoreState['credentials']): void;
  addVariable(variable: StorageStoreState['variables'][0]): void;
  removeVariable(key: string): void;
}

// ==========================================
// 5. RUNTIME EXECUTION & TELEMETRY STORE
// ==========================================
export interface ExecutionStoreState {
  /** Active running job identifier */
  activeJobId: string | null;
  /** FSM execution lifecycle state */
  fsmState: ButtonExecutionState;
  /** Telemetry log entries buffer */
  logs: Array<{
    id: string;
    timestamp: string;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    blockId?: string;
  }>;
  /** Execution error message if failed */
  lastError: string | null;
  /** Whether execution logs console panel is focused/open */
  isConsoleOpen: boolean;
}

export interface ExecutionStoreActions {
  setActiveJob(jobId: string | null): void;
  setFsmState(state: ButtonExecutionState): void;
  appendLog(message: string, level?: ExecutionStoreState['logs'][0]['level'], blockId?: string): void;
  clearLogs(): void;
  setConsoleOpen(open: boolean): void;
  setLastError(error: string | null): void;
}

// ==========================================
// 6. SYSTEM CONFIGURATION & SETTINGS STORE
// ==========================================
export interface SettingsStoreState {
  /** Full application settings from daemon */
  settings: AppSettings | null;
  /** Daemon connection health status */
  isDaemonHealthy: boolean;
  /** UI Dark/Light Theme preference */
  theme: 'dark' | 'light' | 'system';
}

export interface SettingsStoreActions {
  setSettings(settings: AppSettings): void;
  setDaemonHealthy(healthy: boolean): void;
  setTheme(theme: SettingsStoreState['theme']): void;
}
