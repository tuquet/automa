import { isObject, objectHasKey, parseJSON, sleep, toCamelCase, convertData, waitTabLoaded } from './utils/helper.js';
import cloneDeep from 'lodash.clonedeep';
import WorkflowEngine from './WorkflowEngine.js';

// Mock templating and renderString as they are not provided, or should we create them?
async function templating(params: any): Promise<any> {
  return { replacedValue: '', data: params.block.data };
}

async function renderString(str: string, refData: any, isPopup: boolean): Promise<any> {
  return { value: str };
}

function blockExecutionWrapper(blockHandler: Function, blockData: any): Promise<any> {
  return new Promise((resolve, reject) => {
    let timeout: any = null;
    const timeoutMs = blockData?.settings?.blockTimeout;
    if (timeoutMs && timeoutMs > 0) {
      timeout = setTimeout(() => {
        reject(new Error('Timeout'));
      }, timeoutMs);
    }

    blockHandler()
      .then((result: any) => {
        resolve(result);
      })
      .catch((error: any) => {
        reject(error);
      })
      .finally(() => {
        if (timeout) clearTimeout(timeout);
      });
  });
}

export default class WorkflowWorker {
  id: string;
  engine: WorkflowEngine;
  settings: any;
  blocksDetail: any;

  loopEls: any[] = [];
  loopList: Record<string, any> = {};
  repeatedTasks: Record<string, any> = {};
  preloadScripts: any[] = [];
  breakpointState: any = null;

  windowId: string | null = null;
  currentBlock: any = null;
  childWorkflowId: string | null = null;
  debugAttached: boolean = false;
  activeTab: { url: string; frameId: number; frames: any; groupId: any; id: number };

  frameSelector: string = '';

  constructor(id: string, engine: WorkflowEngine, options: any = {}) {
    this.id = id;
    this.engine = engine;
    this.settings = engine.workflow.settings;
    this.blocksDetail = options.blocksDetail || {};

    this.activeTab = {
      url: '',
      frameId: 0,
      frames: {},
      groupId: null,
      id: engine.options?.tabId,
    };
  }

  init({ blockId, execParam, state }: any) {
    if (state) {
      Object.keys(state).forEach((key) => {
        (this as any)[key] = state[key];
      });
    }

    const block = this.engine.blocks[blockId];
    this.executeBlock(block, execParam);
  }

  addDataToColumn(key: any, value: any) {
    if (Array.isArray(key)) {
      key.forEach((item) => {
        if (!isObject(item)) return;

        Object.entries(item).forEach(([itemKey, itemValue]) => {
          this.addDataToColumn(itemKey, itemValue);
        });
      });

      return;
    }

    const insertDefault = this.settings.insertDefaultColumn ?? true;
    const columnId = (this.engine.columns[key] ? key : this.engine.columnsId[key]) || 'column';

    if (columnId === 'column' && !insertDefault) return;

    const currentColumn = this.engine.columns[columnId];
    const columnName = currentColumn.name || 'column';
    const convertedValue = convertData(value, currentColumn.type);

    if (objectHasKey(this.engine.referenceData.table, currentColumn.index)) {
      this.engine.referenceData.table[currentColumn.index][columnName] = convertedValue;
    } else {
      this.engine.referenceData.table.push({
        [columnName]: convertedValue,
      });
    }

    currentColumn.index += 1;
  }

  async setVariable(name: string, value: any) {
    let variableName = name;
    const vars = this.engine.referenceData.variables;

    if (name.startsWith('$push:')) {
      const parts = name.split('$push:');
      const varName = parts[1];

      if (!objectHasKey(vars, varName)) vars[varName] = [];
      else if (!Array.isArray(vars[varName])) vars[varName] = [vars[varName]];

      vars[varName].push(value);
      variableName = varName;
    } else {
      vars[name] = value;
    }

    if (variableName.startsWith('$$')) {
      variableName = variableName.slice(2);
      // Removed direct dbStorage. Use stateAdapter or an event
      this.engine.dispatchEvent('variableUpdated', { name: variableName, value });
    }

    this.engine.addRefDataSnapshot('variables');
  }

  getBlockConnections(blockId: string, outputIndex: number | string = 1) {
    if (this.engine.isDestroyed) return null;

    const outputId = `${blockId}-output-${outputIndex}`;
    const connections = this.engine.connectionsMap[outputId];

    if (!connections) return null;

    return [...connections.values()];
  }

  executeNextBlocks(connections: any[], prevBlockData: any, nextBlockBreakpointCount: number | null = null) {
    for (const connection of connections) {
      const id = typeof connection === 'string' ? connection : connection.id;

      const block = this.engine.blocks[id];

      if (!block) {
        console.error(`Block ${id} doesn't exist`);
        this.engine.destroy('stopped');
        return;
      }

      if (block.data.disableBlock) continue;

      if (block.data?.$breakpoint) {
        nextBlockBreakpointCount = 0;
      }
    }

    connections.forEach((connection, index) => {
      const { id, targetHandle, sourceHandle } =
        typeof connection === 'string'
          ? { id: connection, targetHandle: '', sourceHandle: '' }
          : connection;
      const execParam = {
        prevBlockData,
        targetHandle,
        sourceHandle,
        nextBlockBreakpointCount,
      };

      if (index === 0) {
        this.executeBlock(this.engine.blocks[id], {
          ...execParam,
        });
      } else {
        const state = cloneDeep({
          windowId: this.windowId,
          loopList: this.loopList,
          activeTab: this.activeTab,
          currentBlock: this.currentBlock,
          repeatedTasks: this.repeatedTasks,
          preloadScripts: this.preloadScripts,
          debugAttached: this.debugAttached,
        });

        this.engine.addWorker({
          state,
          execParam,
          blockId: id,
        });
      }
    });
  }

