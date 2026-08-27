/**
 * Canonical Select & Dropdown Business Logic Prototype Schema & Event-Driven Contracts
 * Defines strict state machine, remote data-fetching, virtualization, fuzzy searching,
 * and real-time SSE/WebSocket cache invalidation rules for all dropdown components.
 */

import type { ApiErrorResponse } from './api/types.gen.js';

/**
 * Context scopes where select components can be mounted across the ecosystem
 */
export type SelectContextScope =
  | 'WorkflowCanvas'
  | 'CampaignMatrix'
  | 'BrowserManager'
  | 'StorageExplorer'
  | 'HistoryLogs'
  | 'SystemTitlebar'
  | 'SettingsPanel'
  | 'StudioHeader'
  | 'ModalDialog';

/**
 * Finite State Machine (FSM) execution states for a select component
 */
export type SelectFsmState =
  | 'IDLE'
  | 'LOADING'
  | 'READY'
  | 'SEARCHING'
  | 'EMPTY'
  | 'ERROR'
  | 'MUTATING';

/**
 * Canonical option item rendered inside a virtualized dropdown
 */
export interface SelectOption<T = unknown> {
  /** Unique value primitive */
  value: string | number;

  /** Human-readable display label */
  label: string;

  /** Optional secondary subtitle or description */
  description?: string;

  /** Icon name identifier (Lucide / Codicon) */
  icon?: string;

  /** Visual status or category badge */
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'outline';
  };

  /** Whether the item is disabled from selection */
  disabled?: boolean;

  /** Custom contextual metadata */
  data?: T;
}

/**
 * Virtualization performance configuration
 */
export interface VirtualizationConfig {
  /** Enable virtual scrolling engine for large datasets (100+ items) */
  enabled: boolean;

  /** Exact row height in pixels for virtual slice calculations */
  itemHeightPx: number;

  /** Number of items to render outside the visible viewport */
  overscanCount: number;

  /** Maximum visible items shown before scrolling activates */
  maxVisibleItems: number;
}

/**
 * Search & filtering capabilities configuration
 */
export interface SearchFilterConfig {
  /** Whether the select provides an inline search input */
  searchable: boolean;

  /** Filtering execution strategy: client-side fuzzy, remote API debounce query, or hybrid */
  searchMode: 'client' | 'remote' | 'hybrid';

  /** Debounce delay in milliseconds before dispatching remote search */
  debounceMs: number;

  /** Input placeholder text */
  placeholder: string;

  /** Enable fuzzy substring and typographical error matching */
  fuzzy: boolean;

  /** Minimum characters typed before triggering remote search */
  minSearchLength?: number;
}

/**
 * Remote Data Fetching Dispatch Contract mapped to generated SDK
 */
export interface RemoteDataSourceContract<TItem = unknown> {
  /** Unique OpenAPI SDK operation identifier */
  operationId: string;

  /** HTTP method */
  method: 'GET' | 'POST';

  /** REST endpoint path template */
  endpoint: string;

  /** Query parameter name for search filter string (e.g. "q", "search", "name") */
  searchQueryParamKey?: string;

  /** Query parameter name for pagination limit */
  limitParamKey?: string;

  /** Transformation function converting raw API response into canonical SelectOption array */
  mapResponseToOptions: (data: unknown) => SelectOption<TItem>[];

  /** Cache Time-To-Live in milliseconds before stale revalidation */
  cacheTtlMs: number;
}

/**
 * Real-time event invalidation trigger
 */
export interface SelectInvalidationTrigger {
  /** Real-time streaming source */
  source: 'SSE' | 'WEBSOCKET' | 'IPC';

  /** Event topic / type name (e.g. "browser_created", "workflow_saved") */
  eventType: string;

  /** Invalidation mode: full reload, partial patch, or clear cache */
  action: 'REFRESH' | 'PATCH' | 'INVALIDATE';
}

/**
 * Complete Select Business Logic Schema Definition
 */
export interface SelectBusinessLogicSchema<TValue = string, TItem = unknown> {
  /** Unique dot-delimited identifier: select.domain.subdomain.target */
  id: string;

  /** Functional context scope */
  context: SelectContextScope;

  /** Presentation and accessibility metadata */
  presentation: {
    label: string;
    placeholder: string;
    dataTestId: string;
    allowClear?: boolean;
    multiple?: boolean;
    width?: string | number;
    icon?: string;
  };

