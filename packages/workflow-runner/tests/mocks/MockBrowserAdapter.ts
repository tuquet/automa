import {
  IBrowserAdapter,
  TabInfo,
  TabMessagePayload,
  TabMessageOptions,
} from '../../src/adapters/IBrowserAdapter.js';

export interface RecordedMessageCall {
  tabId: number;
  message: TabMessagePayload;
  options?: TabMessageOptions;
  timestamp: number;
}

export class MockBrowserAdapter implements IBrowserAdapter {
  public activeTab: TabInfo | null;
  public tabs: Map<number, TabInfo>;
  public recordedMessages: RecordedMessageCall[];
  public nextTabId: number;

  constructor(initialTab: Partial<TabInfo> = {}) {
    const defaultTab: TabInfo = {
      id: initialTab.id ?? 101,
      url: initialTab.url ?? 'https://example.com',
      frameId: initialTab.frameId ?? 0,
      windowId: initialTab.windowId ?? 1,
    };
    this.activeTab = defaultTab;
    this.tabs = new Map();
    this.tabs.set(defaultTab.id, defaultTab);
    this.recordedMessages = [];
    this.nextTabId = 200;
  }

  public async getActiveTab(): Promise<TabInfo | null> {
    return this.activeTab;
  }

  public async sendMessageToTab(
    tabId: number,
    message: TabMessagePayload,
    options?: TabMessageOptions
  ): Promise<any> {
    this.recordedMessages.push({
      tabId,
      message,
      options,
      timestamp: Date.now(),
    });

    if (message.label === 'loop-data' || message.name === 'loop-data') {
      return {
        elements: ['elem-1', 'elem-2', 'elem-3'],
        url: this.activeTab?.url || 'https://example.com',
        loopId: message.data?.loopId || 'loop-1',
      };
    }

    if (message.label === 'conditions' || message.name === 'conditions') {
      return { match: true };
    }

    return { status: 'success', tabId, receivedMessage: message };
  }

  public async createTab(options: { url: string; active?: boolean; [key: string]: any }): Promise<TabInfo> {
    const tabId = this.nextTabId++;
    const tab: TabInfo = {
      id: tabId,
      url: options.url,
      frameId: 0,
      windowId: this.activeTab?.windowId ?? 1,
    };
    this.tabs.set(tabId, tab);
    if (options.active !== false) {
      this.activeTab = tab;
    }
    return tab;
  }

  public async updateTab(tabId: number, options: Record<string, any>): Promise<TabInfo> {
    const tab = this.tabs.get(tabId) || { id: tabId, url: '' };
    Object.assign(tab, options);
    this.tabs.set(tabId, tab);
    if (this.activeTab && this.activeTab.id === tabId) {
      Object.assign(this.activeTab, options);
    }
    return tab;
  }

  public async removeTab(tabId: number): Promise<void> {
    this.tabs.delete(tabId);
    if (this.activeTab && this.activeTab.id === tabId) {
      const remaining = Array.from(this.tabs.values());
      this.activeTab = remaining.length > 0 ? remaining[0] : null;
    }
  }

  public async injectContentScript(tabId: number, frameId?: number): Promise<boolean> {
    return true;
  }
}
