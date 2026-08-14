import { isObject, parseJSON, sleep, clearCache } from './utils/helper.js';
import cloneDeep from 'lodash.clonedeep';
import { nanoid } from 'nanoid';
import WorkflowWorker from './WorkflowWorker.js';
import { WorkflowEngineConfig } from './types/index.js';

export default class WorkflowEngine {
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

  startedTimestamp: number = 0;
  childWorkflowId: string | null = null;
  state: any = null;

  constructor(config: WorkflowEngineConfig) {
    this.id = nanoid();
    this.config = config;
    this.workflow = config.workflowData;
    this.isPopup = config.isPopup ?? true;
    this.isTestingMode = this.workflow.testingMode;
    this.parentWorkflow = config.parentWorkflow;
    this.saveLog = this.workflow.settings?.saveLog ?? true;
    this.options = config.options;

    this.workerId = 0;
    this.workers = new Map();
    this.restartWorkersCount = {};

    this.packagesCache = {};
    this.extractedGroup = {};
    this.connectionsMap = {};
    this.waitConnections = {};

    this.isDestroyed = false;
    this.isUsingProxy = false;
    this.isInBreakpoint = false;

    this.triggerBlockId = null;

    this.blocks = {};
    this.history = [];
    this.columnsId = {};
    this.historyCtxData = {};
    this.eventListeners = {};
    this.preloadScripts = [];

    this.columns = {
      column: {
        index: 0,
        type: 'any',
        name: this.workflow.settings?.defaultColumnName || 'column',
      },
    };
    this.rowData = {};

    this.logsLimit = 1001;
    this.logHistoryId = 0;

    let variables: any = {};
    let globalData = this.workflow.globalData;
    if (this.options && this.options?.data) {
      globalData = this.options.data.globalData || globalData;
      variables = isObject(this.options.data.variables) ? this.options?.data.variables : {};

      this.options.data = { globalData, variables };
    }

    this.refDataSnapshots = {};
    this.refDataSnapshotsKeys = {
      loopData: {
        index: 0,
        key: '##loopData0',
      },
      variables: {
        index: 0,
        key: '##variables0',
      },
    };
    this.referenceData = {
      variables,
      table: [],
      secrets: {},
      loopData: {},
      workflow: {},
      googleSheets: {},
      globalData: parseJSON(globalData, globalData),
    };
  }

  onDebugEvent = ({ tabId }: any, method: string, params: any) => {
    let isActiveTabEvent = false;
    this.workers.forEach((worker) => {
      if (isActiveTabEvent) return;
      isActiveTabEvent = worker.activeTab.id === tabId;
    });

    if (!isActiveTabEvent) return;

    (this.eventListeners[method] || []).forEach((listener) => {
      listener(params);
    });
  };

  onWorkflowStopped = (id: string) => {
    if (this.id !== id || this.isDestroyed) return;
    this.stop();
  };

  onResumeExecution = ({ id, nextBlock }: any) => {
    if (this.id !== id || this.isDestroyed) return;

    this.workers.forEach((worker) => {
      worker.resume(nextBlock);
    });
  };

