import { describe, it, expect, vi } from 'vitest';
import { ExecutionContextFacade } from '../src/facade/ExecutionContextFacade.js';

describe('ExecutionContextFacade', () => {
  const mockAdapter = {
    sendMessageToTab: vi.fn(),
    injectContentScript: vi.fn(),
  };

  it('initializes with minimal adapter config', () => {
    const facade = new ExecutionContextFacade(mockAdapter as any);
    expect(facade.browserAdapter).toBe(mockAdapter);
    expect(facade.engine.id).toBe('engine-1');
    expect(facade.engine.isPopup).toBe(false);
  });

  it('initializes with options', () => {
    const facade = new ExecutionContextFacade({
      browserAdapter: mockAdapter,
      engineId: 'engine-2',
      isPopup: true,
      activeTab: { id: 2, url: '', frameId: 0 },
    } as any);
    expect(facade.engine.id).toBe('engine-2');
    expect(facade.engine.isPopup).toBe(true);
    expect(facade.activeTab?.id).toBe(2);
  });

  it('throws error if adapter missing', () => {
    expect(() => new ExecutionContextFacade({})).toThrow(/initialization failed/);
  });

  describe('getBlockConnections', () => {
    it('returns null if engine destroyed', () => {
      const facade = new ExecutionContextFacade(mockAdapter as any);
      facade.engine.isDestroyed = true;
      expect(facade.getBlockConnections('id')).toBeNull();
    });

    it('returns output connections', () => {
      const facade = new ExecutionContextFacade(mockAdapter as any);
      facade.engine.connectionsMap = {
        'block1-output-1': ['conn1', 'conn2'],
        'block2': new Map([['key', 'conn3']]),
        'block3': { k: 'conn4' },
      };

      expect(facade.getBlockConnections('block1')).toEqual(['conn1', 'conn2']);
      expect(facade.getBlockConnections('block2')).toEqual(['conn3']);
      expect(facade.getBlockConnections('block3')).toEqual(['conn4']);
      expect(facade.getBlockConnections('block4')).toBeNull();
    });
  });

  describe('addDataToColumn', () => {
    it('adds single value', () => {
      const facade = new ExecutionContextFacade(mockAdapter as any);
      facade.addDataToColumn('myCol', 'value1');
      expect(facade.engine.columns.myCol.name).toBe('myCol');
      expect(facade.engine.referenceData.table[0].myCol).toBe('value1');
      
      facade.addDataToColumn('myCol', 'value2');
      expect(facade.engine.referenceData.table[1].myCol).toBe('value2');
    });

    it('adds object array', () => {
      const facade = new ExecutionContextFacade(mockAdapter as any);
      facade.addDataToColumn([{ colA: 'valA', colB: 'valB' }]);
      expect(facade.engine.referenceData.table[0].colA).toBe('valA');
      expect(facade.engine.referenceData.table[0].colB).toBe('valB');
    });
  });

  describe('setVariable', () => {
    it('sets variable', async () => {
      const facade = new ExecutionContextFacade(mockAdapter as any);
      await facade.setVariable('var1', 'test');
      expect(facade.engine.referenceData.variables.var1).toBe('test');
    });

    it('pushes variable array', async () => {
      const facade = new ExecutionContextFacade(mockAdapter as any);
      await facade.setVariable('$push:arrVar', 'item1');
      expect(facade.engine.referenceData.variables.arrVar).toEqual(['item1']);
      await facade.setVariable('$push:arrVar', 'item2');
      expect(facade.engine.referenceData.variables.arrVar).toEqual(['item1', 'item2']);
    });
  });

  describe('_sendMessageToTab', () => {
    it('throws error if no active tab', async () => {
      const facade = new ExecutionContextFacade({ browserAdapter: mockAdapter } as any);
      facade.activeTab = null;
      await expect(facade._sendMessageToTab({})).rejects.toThrow('no-tab');
    });

    it('sends message successfully', async () => {
      const facade = new ExecutionContextFacade({ browserAdapter: mockAdapter, activeTab: { id: 1 } } as any);
      mockAdapter.sendMessageToTab.mockResolvedValueOnce('response');
      const res = await facade._sendMessageToTab({ text: 'hello' });
      expect(res).toBe('response');
      expect(mockAdapter.sendMessageToTab).toHaveBeenCalled();
    });

    it('injects content script on connection error', async () => {
      const facade = new ExecutionContextFacade({ browserAdapter: mockAdapter, activeTab: { id: 1 } } as any);
      mockAdapter.sendMessageToTab.mockRejectedValueOnce(new Error('connection closed'));
      mockAdapter.injectContentScript.mockResolvedValueOnce(true);
      mockAdapter.sendMessageToTab.mockResolvedValueOnce('retry-response');

      const res = await facade._sendMessageToTab({ text: 'hello' });
      expect(res).toBe('retry-response');
      expect(mockAdapter.injectContentScript).toHaveBeenCalled();
    });
  });
});