  /** Virtualization engine specifications */
  virtualization: VirtualizationConfig;

  /** Search & debounce specifications */
  search: SearchFilterConfig;

  /** Remote data-source binding */
  remote: RemoteDataSourceContract<TItem>;

  /** Real-time SSE / WS invalidation rules */
  invalidationTriggers?: SelectInvalidationTrigger[];

  /** Cross-Component Reactive Reflections triggered when value selection mutates */
  reactiveReflections?: Array<{
    targetId: string;
    reflectionType: 'INVALIDATE_CACHE' | 'MUTATE_STATE' | 'ENABLE_DISABLE' | 'FOCUS_VIEW' | 'UPDATE_BADGE';
    description: string;
  }>;

  /** Fallback static options when offline or daemon disconnected */
  fallbackOptions?: SelectOption<TItem>[];

  /** Hooks for selection state changes */
  lifecycle: {
    onSelect?: (option: SelectOption<TItem>, selectedValue: TValue) => void;
    onClear?: () => void;
    onError?: (error: ApiErrorResponse | Error) => void;
  };
}

/**
 * Canonical Catalog of Standard UI Select & Dropdown Components
 */
export const SELECT_CATALOG: readonly SelectBusinessLogicSchema[] = [
  // 1. Target Browser Profile Selector (Anti-detect fleet)
  {
    id: 'select.browser.profile',
    context: 'WorkflowCanvas',
    presentation: {
      label: 'Target Browser Profile',
      placeholder: 'Select anti-detect browser...',
      dataTestId: 'select-browser-profile',
      allowClear: true,
      icon: 'Globe',
    },
    virtualization: {
      enabled: true,
      itemHeightPx: 40,
      overscanCount: 5,
      maxVisibleItems: 8,
    },
    search: {
      searchable: true,
      searchMode: 'hybrid',
      debounceMs: 200,
      placeholder: 'Search browser profiles by name or ID...',
      fuzzy: true,
    },
    remote: {
      operationId: 'get_browsers',
      method: 'GET',
      endpoint: '/api/v1/browsers',
      searchQueryParamKey: 'search',
      cacheTtlMs: 30000,
      mapResponseToOptions: (data: unknown) => {
        if (!Array.isArray(data)) return [];
        return data.map((b: { id: string; name: string; timezone?: string }) => ({
          value: b.id,
          label: b.name || b.id,
          description: b.timezone ? `Timezone: ${b.timezone}` : undefined,
          icon: 'Chrome',
          badge: { text: b.id.slice(0, 8), variant: 'secondary' },
        }));
      },
    },
    invalidationTriggers: [
      { source: 'SSE', eventType: 'browser_created', action: 'REFRESH' },
      { source: 'SSE', eventType: 'browser_deleted', action: 'REFRESH' },
      { source: 'SSE', eventType: 'browser_updated', action: 'REFRESH' },
    ],
    lifecycle: {},
  },

  // 2. Storage Workflow Selector (SQLite DB Database-First)
  {
    id: 'select.storage.workflow',
    context: 'StudioHeader',
    presentation: {
      label: 'Select Workflow',
      placeholder: 'Search workflows in storage...',
      dataTestId: 'select-storage-workflow',
      allowClear: false,
      icon: 'Workflow',
    },
    virtualization: {
      enabled: true,
      itemHeightPx: 44,
      overscanCount: 6,
      maxVisibleItems: 8,
    },
    search: {
      searchable: true,
      searchMode: 'hybrid',
      debounceMs: 250,
      placeholder: 'Type workflow name...',
      fuzzy: true,
    },
    remote: {
      operationId: 'list_workflows',
      method: 'GET',
      endpoint: '/api/v1/storage/workflows',
      searchQueryParamKey: 'name',
      cacheTtlMs: 15000,
      mapResponseToOptions: (data: unknown) => {
        if (!Array.isArray(data)) return [];
        return data.map((w: { id: string; name: string; version?: string; tags?: string[] }) => ({
          value: w.id,
          label: w.name || w.id,
          description: w.version ? `v${w.version}` : undefined,
          icon: 'FileCode',
          badge: w.tags?.[0] ? { text: w.tags[0], variant: 'outline' } : undefined,
        }));
      },
    },
    invalidationTriggers: [
      { source: 'SSE', eventType: 'workflow_created', action: 'REFRESH' },
      { source: 'SSE', eventType: 'workflow_updated', action: 'REFRESH' },
      { source: 'SSE', eventType: 'workflow_deleted', action: 'REFRESH' },
    ],
    lifecycle: {},
  },

  // 3. Storage Campaign Matrix Suite Selector
  {
    id: 'select.campaign.suite',
    context: 'CampaignMatrix',
    presentation: {
      label: 'Campaign Suite',
      placeholder: 'Select campaign scenario...',
      dataTestId: 'select-campaign-suite',
      allowClear: true,
      icon: 'Layers',
    },
    virtualization: {
      enabled: true,
      itemHeightPx: 40,
      overscanCount: 5,
      maxVisibleItems: 8,
    },
    search: {
      searchable: true,
      searchMode: 'hybrid',
      debounceMs: 200,
      placeholder: 'Search campaigns...',
      fuzzy: true,
    },
    remote: {
      operationId: 'list_campaigns',
      method: 'GET',
      endpoint: '/api/v1/storage/campaigns',
      searchQueryParamKey: 'search',
      cacheTtlMs: 20000,
      mapResponseToOptions: (data: unknown) => {
        if (!Array.isArray(data)) return [];
        return data.map((c: { id: string; name: string; browsers_count?: number }) => ({
          value: c.id,
          label: c.name || c.id,
          description: typeof c.browsers_count === 'number' ? `${c.browsers_count} browsers` : undefined,
          icon: 'Folder',
        }));
      },
    },
    invalidationTriggers: [
      { source: 'SSE', eventType: 'campaign_created', action: 'REFRESH' },
      { source: 'SSE', eventType: 'campaign_deleted', action: 'REFRESH' },
    ],
    lifecycle: {},
  },

  // 4. Global Storage Table Selector
  {
    id: 'select.storage.table',
    context: 'StorageExplorer',
    presentation: {
      label: 'Storage Table',
      placeholder: 'Select database table...',
      dataTestId: 'select-storage-table',
      allowClear: false,
      icon: 'Table',
    },
    virtualization: {
      enabled: true,
      itemHeightPx: 38,
      overscanCount: 5,
      maxVisibleItems: 8,
    },
    search: {
      searchable: true,
      searchMode: 'client',
      debounceMs: 150,
      placeholder: 'Filter tables...',
      fuzzy: true,
    },
    remote: {
      operationId: 'get_storage_tables',
      method: 'GET',
      endpoint: '/api/v1/storage/tables',
      cacheTtlMs: 30000,
      mapResponseToOptions: (data: unknown) => {
        if (!Array.isArray(data)) return [];
        return data.map((t: { id: string; name: string; rowCount?: number }) => ({
          value: t.id,
          label: t.name || t.id,
          description: typeof t.rowCount === 'number' ? `${t.rowCount} rows` : undefined,
          icon: 'Database',
        }));
      },
    },
    invalidationTriggers: [
      { source: 'SSE', eventType: 'storage_table_changed', action: 'REFRESH' },
    ],
    lifecycle: {},
  },

  // 5. Global Storage Variable Selector
  {
    id: 'select.storage.variable',
    context: 'StorageExplorer',
    presentation: {
      label: 'Global Variable',
      placeholder: 'Select variable key...',
      dataTestId: 'select-storage-variable',
      allowClear: true,
      icon: 'Variable',
    },
    virtualization: {
      enabled: true,
      itemHeightPx: 38,
      overscanCount: 5,
      maxVisibleItems: 8,
    },
    search: {
      searchable: true,
      searchMode: 'client',
      debounceMs: 150,
      placeholder: 'Search variable key...',
      fuzzy: true,
    },
    remote: {
      operationId: 'get_storage_variables',
      method: 'GET',
      endpoint: '/api/v1/storage/variables',
      cacheTtlMs: 30000,
      mapResponseToOptions: (data: unknown) => {
        if (!Array.isArray(data)) return [];
        return data.map((v: { id: string; name: string; key: string }) => ({
          value: v.key || v.id,
          label: v.name || v.key,
          description: `Key: {{variables.${v.key}}}`,
          icon: 'Key',
        }));
      },
    },
    invalidationTriggers: [
      { source: 'SSE', eventType: 'storage_variable_changed', action: 'REFRESH' },
    ],
    lifecycle: {},
  },

  // 6. Global Storage Credential Secret Selector
  {
    id: 'select.storage.credential',
    context: 'StorageExplorer',
    presentation: {
      label: 'Encrypted Credential',
      placeholder: 'Select secret key...',
      dataTestId: 'select-storage-credential',
      allowClear: true,
      icon: 'ShieldLock',
    },
    virtualization: {
      enabled: true,
      itemHeightPx: 38,
      overscanCount: 5,
      maxVisibleItems: 8,
    },
    search: {
      searchable: true,
      searchMode: 'client',
      debounceMs: 150,
      placeholder: 'Search credentials...',
      fuzzy: true,
    },
    remote: {
      operationId: 'get_storage_credentials',
      method: 'GET',
      endpoint: '/api/v1/storage/credentials',
      cacheTtlMs: 30000,
      mapResponseToOptions: (data: unknown) => {
        if (!Array.isArray(data)) return [];
        return data.map((c: { id: string; name: string; key: string }) => ({
          value: c.key || c.id,
          label: c.name || c.key,
          description: `Secret: {{secrets.${c.key}}}`,
          icon: 'Lock',
          badge: { text: 'Encrypted', variant: 'warning' },
        }));
      },
    },
    invalidationTriggers: [
      { source: 'SSE', eventType: 'storage_credential_changed', action: 'REFRESH' },
    ],
    lifecycle: {},
  },

  // 7. Browser Executable Type Selector
  {
    id: 'select.browser.type',
    context: 'SettingsPanel',
    presentation: {
      label: 'Default Browser Executable',
      placeholder: 'Choose browser engine...',
      dataTestId: 'select-browser-type',
      allowClear: false,
      icon: 'Compass',
    },
    virtualization: {
      enabled: false,
      itemHeightPx: 36,
      overscanCount: 2,
      maxVisibleItems: 4,
    },
    search: {
      searchable: false,
      searchMode: 'client',
      debounceMs: 0,
      placeholder: '',
      fuzzy: false,
    },
    remote: {
      operationId: 'get_app_settings',
      method: 'GET',
      endpoint: '/api/v1/system/settings',
      cacheTtlMs: 60000,
      mapResponseToOptions: () => [
        { value: 'chromium', label: 'Chromium (Bundled Headless)', description: 'Fast lightweight automation engine', icon: 'Cpu' },
        { value: 'chrome', label: 'Google Chrome (Local System)', description: 'Auto-detected installed Google Chrome', icon: 'Chrome' },
        { value: 'edge', label: 'Microsoft Edge (Local System)', description: 'Auto-detected Microsoft Edge executable', icon: 'Compass' },
        { value: 'firefox', label: 'Mozilla Firefox (Gecko)', description: 'Gecko webdriver instance', icon: 'Flame' },
      ],
    },
    fallbackOptions: [
      { value: 'chromium', label: 'Chromium (Bundled Headless)', icon: 'Cpu' },
      { value: 'chrome', label: 'Google Chrome (Local System)', icon: 'Chrome' },
      { value: 'edge', label: 'Microsoft Edge (Local System)', icon: 'Compass' },
      { value: 'firefox', label: 'Mozilla Firefox (Gecko)', icon: 'Flame' },
    ],
    lifecycle: {},
  },

  // 8. Grid Matrix Columns Selector
  {
    id: 'select.grid.matrix.columns',
    context: 'SettingsPanel',
    presentation: {
      label: 'Matrix Grid Columns',
      placeholder: 'Columns count...',
      dataTestId: 'select-grid-matrix-columns',
      allowClear: false,
    },
    virtualization: {
      enabled: false,
      itemHeightPx: 32,
      overscanCount: 2,
      maxVisibleItems: 6,
    },
    search: {
      searchable: false,
      searchMode: 'client',
      debounceMs: 0,
      placeholder: '',
      fuzzy: false,
    },
    remote: {
      operationId: 'get_app_settings',
      method: 'GET',
      endpoint: '/api/v1/system/settings',
      cacheTtlMs: 60000,
      mapResponseToOptions: () =>
        [1, 2, 3, 4, 5, 6, 8, 10, 12].map((n) => ({
          value: n,
          label: `${n} Columns`,
        })),
    },
    fallbackOptions: [1, 2, 3, 4, 5, 6, 8, 10, 12].map((n) => ({ value: n, label: `${n} Columns` })),
    lifecycle: {},
  },

  // 9. Grid Matrix Rows Selector
  {
    id: 'select.grid.matrix.rows',
    context: 'SettingsPanel',
    presentation: {
      label: 'Matrix Grid Rows',
      placeholder: 'Rows count...',
      dataTestId: 'select-grid-matrix-rows',
      allowClear: false,
    },
    virtualization: {
      enabled: false,
      itemHeightPx: 32,
      overscanCount: 2,
      maxVisibleItems: 6,
    },
    search: {
      searchable: false,
      searchMode: 'client',
      debounceMs: 0,
      placeholder: '',
      fuzzy: false,
    },
    remote: {
      operationId: 'get_app_settings',
      method: 'GET',
      endpoint: '/api/v1/system/settings',
      cacheTtlMs: 60000,
      mapResponseToOptions: () =>
        [1, 2, 3, 4, 6, 8].map((n) => ({
          value: n,
          label: `${n} Rows`,
        })),
    },
    fallbackOptions: [1, 2, 3, 4, 6, 8].map((n) => ({ value: n, label: `${n} Rows` })),
    lifecycle: {},
  },

  // 10. Job History Status Filter
  {
    id: 'select.history.job_filter',
    context: 'HistoryLogs',
    presentation: {
      label: 'Execution Status Filter',
      placeholder: 'Filter status...',
      dataTestId: 'select-history-status-filter',
      allowClear: false,
      icon: 'Filter',
    },
    virtualization: {
      enabled: false,
      itemHeightPx: 36,
      overscanCount: 2,
      maxVisibleItems: 5,
    },
    search: {
      searchable: false,
      searchMode: 'client',
      debounceMs: 0,
      placeholder: '',
      fuzzy: false,
    },
    remote: {
      operationId: 'get_job_history',
      method: 'GET',
      endpoint: '/api/v1/history',
      cacheTtlMs: 10000,
      mapResponseToOptions: () => [
        { value: 'all', label: 'All Jobs (Full History)', icon: 'List' },
        { value: 'running', label: 'Running / Active Jobs', icon: 'Play', badge: { text: 'Live', variant: 'success' } },
        { value: 'completed', label: 'Completed Jobs', icon: 'CheckCircle2', badge: { text: 'Done', variant: 'default' } },
        { value: 'failed', label: 'Failed / Terminated Jobs', icon: 'XCircle', badge: { text: 'Error', variant: 'destructive' } },
      ],
    },
    fallbackOptions: [
      { value: 'all', label: 'All Jobs (Full History)' },
      { value: 'running', label: 'Running / Active Jobs' },
      { value: 'completed', label: 'Completed Jobs' },
      { value: 'failed', label: 'Failed / Terminated Jobs' },
    ],
    lifecycle: {},
  },

  // 11. AST Linter Rule Category Filter
  {
    id: 'select.linter.rule_category',
    context: 'WorkflowCanvas',
    presentation: {
      label: 'Linter Rules Scope',
      placeholder: 'Select rule domain...',
      dataTestId: 'select-linter-rule-category',
      allowClear: false,
      icon: 'CheckSquare',
    },
    virtualization: {
      enabled: false,
      itemHeightPx: 36,
      overscanCount: 2,
      maxVisibleItems: 5,
    },
    search: {
      searchable: false,
      searchMode: 'client',
      debounceMs: 0,
      placeholder: '',
      fuzzy: false,
    },
    remote: {
      operationId: 'lint_workflow',
      method: 'POST',
      endpoint: '/api/v1/lint',
      cacheTtlMs: 60000,
      mapResponseToOptions: () => [
        { value: 'all', label: 'All Lint Rules (Workflow, Campaign, Browser)' },
        { value: 'workflow', label: 'Workflow AST & Graph Rules' },
        { value: 'campaign', label: 'Campaign Matrix Scheduling Rules' },
        { value: 'browser', label: 'Anti-detect Browser Configuration Rules' },
      ],
    },
    fallbackOptions: [
      { value: 'all', label: 'All Lint Rules' },
      { value: 'workflow', label: 'Workflow AST & Graph Rules' },
      { value: 'campaign', label: 'Campaign Matrix Scheduling Rules' },
      { value: 'browser', label: 'Anti-detect Browser Configuration Rules' },
    ],
    lifecycle: {},
  },
] as const;

/**
 * Union type of all 11 canonical Select IDs
 */
export type SelectId = (typeof SELECT_CATALOG)[number]['id'];

/**
 * Helper to lookup a Select schema by ID
 */
export function getSelectSchema(id: SelectId): SelectBusinessLogicSchema | undefined {
  return SELECT_CATALOG.find((s) => s.id === id);
}