  async init() {
    try {
      if (this.workflow.isDisabled) return;

      if (!this.config.stateAdapter) {
        console.error(`"${this.workflow.name}" workflow doesn't have states`);
        this.destroy('error');
        return;
      }

      const { nodes, edges } = this.workflow.drawflow;
      if (!nodes || nodes.length === 0) {
        console.error(`${this.workflow.name} doesn't have blocks`);
        return;
      }

      const triggerBlock = nodes.find((node: any) => {
        if (this.options?.blockId) return node.id === this.options.blockId;
        return node.label === 'trigger';
      });
      if (!triggerBlock) {
        console.error(`${this.workflow.name} doesn't have a trigger block`);
        return;
      }

      if (!this.workflow.settings) {
        this.workflow.settings = {};
      }

      const checkParams = this.options?.checkParams ?? true;
      const hasParams = checkParams && triggerBlock.data?.parameters?.length > 0;
      if (hasParams) {
        this.eventListeners = {};
        // Notify host that input params are required
        this.dispatchEvent('requireParams', {
          workflow: this.workflow,
          params: triggerBlock.data.parameters,
        });
        return;
      }

      this.triggerBlockId = triggerBlock.id;

      this.blocks = nodes.reduce((acc: any, node: any) => {
        acc[node.id] = node;
        return acc;
      }, {});
      this.connectionsMap = edges.reduce((acc: any, { sourceHandle, target, targetHandle }: any) => {
        if (!acc[sourceHandle]) acc[sourceHandle] = new Map();
        acc[sourceHandle].set(target, {
          id: target,
          targetHandle,
          sourceHandle,
        });
        return acc;
      }, {});

      const workflowTable = this.workflow.table || this.workflow.dataColumns || [];
      let columns = Array.isArray(workflowTable) ? workflowTable : Object.values(workflowTable);

      if (this.workflow.connectedTable) {
        // Request table from host
        this.dispatchEvent('requestConnectedTable', { tableId: this.workflow.connectedTable });
      }

      columns.forEach(({ name, type, id }: any) => {
        const columnId = id || name;

        this.rowData[name] = null;
        this.columnsId[name] = columnId;
        if (!this.columns[columnId]) this.columns[columnId] = { index: 0, name, type };
      });

      if (this.workflow.settings.reuseLastState && !this.workflow.connectedTable) {
        this.dispatchEvent('requestLastState', { workflowId: this.workflow.id });
      }

      this.logsLimit = 1001;
      this.workflow.table = columns;
      this.startedTimestamp = Date.now();

      // We rely on host to fetch credentials and variables
      this.dispatchEvent('requestCredentials', {});
      this.dispatchEvent('requestVariables', {});

      this.addRefDataSnapshot('variables');

      await this.config.stateAdapter.saveState(this.id, {
        id: this.id,
        status: 'running',
        state: this.state,
        workflowId: this.workflow.id,
        parentState: this.parentWorkflow,
        teamId: this.workflow.teamId || null,
      });

      this.addWorker({ blockId: triggerBlock.id });
    } catch (error) {
      console.error('WorkflowEngine init error:', error);
    }
  }

  addRefDataSnapshot(key: string) {
    this.refDataSnapshotsKeys[key].index += 1;
    const keyName = `${key}_${this.refDataSnapshotsKeys[key].index}`;
    this.refDataSnapshotsKeys[key].key = keyName;

    this.refDataSnapshots[keyName] = cloneDeep(this.referenceData[key]);
  }

  addWorker(detail: any) {
    this.workerId += 1;

    const workerId = `worker-${this.workerId}`;
    const worker = new WorkflowWorker(workerId, this, { blocksDetail: {} });
    worker.init(detail);

    this.workers.set(worker.id, worker);
  }

  addLogHistory(detail: any) {
    if (detail.name === 'blocks-group') return;

    const isLimit = this.history?.length >= this.logsLimit;
    const notErrorLog = detail.type !== 'error';

    if ((isLimit || !this.saveLog) && notErrorLog) return;

    this.logHistoryId += 1;
    detail.id = this.logHistoryId;

    if (
      detail.name !== 'delay' ||
      detail.replacedValue ||
      detail.name === 'javascript-code' ||
      (this.saveLog)
    ) {
      const { variables, loopData } = this.refDataSnapshotsKeys;

      this.historyCtxData[this.logHistoryId] = {
        referenceData: {
          loopData: loopData.key,
          variables: variables.key,
          activeTabUrl: detail.activeTabUrl,
          prevBlockData: detail.prevBlockData || '',
        },
        replacedValue: cloneDeep(detail.replacedValue),
        ...(detail?.ctxData || {}),
      };

      delete detail.replacedValue;
    }

    if (this.history?.length >= this.logsLimit) {
      this.history.shift(); // Remove oldest log to prevent unbounded memory leak
    }
    this.history.push(detail);
  }

  async stop() {
    try {
      if (this.childWorkflowId) {
        // await this.config.stateAdapter.deleteState(this.childWorkflowId);
      }

      await this.destroy('stopped');
    } catch (error) {
      console.error(error);
    }
  }

