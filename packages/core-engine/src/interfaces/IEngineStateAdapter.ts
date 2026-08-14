export interface WorkflowStateData {
    status?: 'running' | 'paused' | 'stopped' | 'success' | 'error';
    workflowId?: string;
    isDestroyed?: boolean;
    currentBlock?: any;
    [key: string]: any;
}

export interface IEngineStateAdapter {
    saveState(id: string, state: WorkflowStateData): Promise<void>;
    getState(id: string): Promise<WorkflowStateData | null>;
    getAllStates(): Promise<Map<string, WorkflowStateData>>;
    deleteState(id: string): Promise<void>;
}
