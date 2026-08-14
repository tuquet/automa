import { IBrowserAdapter } from "../interfaces/IBrowserAdapter.js";
import { IEngineStateAdapter } from "../interfaces/IEngineStateAdapter.js";
import { IEngineLoggerAdapter } from "../interfaces/IEngineLoggerAdapter.js";

export interface EngineContext {
    variables: Record<string, any>;
    globalData: string;
    loopCounters: Record<string, number>;
    isPopup: boolean;
}

export interface WorkflowEngineConfig {
    browserAdapter: IBrowserAdapter;
    stateAdapter: IEngineStateAdapter;
    loggerAdapter: IEngineLoggerAdapter;
    workflowData: any; // Bản gốc JSON của Workflow
    options?: any;
    blocksHandler: Record<string, Function>; // Object chứa 60+ hàm xử lý
    isPopup?: boolean;
    isTestingMode?: boolean;
    parentWorkflow?: any;
}
