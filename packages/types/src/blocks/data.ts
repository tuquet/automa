import type { BaseBlockData } from './common.js';

export interface InsertDataItem {
  name: string;
  value: unknown;
  type?: string;
  [key: string]: unknown;
}

export interface InsertDataBlockData extends BaseBlockData {
  dataList?: InsertDataItem[];
}

export interface DeleteDataItem {
  name: string;
  type?: 'table' | 'variable' | string;
}

export interface DeleteDataBlockData extends BaseBlockData {
  deleteList?: DeleteDataItem[];
}

export interface LogDataBlockData extends BaseBlockData {
  workflowId?: string;
  dataColumn?: string;
  saveData?: boolean;
  assignVariable?: boolean;
  variableName?: string;
}

export interface SliceVariableBlockData extends BaseBlockData {
  variableName: string;
  startIndex?: number;
  endIndex?: number;
  startIdxEnabled?: boolean;
  endIdxEnabled?: boolean;
}

export interface IncreaseVariableBlockData extends BaseBlockData {
  variableName: string;
  increaseBy?: number;
}

export interface RegexVariableBlockData extends BaseBlockData {
  expression: string;
  method?: 'match' | 'replace' | 'test';
  replaceVal?: string;
  flag?: string[];
}

export interface DataMappingBlockData extends BaseBlockData {
  dataSource?: 'table' | 'variable';
  sources?: unknown[];
  varSourceName?: string;
  dataColumn?: string;
  saveData?: boolean;
  assignVariable?: boolean;
  variableName?: string;
}

export interface SortDataBlockData extends BaseBlockData {
  sortByProperty?: boolean;
  itemProperties?: string[];
  dataSource?: 'table' | 'variable';
  varSourceName?: string;
  dataColumn?: string;
  saveData?: boolean;
  assignVariable?: boolean;
  variableName?: string;
}