  resume(nextBlock: any) {
    if (!this.breakpointState) return;

    const { block, execParam, isRetry } = this.breakpointState;
    const payload = { ...execParam, resume: true };

    payload.nextBlockBreakpointCount = nextBlock ? 1 : null;

    this.executeBlock(block, payload, isRetry);

    this.breakpointState = null;
  }

  async executeBlock(block: any, execParam: any = {}, isRetry: boolean = false) {
    const currentState = await this.engine.config.stateAdapter.getState(this.engine.id);

    if (!currentState || currentState.isDestroyed) {
      if (this.engine.isDestroyed) return;

      await this.engine.destroy('stopped');
      return;
    }

    const startExecuteTime = Date.now();
    const prevBlock = this.currentBlock;
    this.currentBlock = { ...block, startedAt: startExecuteTime };

    const isInBreakpoint =
      this.engine.isTestingMode &&
      ((block.data?.$breakpoint && !execParam.resume) || execParam.nextBlockBreakpointCount === 0);

    if (!isRetry) {
      const payload: any = {
        activeTabUrl: this.activeTab.url,
        childWorkflowId: this.childWorkflowId,
        nextBlockBreakpoint: Boolean(execParam.nextBlockBreakpointCount),
      };
      if (isInBreakpoint && (currentState.status as any) !== 'breakpoint') payload.status = 'breakpoint';

      await this.engine.updateState(payload);
    }

    if (execParam.nextBlockBreakpointCount) {
      execParam.nextBlockBreakpointCount -= 1;
    }

    if (isInBreakpoint || (currentState.status as any) === 'breakpoint') {
      this.engine.isInBreakpoint = true;
      this.breakpointState = { block, execParam, isRetry };

      return;
    }

    const blockLabel = toCamelCase(block.label);
    let handler = this.engine.config.blocksHandler[blockLabel];
    
    if (!handler && this.blocksDetail[block.label]?.category === 'interaction') {
        handler = this.engine.config.blocksHandler['interactionBlock'];
    }

    if (!handler) {
      console.error(`${block.label} doesn't have handler`);
      this.engine.destroy('stopped');
      return;
    }

    const { prevBlockData } = execParam;
    const refData = {
      prevBlockData,
      ...this.engine.referenceData,
      activeTabUrl: this.activeTab.url,
    };

    const replacedBlock = await templating({
      block,
      data: refData,
      isPopup: this.engine.isPopup,
      refKeys: isRetry || block.data.disableBlock ? null : this.blocksDetail[block.label]?.refDataKeys,
    });

    const blockDelay = this.settings?.blockDelay || 0;
    const addBlockLog = (status: string, obj: any = {}) => {
      let { description } = block.data;

      if (block.label === 'loop-breakpoint') description = block.data.loopId;
      else if (block.label === 'block-package') description = block.data.name;

      this.engine.addLogHistory({
        description,
        prevBlockData,
        type: status,
        name: block.label,
        blockId: block.id,
        workerId: this.id,
        timestamp: startExecuteTime,
        activeTabUrl: this.activeTab?.url,
        replacedValue: replacedBlock.replacedValue,
        duration: Math.round(Date.now() - startExecuteTime),
        ...obj,
      });
    };

    const executeBlocks = (blocks: any, data: any) => {
      return this.executeNextBlocks(blocks, data, execParam.nextBlockBreakpointCount);
    };

    try {
      let result: any;

      if (block.data.disableBlock) {
        result = {
          data: '',
          nextBlockId: this.getBlockConnections(block.id),
        };
      } else {
        const bindedHandler = handler.bind(this, replacedBlock, {
          refData,
          prevBlock,
          ...(execParam || {}),
        });
        result = await blockExecutionWrapper(bindedHandler, block.data);

        if (this.engine.isDestroyed) return;

        if (result.replacedValue) {
          replacedBlock.replacedValue = result.replacedValue;
        }

        addBlockLog(result.status || 'success', {
          logId: result.logId,
          ctxData: result?.ctxData,
        });
      }

      if (result.nextBlockId && !result.destroyWorker) {
        if (blockDelay > 0) {
          setTimeout(() => {
            try {
              this.executeNextBlocks(result.nextBlockId, result.data);
            } catch (err) {
              this.engine.addLogHistory({ type: 'error', name: block.label, message: (err as Error).message });
              this.engine.destroy('error', (err as Error).message);
            }
          }, blockDelay);
        } else {
          executeBlocks(result.nextBlockId, result.data);
        }
      } else {
        this.engine.destroyWorker(this.id);
      }
    } catch (error: any) {
      console.error(error);

      const errorLogData = {
        message: error.message,
        ...(error.data || {}),
        ...(error.ctxData || {}),
      };

      const { onError: blockOnError } = replacedBlock.data;
      if (blockOnError && blockOnError.enable) {
        if (blockOnError.retry && blockOnError.retryTimes) {
          await sleep(blockOnError.retryInterval * 1000);
          blockOnError.retryTimes -= 1;
          await this.executeBlock(replacedBlock, execParam, true);

          return;
        }

        if (blockOnError.insertData) {
          for (const item of blockOnError.dataToInsert) {
            let value = (await renderString(item.value, refData, this.engine.isPopup))?.value;
            value = parseJSON(value, value);

            if (item.type === 'variable') {
              await this.setVariable(item.name, value);
            } else {
              this.addDataToColumn(item.name, value);
            }
          }
        }

        const nextBlocks = this.getBlockConnections(block.id, blockOnError.toDo === 'continue' ? 1 : 'fallback');
        if (blockOnError.toDo !== 'error' && nextBlocks) {
          addBlockLog('error', errorLogData);

          executeBlocks(nextBlocks, prevBlockData);

          return;
        }

        if (blockOnError.toDo === 'error' && blockOnError.errorMessage.trim()) {
          errorLogData.message = blockOnError.errorMessage;
          error.message = blockOnError.errorMessage;
        }
      }

      const errorLogItem = errorLogData;
      addBlockLog('error', errorLogItem);

      errorLogItem.blockId = block.id;

      const { onError } = this.settings;
      const nodeConnections = this.getBlockConnections(block.id);

      if (onError === 'keep-running' && nodeConnections) {
        setTimeout(() => {
          executeBlocks(nodeConnections, error.data || '');
        }, blockDelay);
      } else if (onError === 'restart-workflow' && !this.engine.parentWorkflow) {
        const restartCount = this.engine.restartWorkersCount[this.id] || 0;
        const maxRestart = this.settings.restartTimes ?? 3;

        if (restartCount >= maxRestart) {
          delete this.engine.restartWorkersCount[this.id];
          this.engine.destroy('error', error.message, errorLogItem);
          return;
        }

        this.reset();

        const triggerBlock = this.engine.blocks[this.engine.triggerBlockId!];
        if (triggerBlock) this.executeBlock(triggerBlock, execParam);

        this.engine.restartWorkersCount[this.id] = restartCount + 1;
      } else {
        this.engine.destroy('error', error.message, errorLogItem);
      }
    }
  }