  async executeQueue() {
    this.dispatchEvent('executeQueue', { workflowId: this.workflow.id });
  }

  async destroyWorker(workerId: string) {
    if (this.workers.size === 1 && this.workers.has(workerId)) {
      this.addLogHistory({
        type: 'finish',
        name: 'finish',
      });
      this.dispatchEvent('finish', {});
      await this.destroy('success');
    }
    this.workers.delete(workerId);

    if (this.workers.size === 0) {
      this.destroy('success');
    }
  }

  async destroy(status: string, message?: string, blockDetail?: any) {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    const cleanUp = () => {
      this.referenceData = null;
      this.eventListeners = {};
      this.packagesCache = null;
      this.extractedGroup = null;
      this.connectionsMap = null;
      this.waitConnections = null;
      this.blocks = {};
      this.history = [];
      this.columnsId = {};
      this.historyCtxData = {};
      this.preloadScripts = [];
    };

    try {
      if (this.isUsingProxy) this.dispatchEvent('clearProxy', {});
      
      const endedTimestamp = Date.now();
      this.workers.clear();
      this.executeQueue();

      await this.config.stateAdapter.deleteState(this.id);

      if (!this.workflow.settings?.debugMode) {
        this.dispatchEvent('reportLog', {
          workflowId: this.workflow.id,
          workflowName: this.workflow.name,
          nodesCount: this.workflow.drawflow.nodes.length,
          status,
          message: message || '',
          startedAt: new Date(this.startedTimestamp).toISOString(),
          endedAt: new Date(endedTimestamp).toISOString(),
        });
      }

      this.dispatchEvent('destroyed', {
        status,
        message,
        blockDetail,
        id: this.id,
        endedTimestamp,
        history: this.history,
        startedTimestamp: this.startedTimestamp,
      });

      if (this.workflow.settings.reuseLastState) {
        this.dispatchEvent('saveLastState', {
          columns: this.columns,
          referenceData: {
            table: this.referenceData.table,
            variables: this.referenceData.variables,
          },
        });
      } else if (status === 'success') {
        clearCache(this.workflow);
      }

      const { table, variables } = this.referenceData;
      const tableId = this.workflow.connectedTable;

      Object.values(this.referenceData.workflow).forEach((data: any) => {
        Object.assign(table, data.table);
        Object.assign(variables, data.variables);
      });

      this.dispatchEvent('updateTableData', { tableId, table, columns: this.columns });

      if (!this.workflow?.isTesting) {
        const { name, id, teamId } = this.workflow;

        await this.config.loggerAdapter.addHistory({
          id: this.id,
          workflowId: id,
          status,
          startedAt: this.startedTimestamp,
          endedAt: endedTimestamp,
        });
      }

      cleanUp();
    } catch (error) {
      console.error('workflowEngine error', error);
      cleanUp();
    }
  }

  async updateState(data: any) {
    const state = {
      ...data,
      tabIds: [] as number[],
      currentBlock: [] as any[],
      name: this.workflow.name,
      logs: this.history,
      ctxData: {
        ctxData: this.historyCtxData,
        dataSnapshot: this.refDataSnapshots,
      },
      startedTimestamp: this.startedTimestamp,
    };

    this.workers.forEach((worker) => {
      if (worker.currentBlock) {
        const { id, label, startedAt } = worker.currentBlock;
        state.currentBlock.push({ id, name: label, startedAt });
      }
      if (worker.activeTab) {
        state.tabIds.push(worker.activeTab.id);
      }
    });

    await this.config.stateAdapter.saveState(this.id, { state });
    this.dispatchEvent('update', { state });
  }

  dispatchEvent(name: string, params: any) {
    const listeners = this.eventListeners[name];

    if (!listeners) return;

    listeners.forEach((callback) => {
      callback(params);
    });
  }

  on(name: string, listener: Function) {
    (this.eventListeners[name] = this.eventListeners[name] || []).push(listener);
  }
}
