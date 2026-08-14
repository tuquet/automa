export interface LogItem {
    id?: string;
    type: string;
    name: string;
    message?: string;
    description?: string;
    timestamp: number;
    [key: string]: any;
}

export interface HistoryItem {
    id?: string;
    workflowId?: string;
    status: string;
    startedAt: number;
    endedAt?: number;
    [key: string]: any;
}

export interface IEngineLoggerAdapter {
    addLog(logItem: LogItem): Promise<void>;
    addHistory(historyItem: HistoryItem): Promise<void>;
}
