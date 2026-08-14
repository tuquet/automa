declare class WorkflowWorker {
    id: string;
    engine: WorkflowEngine;
    settings: any;
    blocksDetail: any;
    loopEls: any[];
    loopList: Record<string, any>;
    repeatedTasks: Record<string, any>;
    preloadScripts: any[];
    breakpointState: any;
    windowId: string | null;
    currentBlock: any;
    childWorkflowId: string | null;
    debugAttached: boolean;
    activeTab: {
        url: string;
        frameId: number;
        frames: any;
        groupId: any;
        id: number;
    };
    frameSelector: string;
    constructor(id: string, engine: WorkflowEngine, options?: any);
    init({ blockId, execParam, state }: any): void;
    addDataToColumn(key: any, value: any): void;
    setVariable(name: string, value: any): Promise<void>;
    getBlockConnections(blockId: string, outputIndex?: number | string): any[] | null;
    executeNextBlocks(connections: any[], prevBlockData: any, nextBlockBreakpointCount?: number | null): void;
    resume(nextBlock: any): void;
    executeBlock(block: any, execParam?: any, isRetry?: boolean): Promise<void>;
    reset(): void;
    _sendMessageToTab(payload: any, options?: any, runBeforeLoad?: boolean, retryCount?: number): Promise<any>;
}

interface IBrowserAdapter {
    /**
     * Send a message to the specified tab.
     */
    sendMessageToTab(tabId: number, message: any): Promise<any>;
    /**
     * Represents the current active tab context (id, url, etc.).
     */
    activeTab: any;
    /**
     * Execute a script inside the tab.
     */
    executeScript(tabId: number, script: string, args?: any[]): Promise<any>;
    /**
     * Any other browser-specific API methods used by legacy blocks.
     */
    [key: string]: any;
}

interface WorkflowStateData {
    status?: 'running' | 'paused' | 'stopped' | 'success' | 'error';
    workflowId?: string;
    isDestroyed?: boolean;
    currentBlock?: any;
    [key: string]: any;
}
interface IEngineStateAdapter {
    saveState(id: string, state: WorkflowStateData): Promise<void>;
    getState(id: string): Promise<WorkflowStateData | null>;
    getAllStates(): Promise<Map<string, WorkflowStateData>>;
    deleteState(id: string): Promise<void>;
}

interface LogItem {
    id?: string;
    type: string;
    name: string;
    message?: string;
    description?: string;
    timestamp: number;
    [key: string]: any;
}
interface HistoryItem {
    id?: string;
    workflowId?: string;
    status: string;
    startedAt: number;
    endedAt?: number;
    [key: string]: any;
}
interface IEngineLoggerAdapter {
    addLog(logItem: LogItem): Promise<void>;
    addHistory(historyItem: HistoryItem): Promise<void>;
}

interface EngineContext {
    variables: Record<string, any>;
    globalData: string;
    loopCounters: Record<string, number>;
    isPopup: boolean;
}
interface WorkflowEngineConfig {
    browserAdapter: IBrowserAdapter;
    stateAdapter: IEngineStateAdapter;
    loggerAdapter: IEngineLoggerAdapter;
    workflowData: any;
    options?: any;
    blocksHandler: Record<string, Function>;
    isPopup?: boolean;
    isTestingMode?: boolean;
    parentWorkflow?: any;
}

declare class WorkflowEngine {
    id: string;
    config: WorkflowEngineConfig;
    workflow: any;
    isPopup: boolean;
    isTestingMode: boolean;
    parentWorkflow: any;
    saveLog: boolean;
    options: any;
    workerId: number;
    workers: Map<string, WorkflowWorker>;
    restartWorkersCount: Record<string, number>;
    packagesCache: any;
    extractedGroup: any;
    connectionsMap: any;
    waitConnections: any;
    isDestroyed: boolean;
    isUsingProxy: boolean;
    isInBreakpoint: boolean;
    triggerBlockId: string | null;
    blocks: Record<string, any>;
    history: any[];
    columnsId: Record<string, string>;
    historyCtxData: Record<string, any>;
    eventListeners: Record<string, Function[]>;
    preloadScripts: any[];
    columns: any;
    rowData: any;
    logsLimit: number;
    logHistoryId: number;
    refDataSnapshots: any;
    refDataSnapshotsKeys: any;
    referenceData: any;
    startedTimestamp: number;
    childWorkflowId: string | null;
    state: any;
    constructor(config: WorkflowEngineConfig);
    onDebugEvent: ({ tabId }: any, method: string, params: any) => void;
    onWorkflowStopped: (id: string) => void;
    onResumeExecution: ({ id, nextBlock }: any) => void;
    init(): Promise<void>;
    addRefDataSnapshot(key: string): void;
    addWorker(detail: any): void;
    addLogHistory(detail: any): void;
    stop(): Promise<void>;
    executeQueue(): Promise<void>;
    destroyWorker(workerId: string): Promise<void>;
    destroy(status: string, message?: string, blockDetail?: any): Promise<void>;
    updateState(data: any): Promise<void>;
    dispatchEvent(name: string, params: any): void;
    on(name: string, listener: Function): void;
}

declare class BackwardCompatibilityFacade {
    private worker;
    constructor(worker: WorkflowWorker);
    /**
     * Binds the legacy block handler to a proxy context.
     */
    bind(blockHandler: Function): any;
    private createContext;
}

export { BackwardCompatibilityFacade, type EngineContext, type HistoryItem, type IBrowserAdapter, type IEngineLoggerAdapter, type IEngineStateAdapter, type LogItem, type WorkflowEngineConfig, type WorkflowStateData };
