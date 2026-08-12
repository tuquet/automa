import { IBrowserAdapter, AdapterConfig, TabInfo } from '../adapters/IBrowserAdapter.js';
import { TableColumn, ReferenceData } from '../types/index.js';
import objectPath from 'object-path';

export interface ExecutionContextOptions {
  adapterConfig?: AdapterConfig;
  browserAdapter?: IBrowserAdapter;
  activeTab?: TabInfo | null;
  windowId?: number | null;
  settings?: Record<string, any>;
  referenceData?: Partial<ReferenceData>;
  columns?: Record<string, any>;
  columnsId?: Record<string, string>;
  connectionsMap?: Record<string, any>;
  blocks?: Record<string, any>;
  isPopup?: boolean;
  isMV2?: boolean;
  engineId?: string;
  workflow?: Record<string, any>;
  [key: string]: any;
}

export class ExecutionContextFacade {
  public browserAdapter: IBrowserAdapter;
  public activeTab: TabInfo | null;
  public windowId: number | null;
  public loopList: Record<string, any>;
  public loopEls: any[];
  public settings: Record<string, any>;
  public frameSelector: string | null;
  public preloadScripts: any[];
  public repeatedTasks: Record<string, any>;
  public debugAttached: boolean;
  public dialogParams: Record<string, any>;
  public childWorkflowId: string | null;
  public currentBlock: any;

  public engine: {
    id: string;
    isPopup: boolean;
    isMV2: boolean;
    isDestroyed: boolean;
    isInBreakpoint: boolean;
    workflow: Record<string, any>;
    referenceData: ReferenceData;
    columns: Record<string, any>;
    columnsId: Record<string, string>;
    connectionsMap: Record<string, any>;
    blocks: Record<string, any>;
    waitConnections: Record<string, any>;
    packagesCache: Record<string, any>;
    addRefDataSnapshot: (key: string) => void;
    destroy: (status: string, message?: string, blockDetail?: any) => Promise<void>;
    updateState: (data: any) => Promise<void>;
    [key: string]: any;
  };

  private snapshots: Record<string, any[]>;

  constructor(param: AdapterConfig | IBrowserAdapter | ExecutionContextOptions) {
    let adapter: IBrowserAdapter;
    let opts: ExecutionContextOptions = {};

    if (param && typeof (param as any).sendMessageToTab === 'function') {
      adapter = param as IBrowserAdapter;
    } else if (param && 'browserAdapter' in param) {
      adapter = (param as any).browserAdapter;
      const subOpts = (param as any).options || {};
      opts = { ...subOpts, ...(param as any) };
    } else if (param && (param as ExecutionContextOptions).adapterConfig) {
      adapter = (param as ExecutionContextOptions).adapterConfig!.browserAdapter;
      const subOpts = (param as ExecutionContextOptions).adapterConfig!.options || {};
      opts = { ...subOpts, ...(param as ExecutionContextOptions) };
    } else {
      throw new Error('ExecutionContextFacade initialization failed: IBrowserAdapter or AdapterConfig is required');
    }

    this.browserAdapter = adapter;
    this.activeTab = opts.activeTab ?? { id: 1, url: '', frameId: 0 };
    this.windowId = opts.windowId ?? null;
    this.loopList = {};
    this.loopEls = [];
    this.settings = opts.settings ?? { debugMode: false, tabLoadTimeout: 30000, blockDelay: 0 };
    this.frameSelector = null;
    this.preloadScripts = [];
    this.repeatedTasks = {};
    this.debugAttached = false;
    this.dialogParams = {};
    this.childWorkflowId = null;
    this.currentBlock = null;

    this.snapshots = {};

    const defaultRefData: ReferenceData = {
      variables: opts.referenceData?.variables ?? {},
      table: opts.referenceData?.table ?? [],
      secrets: opts.referenceData?.secrets ?? {},
      loopData: opts.referenceData?.loopData ?? {},
      workflow: opts.referenceData?.workflow ?? {},
      globalData: opts.referenceData?.globalData ?? {},
      googleSheets: opts.referenceData?.googleSheets ?? {},
    };

    const defaultColumns: Record<string, any> = opts.columns ?? {
      column: {
        index: 0,
        type: 'any',
        name: 'column',
      },
    };

    const defaultColumnsId: Record<string, string> = opts.columnsId ?? {
      column: 'column',
    };

    this.engine = {
      id: opts.engineId ?? 'engine-1',
      isPopup: opts.isPopup ?? false,
      isMV2: opts.isMV2 ?? false,
      isDestroyed: false,
      isInBreakpoint: false,
      workflow: opts.workflow ?? { settings: this.settings },
      referenceData: defaultRefData,
      columns: defaultColumns,
      columnsId: defaultColumnsId,
      connectionsMap: opts.connectionsMap ?? {},
      blocks: opts.blocks ?? {},
      waitConnections: {},
      packagesCache: {},
      addRefDataSnapshot: (key: string) => {
        if (!this.snapshots[key]) {
          this.snapshots[key] = [];
        }
        const data = this.engine.referenceData[key];
        this.snapshots[key].push(JSON.parse(JSON.stringify(data ?? null)));
      },
      destroy: async (status: string, message?: string, blockDetail?: any) => {
        this.engine.isDestroyed = true;
      },
      updateState: async (data: any) => {
        // state update hook
      },
    };
  }

