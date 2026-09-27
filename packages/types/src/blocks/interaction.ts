import type { BaseBlockData } from './common.js';

export type SelectorType = 'cssSelector' | 'xpath';

export interface PreloadScriptItem {
  src: string;
  removeAfterExec?: boolean;
}

export interface EventClickBlockData extends BaseBlockData {
  findBy?: SelectorType;
  selector: string;
  waitForSelector?: boolean;
  waitSelectorTimeout?: number;
  markEl?: boolean;
  multiple?: boolean;
}

export interface GetTextBlockData extends BaseBlockData {
  findBy?: SelectorType;
  selector: string;
  waitForSelector?: boolean;
  waitSelectorTimeout?: number;
  markEl?: boolean;
  multiple?: boolean;
  regex?: string;
  prefixText?: string;
  suffixText?: string;
  regexExp?: unknown[];
  dataColumn?: string;
  saveData?: boolean;
  includeTags?: boolean;
  addExtraRow?: boolean;
  assignVariable?: boolean;
  useTextContent?: boolean;
  variableName?: string;
  extraRowValue?: string;
  extraRowDataColumn?: string;
}

export interface ElementScrollBlockData extends BaseBlockData {
  findBy?: SelectorType;
  selector?: string;
  waitForSelector?: boolean;
  waitSelectorTimeout?: number;
  markEl?: boolean;
  multiple?: boolean;
  scrollY?: number;
  scrollX?: number;
  incX?: boolean;
  incY?: boolean;
  smooth?: boolean;
  scrollIntoView?: boolean;
}

export interface LinkBlockData extends BaseBlockData {
  findBy?: SelectorType;
  selector: string;
  waitForSelector?: boolean;
  waitSelectorTimeout?: number;
  markEl?: boolean;
  disableMultiple?: boolean;
  openInNewTab?: boolean;
}

export interface AttributeValueBlockData extends BaseBlockData {
  findBy?: SelectorType;
  selector: string;
  waitForSelector?: boolean;
  waitSelectorTimeout?: number;
  markEl?: boolean;
  multiple?: boolean;
  attributeValue?: string;
  attributeName?: string;
  assignVariable?: boolean;
  variableName?: string;
  dataColumn?: string;
  saveData?: boolean;
  action?: 'get' | 'set' | 'remove';
  addExtraRow?: boolean;
  extraRowValue?: string;
  extraRowDataColumn?: string;
}

export interface FormsBlockData extends BaseBlockData {
  findBy?: SelectorType;
  selector: string;
  waitForSelector?: boolean;
  waitSelectorTimeout?: number;
  markEl?: boolean;
  multiple?: boolean;
  selected?: boolean;
  clearValue?: boolean;
  getValue?: boolean;
  saveData?: boolean;
  dataColumn?: string;
  selectOptionBy?: 'value' | 'text' | 'index';
  optionPosition?: string;
  assignVariable?: boolean;
  variableName?: string;
  type?: 'text-field' | 'select' | 'checkbox' | 'radio';
  value?: string;
  delay?: number;
  events?: string[];
}

export interface JavascriptCodeBlockData extends BaseBlockData {
  code: string;
  timeout?: number;
  context?: 'website' | 'webpage' | 'background';
  preloadScripts?: PreloadScriptItem[];
  everyNewTab?: boolean;
  runBeforeLoad?: boolean;
}

export interface TriggerEventBlockData extends BaseBlockData {
  findBy?: SelectorType;
  selector: string;
  waitForSelector?: boolean;
  waitSelectorTimeout?: number;
  markEl?: boolean;
  multiple?: boolean;
  eventName?: string;
  eventType?: string;
  eventParams?: {
    bubbles?: boolean;
    cancelable?: boolean;
    clientX?: number;
    clientY?: number;
    [key: string]: unknown;
  };
}

export interface SwitchToBlockData extends BaseBlockData {
  findBy?: SelectorType;
  selector?: string;
  windowType?: 'main-window' | 'iframe';
}

export interface UploadFileBlockData extends BaseBlockData {
  findBy?: SelectorType;
  selector: string;
  waitForSelector?: boolean;
  waitSelectorTimeout?: number;
  filePaths: string[];
}

export interface HoverElementBlockData extends BaseBlockData {
  findBy?: SelectorType;
  selector: string;
  waitForSelector?: boolean;
  waitSelectorTimeout?: number;
  markEl?: boolean;
  multiple?: boolean;
}

export interface SaveAssetsBlockData extends BaseBlockData {
  findBy?: SelectorType;
  selector?: string;
  waitForSelector?: boolean;
  waitSelectorTimeout?: number;
  markEl?: boolean;
  multiple?: boolean;
  type?: 'element' | 'url';
  url?: string;
  filename?: string;
  saveDownloadIds?: boolean;
  onConflict?: 'uniquify' | 'overwrite' | 'prompt';
  dataColumn?: string;
  saveData?: boolean;
  assignVariable?: boolean;
  variableName?: string;
  saveToGDrive?: boolean;
}

export interface PressKeyBlockData extends BaseBlockData {
  keys?: string;
  selector?: string;
  pressTime?: string | number;
  keysToPress?: string;
  action?: 'press-key' | 'key-down' | 'key-up';
}

export interface CreateElementBlockData extends BaseBlockData {
  javascript?: string;
  html?: string;
  css?: string;
  preloadScripts?: PreloadScriptItem[];
  findBy?: SelectorType;
  insertAt?: 'after' | 'before' | 'append' | 'prepend';
  runBeforeLoad?: boolean;
  waitForSelector?: boolean;
  waitSelectorTimeout?: number;
  selector?: string;
}
