import { ExecutionContextFacade } from '../facade/ExecutionContextFacade.js';
import { TabInfo } from '../adapters/IBrowserAdapter.js';
import { WorkflowNode } from '../types/index.js';
import { toCamelCase, isObject } from '../utils/helpers.js';
import renderString from '../utils/renderString.js';
import type { WorkflowEngine } from './WorkflowEngine.js';

async function templateData(
  obj: any,
  refData: Record<string, any>,
  isPopup = false,
  replacedValueAcc: Record<string, any> = {}
): Promise<any> {
  if (typeof obj === 'string') {
    const res = await renderString(obj, refData, isPopup);
    if (res.list && Object.keys(res.list).length > 0) {
      Object.assign(replacedValueAcc, res.list);
    }
    return res.value;
  }
  if (Array.isArray(obj)) {
    const newArr = [];
    for (const item of obj) {
      newArr.push(await templateData(item, refData, isPopup, replacedValueAcc));
    }
    return newArr;
  }
  if (isObject(obj)) {
    const newObj: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj)) {
      newObj[k] = await templateData(v, refData, isPopup, replacedValueAcc);
    }
    return newObj;
  }
  return obj;
}

export async function templating({
  block,
  data,
  isPopup = false,
}: {
  block: WorkflowNode;
  data: Record<string, any>;
  isPopup?: boolean;
}): Promise<WorkflowNode & { replacedValue?: Record<string, any> }> {
  const replacedValueAcc: Record<string, any> = {};
  const blockData = block.data || {};
  const replacedData = await templateData(blockData, data, isPopup, replacedValueAcc);
  return {
    ...block,
    data: replacedData,
    replacedValue: replacedValueAcc,
  };
}

export interface WorkerInitDetail {
  blockId: string;
  execParam?: Record<string, any>;
  state?: Record<string, any>;
}

export class WorkflowWorker {
  public id: string;
  public engine: WorkflowEngine;
  public facade: ExecutionContextFacade;
  public settings: Record<string, any>;

  public activeTab: TabInfo | null;
  public windowId: number | null;
  public currentBlock: WorkflowNode | null;
  public loopList: Record<string, any>;
  public loopEls: any[];
  public repeatedTasks: Record<string, any>;
  public preloadScripts: any[];
  public debugAttached: boolean;

  public pausedBlockExecution: { block: WorkflowNode; execParam: Record<string, any> } | null = null;
  public pausedNextExecution: { connections: any[]; prevBlockData: any } | null = null;

  constructor(id: string, engine: WorkflowEngine, options: Record<string, any> = {}) {
    this.id = id;
    this.engine = engine;
    this.settings = engine.workflow?.settings || {};

    this.activeTab = {
      id: engine.options?.tabId ?? 1,
      url: '',
      frameId: 0,
      frames: {},
      groupId: null,
    };
    this.windowId = null;
    this.currentBlock = null;
    this.loopList = {};
    this.loopEls = [];
    this.repeatedTasks = {};
    this.preloadScripts = [];
    this.debugAttached = false;

    this.facade = new ExecutionContextFacade({
      adapterConfig: {
        browserAdapter: engine.browserAdapter,
        options: engine.options,
      },
      referenceData: engine.referenceData,
      columns: engine.columns,
      columnsId: engine.columnsId,
      connectionsMap: engine.connectionsMap,
      blocks: engine.blocks,
      isPopup: engine.options?.isPopup ?? false,
      engineId: engine.id,
      workflow: engine.workflow,
      settings: this.settings,
    });

    this.facade.engine.id = engine.id;
    this.facade.engine.referenceData = engine.referenceData;
    this.facade.engine.blocks = engine.blocks;
    this.facade.engine.connectionsMap = engine.connectionsMap;
    this.facade.engine.columns = engine.columns;
    this.facade.engine.columnsId = engine.columnsId;
    this.facade.engine.workflow = engine.workflow;
    this.facade.engine.destroy = async (status: string, message?: string, detail?: any) => {
      await engine.destroy(status as any, message, detail);
    };
  }

  public init(detail: WorkerInitDetail): void {
    if (detail.state) {
      if (detail.state.windowId !== undefined) this.windowId = detail.state.windowId;
      if (detail.state.loopList) this.loopList = detail.state.loopList;
      if (detail.state.activeTab) this.activeTab = detail.state.activeTab;
      if (detail.state.currentBlock) this.currentBlock = detail.state.currentBlock;
      if (detail.state.repeatedTasks) this.repeatedTasks = detail.state.repeatedTasks;
      if (detail.state.preloadScripts) this.preloadScripts = detail.state.preloadScripts;
      if (detail.state.debugAttached !== undefined) this.debugAttached = detail.state.debugAttached;
    }

    const block = this.engine.blocks[detail.blockId];
    if (!block) {
      console.warn(`Worker ${this.id}: Block ${detail.blockId} not found.`);
      this.engine.destroyWorker(this.id);
      return;
    }

    this.executeBlock(block, detail.execParam);
  }

