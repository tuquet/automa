import { AdapterConfig, IBrowserAdapter } from '../adapters/IBrowserAdapter.js';
import { WorkflowWorker, WorkerInitDetail } from './WorkflowWorker.js';
import { ReferenceData, TableColumn, Workflow, WorkflowNode, EngineState } from '../types/index.js';
import { parseJSON, isObject } from '../utils/helpers.js';

import { defaultBlocksHandler } from '../blocksHandler/index.js';

export class WorkflowEngine {
  public id: string;
  public browserAdapter: IBrowserAdapter;
  public options: Record<string, any>;
  public workflow: Workflow | any;
  public state: 'idle' | 'running' | 'paused' | 'completed' | 'stopped' | 'error';
  public isDestroyed: boolean;
  public isPaused: boolean;

  public blocks: Record<string, WorkflowNode>;
  public connectionsMap: Record<string, any>;
  public referenceData: ReferenceData;
  public columns: Record<string, TableColumn>;
  public columnsId: Record<string, string>;

  public workers: Map<string, WorkflowWorker>;
  public blocksHandler: Record<string, Function>;

  public triggerBlockId: string | null;
  private workerIdCounter: number;
  private eventListeners: Map<string, Set<Function>>;

  constructor(workflowOrConfig?: Workflow | AdapterConfig | any, configParam?: AdapterConfig) {
    let workflow: any = null;
    let config: AdapterConfig | null = null;

    if (workflowOrConfig && typeof workflowOrConfig === 'object' && 'browserAdapter' in workflowOrConfig) {
      config = workflowOrConfig as AdapterConfig;
      workflow = (workflowOrConfig as any).workflow || null;
    } else if (configParam && typeof configParam === 'object' && 'browserAdapter' in configParam) {
      workflow = workflowOrConfig;
      config = configParam;
    } else if (
      workflowOrConfig &&
      typeof workflowOrConfig === 'object' &&
      'options' in workflowOrConfig &&
      (workflowOrConfig as any).options?.browserAdapter
    ) {
      config = {
        browserAdapter: (workflowOrConfig as any).options.browserAdapter,
        options: (workflowOrConfig as any).options,
      };
      workflow = workflowOrConfig;
    }

    if (!config || !config.browserAdapter) {
      throw new Error(
        'WorkflowEngine initialization failed: AdapterConfig.browserAdapter is required for dependency injection.'
      );
    }

    this.id = `engine-${Math.random().toString(36).substring(2, 9)}`;
    this.browserAdapter = config.browserAdapter;
    this.options = config.options || {};
    this.workflow = workflow || {};

    this.state = 'idle';
    this.isDestroyed = false;
    this.isPaused = false;

    this.blocks = {};
    this.connectionsMap = {};
    this.workers = new Map();
    this.blocksHandler = {};
    this.triggerBlockId = null;
    this.workerIdCounter = 0;
    this.eventListeners = new Map();

    this.registerBlocksHandler(defaultBlocksHandler);

    this.columns = {
      column: {
        id: 'column',
        index: 0,
        type: 'any',
        name: this.workflow?.settings?.defaultColumnName || 'column',
      },
    };
    this.columnsId = { column: 'column' };

    const initialVars = isObject(this.options?.data?.variables) ? this.options.data.variables : {};
    const initialGlobalData = this.options?.data?.globalData ?? this.workflow?.globalData ?? {};

    this.referenceData = {
      variables: initialVars,
      table: [],
      secrets: {},
      loopData: {},
      workflow: {},
      googleSheets: {},
      globalData: parseJSON(initialGlobalData, initialGlobalData),
    };
  }

  public registerBlockHandler(label: string, handler: Function): void {
    this.blocksHandler[label] = handler;
  }

  public registerBlocksHandler(handlers: Record<string, Function>): void {
    Object.assign(this.blocksHandler, handlers);
  }

