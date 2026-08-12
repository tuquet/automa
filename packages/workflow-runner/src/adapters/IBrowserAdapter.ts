export interface TabInfo {
  id: number;
  url?: string;
  frameId?: number;
  windowId?: number;
  [key: string]: any;
}

export interface TabMessagePayload {
  name: string;
  data?: Record<string, any>;
  [key: string]: any;
}

export interface TabMessageOptions {
  frameId?: number;
  tabId?: number;
  [key: string]: any;
}

export interface IBrowserAdapter {
  getActiveTab(): Promise<TabInfo | null>;
  sendMessageToTab(
    tabId: number,
    message: TabMessagePayload,
    options?: TabMessageOptions
  ): Promise<any>;
  createTab(options: { url: string; active?: boolean; [key: string]: any }): Promise<TabInfo>;
  updateTab(tabId: number, options: Record<string, any>): Promise<TabInfo>;
  removeTab(tabId: number): Promise<void>;
  injectContentScript?(tabId: number, frameId?: number): Promise<boolean>;
}

export interface AdapterConfig {
  browserAdapter: IBrowserAdapter;
  options?: {
    debugMode?: boolean;
    isPopup?: boolean;
    [key: string]: any;
  };
}