  public async executeBlock(block: WorkflowNode, execParam: Record<string, any> = {}): Promise<void> {
    if (this.engine.isDestroyed || this.engine.state === 'stopped') {
      return;
    }

    if (this.engine.isPaused || this.engine.state === 'paused') {
      this.pausedBlockExecution = { block, execParam };
      return;
    }

    this.currentBlock = block;

    this.facade.activeTab = this.activeTab;
    this.facade.windowId = this.windowId;
    this.facade.loopList = this.loopList;
    this.facade.loopEls = this.loopEls;
    this.facade.repeatedTasks = this.repeatedTasks;
    this.facade.preloadScripts = this.preloadScripts;
    this.facade.debugAttached = this.debugAttached;
    this.facade.currentBlock = block;

    this.engine.emit('block:execute', {
      workerId: this.id,
      block,
      execParam,
    });

    const label = block.label || block.type || '';
    const labelCamel = toCamelCase(label);
    const handler =
      this.engine.blocksHandler[labelCamel] ||
      this.engine.blocksHandler[label] ||
      this.engine.blocksHandler[block.type || ''] ||
      (block.data as any)?.handler;

    if (!handler || typeof handler !== 'function') {
      const msg = `Handler for block label "${label}" (type "${block.type}") not found in engine.blocksHandler`;
      console.error(msg);
      this.engine.emit('block:error', { workerId: this.id, block, error: new Error(msg) });
      this.engine.destroyWorker(this.id);
      return;
    }

    const prevBlockData = execParam.prevBlockData ?? '';
    const refData = {
      prevBlockData,
      ...this.engine.referenceData,
      activeTabUrl: this.activeTab?.url || '',
    };

    try {
      let result: any;

      if (block.data?.disableBlock) {
        result = {
          data: '',
          nextBlockId: this.getBlockConnections(block.id),
        };
      } else {
        const replacedBlock = await templating({
          block,
          data: refData,
          isPopup: this.engine.options?.isPopup ?? false,
        });

        const boundHandler = handler.bind(this.facade, replacedBlock, {
          refData,
          prevBlock: execParam.prevBlock || null,
          ...(execParam || {}),
        });

        result = await boundHandler();

        if (result && result.replacedValue) {
          replacedBlock.replacedValue = result.replacedValue;
        }
      }

      if (this.engine.isDestroyed || (this.engine.state as string) === 'stopped') {
        return;
      }

      this.loopList = this.facade.loopList;
      this.loopEls = this.facade.loopEls;
      this.activeTab = this.facade.activeTab;
      this.windowId = this.facade.windowId;

      this.engine.emit('block:done', {
        workerId: this.id,
        block,
        result,
      });

      if (result && result.nextBlockId && !result.destroyWorker) {
        const blockDelay = this.settings?.blockDelay || 0;
        if (blockDelay > 0) {
          setTimeout(() => {
            this.executeNextBlocks(result.nextBlockId, result.data);
          }, blockDelay);
        } else {
          this.executeNextBlocks(result.nextBlockId, result.data);
        }
      } else {
        this.engine.destroyWorker(this.id);
      }
    } catch (error: any) {
      if (this.engine.isDestroyed || (this.engine.state as string) === 'stopped') {
        return;
      }
      const errObj = error instanceof Error ? error : new Error(String(error));
      this.engine.emit('block:error', { workerId: this.id, block, error: errObj });
      this.engine.destroy('error', errObj.message, { blockId: block.id, error: errObj });
    }
  }

  public getBlockConnections(blockId: string, outputIndex: number | string = 1): any[] | null {
    return this.facade.getBlockConnections(blockId, outputIndex);
  }

  public executeNextBlocks(connections: any[], prevBlockData: any): void {
    if (this.engine.isDestroyed || this.engine.state === 'stopped') {
      return;
    }

    if (this.engine.isPaused || this.engine.state === 'paused') {
      this.pausedNextExecution = { connections, prevBlockData };
      return;
    }

    if (!connections || !Array.isArray(connections) || connections.length === 0) {
      this.engine.destroyWorker(this.id);
      return;
    }

    const validConnections = connections.filter((conn) => {
      const id = typeof conn === 'string' ? conn : (conn.id || conn.target);
      const targetBlock = this.engine.blocks[id];
      return targetBlock && !targetBlock.data?.disableBlock;
    });

    if (validConnections.length === 0) {
      this.engine.destroyWorker(this.id);
      return;
    }

    validConnections.forEach((connection, index) => {
      const id = typeof connection === 'string' ? connection : (connection.id || connection.target);
      const targetBlock = this.engine.blocks[id];
      if (!targetBlock) return;

      const execParam = {
        prevBlockData,
        targetHandle: typeof connection === 'object' ? connection.targetHandle : undefined,
        sourceHandle: typeof connection === 'object' ? connection.sourceHandle : undefined,
      };

      if (index === 0) {
        this.executeBlock(targetBlock, execParam);
      } else {
        const state = {
          windowId: this.windowId,
          loopList: JSON.parse(JSON.stringify(this.loopList)),
          activeTab: { ...this.activeTab },
          currentBlock: this.currentBlock,
          repeatedTasks: { ...this.repeatedTasks },
          preloadScripts: [...this.preloadScripts],
          debugAttached: this.debugAttached,
        };

        this.engine.addWorker({
          state,
          execParam,
          blockId: id,
        });
      }
    });
  }

  public resume(): void {
    if (this.engine.isDestroyed || this.engine.state === 'stopped') {
      return;
    }
    if (this.pausedBlockExecution) {
      const { block, execParam } = { ...this.pausedBlockExecution };
      this.pausedBlockExecution = null;
      this.executeBlock(block, execParam);
    } else if (this.pausedNextExecution) {
      const { connections, prevBlockData } = { ...this.pausedNextExecution };
      this.pausedNextExecution = null;
      this.executeNextBlocks(connections, prevBlockData);
    }
  }
}