  public init(workflowJson?: Workflow | any): this {
    if (workflowJson) {
      this.workflow = workflowJson;
    }

    if (!this.workflow) {
      throw new Error('WorkflowEngine.init failed: No workflow definition provided.');
    }

    const drawflow = this.workflow.drawflow || {};
    const nodes: WorkflowNode[] = this.workflow.nodes || drawflow.nodes || [];
    const edges: any[] = this.workflow.edges || drawflow.edges || [];

    this.blocks = {};
    nodes.forEach((node) => {
      this.blocks[node.id] = node;
    });

    this.connectionsMap = {};
    edges.forEach((edge) => {
      const source = edge.source || edge.sourceId;
      const target = edge.target || edge.targetId;
      const sourceHandle = edge.sourceHandle || `${source}-output-1`;
      const targetHandle = edge.targetHandle || `${target}-input-1`;

      if (!source || !target) return;

      const connectionObj = {
        id: target,
        source,
        target,
        sourceHandle,
        targetHandle,
      };

      if (!this.connectionsMap[sourceHandle]) {
        this.connectionsMap[sourceHandle] = [];
      }
      this.connectionsMap[sourceHandle].push(connectionObj);

      if (!this.connectionsMap[source]) {
        this.connectionsMap[source] = [];
      }
      if (!this.connectionsMap[source].some((c: any) => c.id === target && c.sourceHandle === sourceHandle)) {
        this.connectionsMap[source].push(connectionObj);
      }
    });

    const tableDef = this.workflow.table || this.workflow.dataColumns || [];
    const columnsArr = Array.isArray(tableDef) ? tableDef : Object.values(tableDef);
    columnsArr.forEach((col: any) => {
      const colName = col.name || col.id || 'column';
      const colId = col.id || colName;
      this.columnsId[colName] = colId;
      if (!this.columns[colId]) {
        this.columns[colId] = { index: 0, name: colName, type: col.type || 'any', id: colId };
      }
    });

    const triggerNode = nodes.find((node) => {
      if (this.options?.blockId) return node.id === this.options.blockId;
      const label = (node.label || node.type || '').toLowerCase();
      return label === 'trigger';
    }) || nodes[0];

    this.triggerBlockId = triggerNode ? triggerNode.id : null;
    this.state = 'idle';

    return this;
  }

  public execute(): void {
    if (this.state === 'running') return;

    if (!this.triggerBlockId) {
      this.init();
    }

    if (!this.triggerBlockId) {
      throw new Error('WorkflowEngine.execute failed: No valid trigger block found.');
    }

    this.state = 'running';
    this.isDestroyed = false;
    this.isPaused = false;

    this.emit('workflow:start', { engineId: this.id });
    this.addWorker({ blockId: this.triggerBlockId });
  }

  public stop(): void {
    this.state = 'stopped';
    this.isDestroyed = true;
    this.workers.clear();
    this.emit('workflow:done', { status: 'stopped', referenceData: this.referenceData });
  }

  public pause(): void {
    if (this.state !== 'running') return;
    this.state = 'paused';
    this.isPaused = true;
    this.emit('workflow:paused', { engineId: this.id });
  }

  public resume(nextBlock?: any): void {
    if (this.state !== 'paused') return;
    this.state = 'running';
    this.isPaused = false;
    this.emit('workflow:resumed', { engineId: this.id, nextBlock });

    if (nextBlock) {
      const targetId = typeof nextBlock === 'string' ? nextBlock : (nextBlock.id || nextBlock.target);
      if (targetId && this.blocks[targetId]) {
        this.addWorker({ blockId: targetId });
      }
    }

    const currentWorkers = Array.from(this.workers.values());
    for (const worker of currentWorkers) {
      worker.resume();
    }

    if (this.workers.size === 0 && this.state === 'running') {
      this.destroy('completed');
    }
  }

  public getState(): EngineState {
    return {
      id: this.id,
      state: this.state,
      isDestroyed: this.isDestroyed,
      isPaused: this.isPaused,
      referenceData: this.referenceData,
      columns: Object.values(this.columns),
      columnsId: this.columnsId,
      connectionsMap: this.connectionsMap,
      blocks: this.blocks,
      activeWorkers: this.workers.size,
      triggerBlockId: this.triggerBlockId,
    };
  }

  public on(event: string, listener: (...args: any[]) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  public off(event: string, listener: (...args: any[]) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(listener);
    }
  }

  public emit(event: string, ...args: any[]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(...args);
        } catch (e) {
          console.error(`Error in event listener for "${event}":`, e);
        }
      });
    }
  }

  public addWorker(detail: WorkerInitDetail): WorkflowWorker {
    this.workerIdCounter += 1;
    const workerId = `worker-${this.workerIdCounter}`;
    const worker = new WorkflowWorker(workerId, this);
    this.workers.set(workerId, worker);
    worker.init(detail);
    return worker;
  }

  public destroyWorker(workerId: string): void {
    this.workers.delete(workerId);
    if (this.workers.size === 0 && this.state === 'running') {
      this.destroy('completed');
    }
  }

  public destroy(status: 'completed' | 'stopped' | 'error', message?: string, detail?: any): void {
    this.state = status;
    this.isDestroyed = true;
    this.workers.clear();
    this.emit('workflow:done', { status, message, referenceData: this.referenceData, detail });
    if (status === 'error') {
      this.emit('workflow:error', { message, detail });
    }
  }
}