  public getBlockConnections(id: string, outputIndex: number | string = 1): any[] | null {
    if (this.engine.isDestroyed) return null;

    let outputId = `${id}-output-${outputIndex}`;
    let connections = this.engine.connectionsMap[outputId];

    if (!connections && typeof outputIndex === 'string') {
      outputId = `${id}-${outputIndex}`;
      connections = this.engine.connectionsMap[outputId];
    }

    if (!connections) {
      connections = this.engine.connectionsMap[id];
    }

    if (!connections) return null;

    if (Array.isArray(connections)) {
      return [...connections];
    }
    if (connections instanceof Map) {
      return [...connections.values()];
    }
    if (typeof connections === 'object') {
      return Object.values(connections);
    }

    return null;
  }

  public addDataToColumn(key: string | any[], value?: any): void {
    if (Array.isArray(key)) {
      key.forEach((item) => {
        if (item && typeof item === 'object') {
          Object.entries(item).forEach(([itemKey, itemValue]) => {
            this.addDataToColumn(itemKey, itemValue);
          });
        }
      });
      return;
    }

    const insertDefault = this.settings.insertDefaultColumn ?? true;
    const columnId =
      (this.engine.columns[key] ? key : this.engine.columnsId[key]) || key || 'column';

    if (columnId === 'column' && !insertDefault) return;

    if (!this.engine.columns[columnId]) {
      this.engine.columns[columnId] = {
        index: 0,
        type: 'any',
        name: key || 'column',
      };
      this.engine.columnsId[key] = columnId;
    }

    const currentColumn = this.engine.columns[columnId];
    const columnName = currentColumn.name || 'column';
    const convertedValue = value;

    if (this.engine.referenceData.table[currentColumn.index] !== undefined) {
      this.engine.referenceData.table[currentColumn.index][columnName] = convertedValue;
    } else {
      this.engine.referenceData.table.push({
        [columnName]: convertedValue,
      });
    }

    currentColumn.index += 1;
  }

  public async setVariable(name: string, value: any): Promise<void> {
    let variableName = name;
    const vars = this.engine.referenceData.variables;

    if (name.startsWith('$push:')) {
      const varName = name.slice(6);
      if (!(varName in vars) || vars[varName] === undefined) {
        vars[varName] = [];
      } else if (!Array.isArray(vars[varName])) {
        vars[varName] = [vars[varName]];
      }
      vars[varName].push(value);
      variableName = varName;
    } else {
      vars[name] = value;
    }

    if (variableName.startsWith('$$')) {
      // persistent variable handling if configured
    }

    this.engine.addRefDataSnapshot('variables');
  }

  public async _sendMessageToTab(payload: any, options: any = {}, runBeforeLoad: boolean = false): Promise<any> {
    if (!this.activeTab || !this.activeTab.id) {
      const error: any = new Error('no-tab');
      error.workflowId = this.engine.id;
      throw error;
    }

    const messagePayload = {
      isBlock: true,
      debugMode: this.settings?.debugMode,
      executedBlockOnWeb: this.settings?.executedBlockOnWeb,
      loopEls: this.loopEls,
      activeTabId: this.activeTab.id,
      frameSelector: this.frameSelector,
      ...payload,
    };

    try {
      const result = await this.browserAdapter.sendMessageToTab(
        this.activeTab.id,
        messagePayload,
        { frameId: this.activeTab.frameId || 0, ...options }
      );
      return result;
    } catch (error: any) {
      if (
        this.browserAdapter.injectContentScript &&
        (error.message?.includes('connection') ||
          error.message?.includes('closed') ||
          error.message?.includes('Could not establish'))
      ) {
        const injected = await this.browserAdapter.injectContentScript(
          this.activeTab.id,
          this.activeTab.frameId || 0
        );
        if (injected) {
          return await this.browserAdapter.sendMessageToTab(
            this.activeTab.id,
            messagePayload,
            { frameId: this.activeTab.frameId || 0, ...options }
          );
        }
      }
      throw error;
    }
  }
}
