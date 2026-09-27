import type { BaseBlockData } from './common.js';

export interface TriggerParameter {
  name: string;
  defaultValue?: unknown;
  description?: string;
  type?: 'string' | 'number' | 'boolean' | 'json';
  [key: string]: unknown;
}

export interface TriggerObserveElementOptions {
  subtree?: boolean;
  childList?: boolean;
  attributes?: boolean;
  attributeFilter?: string[];
  characterData?: boolean;
}

export interface TriggerObserveElement {
  selector?: string;
  baseSelector?: string;
  matchPattern?: string;
  targetOptions?: TriggerObserveElementOptions;
  baseElOptions?: TriggerObserveElementOptions;
}

export interface TriggerBlockData extends BaseBlockData {
  type?:
    | 'manual'
    | 'interval'
    | 'date'
    | 'context-menu'
    | 'specific-day'
    | 'element-receive-event'
    | 'on-url-change';
  interval?: number;
  delay?: number;
  date?: string;
  time?: string;
  url?: string;
  shortcut?: string;
  activeInInput?: boolean;
  isUrlRegex?: boolean;
  days?: number[];
  contextMenuName?: string;
  contextTypes?: string[];
  parameters?: TriggerParameter[];
  preferParamsInTab?: boolean;
  observeElement?: TriggerObserveElement;
}

export interface AiWorkflowBlockData extends BaseBlockData {
  flowUuid?: string;
  flowLabel?: string;
  inputs?: unknown[];
  outputs?: unknown[];
  assignVariable?: boolean;
  variableName?: string;
  saveData?: boolean;
  dataColumn?: string;
}

export interface ExecuteWorkflowBlockData extends BaseBlockData {
  executeId?: string;
  workflowId: string;
  globalData?: string;
  insertAllVars?: boolean;
  insertAllGlobalData?: boolean;
}

export interface DelayBlockData extends BaseBlockData {
  time: number;
}

export interface ExportDataBlockData extends BaseBlockData {
  name?: string;
  refKey?: string;
  type?: 'json' | 'csv' | 'plain-text';
  variableName?: string;
  csvDelimiter?: string;
  addBOMHeader?: boolean;
  onConflict?: 'uniquify' | 'overwrite' | 'prompt';
  dataToExport?: 'data-columns' | 'google-sheets' | 'table';
}

export interface WebhookHeader {
  name: string;
  value: string;
}

export interface WebhookBlockData extends BaseBlockData {
  url: string;
  body?: string;
  headers?: WebhookHeader[];
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD';
  timeout?: number;
  dataPath?: string;
  contentType?: 'json' | 'form-data' | 'raw';
  variableName?: string;
  assignVariable?: boolean;
  saveData?: boolean;
  dataColumn?: string;
  responseType?: 'json' | 'text' | 'blob';
}

export interface BlocksGroupBlockData extends BaseBlockData {
  name?: string;
  blocks?: string[];
}

export interface ClipboardBlockData extends BaseBlockData {
  type?: 'get' | 'set';
  assignVariable?: boolean;
  variableName?: string;
  saveData?: boolean;
  dataColumn?: string;
  dataToCopy?: string;
  copySelectedText?: boolean;
}

export interface WaitConnectionsBlockData extends BaseBlockData {
  timeout?: number;
  specificFlow?: boolean;
  flowBlockId?: string;
}

export interface NotificationBlockData extends BaseBlockData {
  message: string;
  title?: string;
  iconUrl?: string;
  imageUrl?: string;
}

export interface NoteBlockData extends BaseBlockData {
  note?: string;
  drawing?: boolean;
  width?: number;
  height?: number;
  color?: string;
  fontSize?: string;
}

export interface WorkflowStateBlockData extends BaseBlockData {
  type?: 'stop-current' | 'stop-all' | 'pause-current';
  exceptCurrent?: boolean;
  workflowsToStop?: string[];
  throwError?: boolean;
  errorMessage?: string;
}

export interface ParameterPromptBlockData extends BaseBlockData {
  timeout?: number;
  parameters?: TriggerParameter[];
}
