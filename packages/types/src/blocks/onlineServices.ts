import type { BaseBlockData } from './common.js';

export interface GoogleSheetsBlockData extends BaseBlockData {
  range?: string;
  refKey?: string;
  type?: 'get' | 'append' | 'update' | 'clear';
  customData?: string;
  spreadsheetId?: string;
  dataColumn?: string;
  saveData?: boolean;
  assignVariable?: boolean;
  variableName?: string;
  firstRowAsKey?: boolean;
  keysAsFirstRow?: boolean;
  valueInputOption?: 'RAW' | 'USER_ENTERED';
  InsertDataOption?: 'INSERT_ROWS' | 'OVERWRITE';
  dataFrom?: 'data-columns' | 'table' | 'variable';
}

export interface GoogleSheetsDriveBlockData extends BaseBlockData {
  range?: string;
  refKey?: string;
  type?: 'get' | 'append' | 'update' | 'clear';
  customData?: string;
  spreadsheetId?: string;
  dataColumn?: string;
  inputSpreadsheetId?: 'connected' | 'manual';
  saveData?: boolean;
  sheetName?: string;
  assignVariable?: boolean;
  variableName?: string;
  firstRowAsKey?: boolean;
  keysAsFirstRow?: boolean;
  valueInputOption?: 'RAW' | 'USER_ENTERED';
  InsertDataOption?: 'INSERT_ROWS' | 'OVERWRITE';
  dataFrom?: 'data-columns' | 'table' | 'variable';
}

export interface GoogleDriveBlockData extends BaseBlockData {
  action?: 'upload' | 'download';
  filePaths?: string[];
}

export interface PackageIO {
  id: string;
  name: string;
  blockId: string;
  handleId: string;
}

export interface PackageSettings {
  asBlock?: boolean;
  [key: string]: unknown;
}

export interface PackageParameter {
  id?: string;
  name: string;
  type?: string;
  defaultValue?: unknown;
  description?: string;
}

export interface BlockPackageBlockData extends BaseBlockData {
  id?: string;
  name?: string;
  icon?: string;
  description?: string;
  content?: string;
  author?: string;
  extVersion?: string;
  isExternal?: boolean;
  createdAt?: number;
  updatedAt?: number;
  inputs?: PackageIO[];
  outputs?: PackageIO[];
  parameters?: PackageParameter[];
  settings?: PackageSettings;
  data?: {
    nodes: unknown[];
    edges: unknown[];
  };
  packageId?: string;
  packageName?: string;
  [key: string]: unknown;
}