  reset() {
    this.loopList = {};
    this.repeatedTasks = {};

    this.windowId = null;
    this.currentBlock = null;
    this.childWorkflowId = null;

    this.engine.history = [];
    this.engine.preloadScripts = [];
    this.engine.columns = {
      column: {
        index: 0,
        type: 'any',
        name: this.settings?.defaultColumnName || 'column',
      },
    };

    this.activeTab = {
      url: '',
      frameId: 0,
      frames: {},
      groupId: null,
      id: this.engine.options?.tabId,
    };
    this.engine.referenceData = {
      table: [],
      secrets: this.engine.referenceData.secrets,
      loopData: {},
      workflow: {},
      googleSheets: {},
      variables: this.engine.options?.variables || {},
      globalData: this.engine.referenceData.globalData,
    };
  }

  async _sendMessageToTab(payload: any, options: any = {}, runBeforeLoad: boolean = false, retryCount = 0): Promise<any> {
    try {
      if (!this.activeTab.id) {
        const error: any = new Error('no-tab');
        error.workflowId = this.id;
        throw error;
      }

      if (!runBeforeLoad) {
        await waitTabLoaded({
          tabId: this.activeTab.id,
          ms: this.settings?.tabLoadTimeout ?? 30000,
        });
      }

      const { executedBlockOnWeb, debugMode } = this.settings;
      const messagePayload = {
        isBlock: true,
        debugMode,
        executedBlockOnWeb,
        loopEls: this.loopEls,
        activeTabId: this.activeTab.id,
        frameSelector: this.frameSelector,
        ...payload,
      };

      // Delegating to Browser Adapter
      const data = await this.engine.config.browserAdapter.sendMessageToTab(this.activeTab.id, Object.assign({}, messagePayload, { frameId: this.activeTab.frameId, ...options }));
      return data;
    } catch (error: any) {
      console.error(error);
      const noConnection = error.message?.includes('Could not establish connection');
      const channelClosed = error.message?.includes('message channel closed');

      if ((noConnection || channelClosed) && retryCount < 3) {
        const isScriptInjected = await this.engine.config.browserAdapter.executeScript(this.activeTab.id, './contentScript.bundle.js');

        if (isScriptInjected) {
          const result: any = await this._sendMessageToTab(payload, options, runBeforeLoad, retryCount + 1);
          return result;
        }
        error.message = 'Could not establish connection to the active tab';
      } else if (error.message?.startsWith('No tab')) {
        error.message = 'active-tab-removed';
      }

      throw error;
    }
  }
}
