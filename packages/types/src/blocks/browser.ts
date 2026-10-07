import type { BaseBlockData } from './common.js';

export interface ActiveTabBlockData extends BaseBlockData {}

export interface NewTabBlockData extends BaseBlockData {
  url: string;
  userAgent?: string;
  active?: boolean;
  tabZoom?: number;
  inGroup?: boolean;
  waitTabLoaded?: boolean;
  updatePrevTab?: boolean;
  customUserAgent?: boolean;
}

export interface SwitchTabBlockData extends BaseBlockData {
  url?: string;
  tabIndex?: number;
  tabTitle?: string;
  matchPattern?: string;
  activeTab?: boolean;
  createIfNoMatch?: boolean;
  findTabBy?: 'match-patterns' | 'tab-index' | 'tab-title' | 'tab-url';
}

export interface NewWindowBlockData extends BaseBlockData {
  top?: number;
  left?: number;
  width?: number;
  height?: number;
  url?: string;
  type?: 'normal' | 'popup';
  incognito?: boolean;
  windowState?: 'normal' | 'minimized' | 'maximized' | 'fullscreen';
}

export interface ProxyBlockData extends BaseBlockData {
  scheme?: 'http' | 'https' | 'socks4' | 'socks5';
  host: string;
  port: number;
  bypassList?: string;
  clearProxy?: boolean;
}

export interface GoBackBlockData extends BaseBlockData {}

export interface ForwardPageBlockData extends BaseBlockData {}

export interface CloseTabBlockData extends BaseBlockData {
  url?: string;
  activeTab?: boolean;
  closeType?: 'tab' | 'window';
  allWindows?: boolean;
}

export interface TakeScreenshotBlockData extends BaseBlockData {
  fileName?: string;
  ext?: 'png' | 'jpeg';
  quality?: number;
  dataColumn?: string;
  variableName?: string;
  selector?: string;
  fullPage?: boolean;
  saveToColumn?: boolean;
  saveToComputer?: boolean;
  assignVariable?: boolean;
  captureActiveTab?: boolean;
}

export interface BrowserEventBlockData extends BaseBlockData {
  timeout?: number;
  eventName?: 'tab:loaded' | 'tab:created' | 'download:completed' | string;
  setAsActiveTab?: boolean;
  activeTabLoaded?: boolean;
  tabLoadedUrl?: string;
  tabUrl?: string;
  fileQuery?: string;
}

export interface HandleDialogBlockData extends BaseBlockData {
  accept?: boolean;
  promptText?: string;
}

export interface HandleDownloadBlockData extends BaseBlockData {
  filename?: string;
  timeout?: number;
  onConflict?: 'uniquify' | 'overwrite' | 'prompt';
  waitForDownload?: boolean;
  dataColumn?: string;
  saveData?: boolean;
  assignVariable?: boolean;
  variableName?: string;
  downloadId?: string;
}

export interface ReloadTabBlockData extends BaseBlockData {}

export interface TabUrlBlockData extends BaseBlockData {
  type?: 'active-tab' | 'find-tab';
  dataColumn?: string;
  saveData?: boolean;
  assignVariable?: boolean;
  variableName?: string;
  qTitle?: string;
  qMatchPatterns?: string;
}

export interface CookieBlockData extends BaseBlockData {
  type?: 'get' | 'set' | 'delete';
  jsonCode?: string;
  useJson?: boolean;
  getAll?: boolean;
  domain?: string;
  expirationDate?: string | number;
  path?: string;
  sameSite?: 'no_restriction' | 'lax' | 'strict' | '';
  name?: string;
  url?: string;
  value?: string;
  httpOnly?: boolean;
  secure?: boolean;
  session?: boolean;
  assignVariable?: boolean;
  variableName?: string;
  saveData?: boolean;
  dataColumn?: string;
}
