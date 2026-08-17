import { describe, it, expect, vi } from 'vitest';
import { WorkflowEngine } from '../src/engine/WorkflowEngine.js';

describe('WorkflowEngine', () => {
  const mockAdapter = {
    sendMessageToTab: vi.fn(),
    injectContentScript: vi.fn(),
  };

  it('initializes correctly with adapter config', () => {
    const engine = new WorkflowEngine({ browserAdapter: mockAdapter as any });
    expect(engine.state).toBe('idle');
    expect(engine.browserAdapter).toBe(mockAdapter);
  });

  it('initializes correctly with workflow and config', () => {
    const engine = new WorkflowEngine({ nodes: [] }, { browserAdapter: mockAdapter as any });
    expect(engine.workflow).toEqual({ nodes: [] });
  });

  it('throws if no browser adapter is provided', () => {
    expect(() => new WorkflowEngine({})).toThrow(/dependency injection/);
  });

  describe('init', () => {
    it('initializes workflow blocks and connections', () => {
      const workflow = {
        nodes: [
          { id: '1', type: 'trigger' },
          { id: '2', type: 'action' },
        ],
        edges: [
          { source: '1', target: '2', sourceHandle: '1-output-1', targetHandle: '2-input-1' }
        ],
        table: [
          { name: 'col1', type: 'string' }
        ]
      };
      
      const engine = new WorkflowEngine(workflow, { browserAdapter: mockAdapter as any });
      engine.init();

      expect(engine.blocks['1']).toBeDefined();
      expect(engine.blocks['2']).toBeDefined();
      expect(engine.connectionsMap['1-output-1']).toHaveLength(1);
      expect(engine.connectionsMap['1-output-1'][0].target).toBe('2');
      expect(engine.columnsId['col1']).toBeDefined();
      expect(engine.triggerBlockId).toBe('1');
    });

    it('throws error if no workflow', () => {
      const engine = new WorkflowEngine({ browserAdapter: mockAdapter as any });
      engine.workflow = null;
      expect(() => engine.init()).toThrow(/No workflow definition/);
    });
  });

  describe('execution control', () => {
    it('executes workflow', () => {
      const workflow = {
        nodes: [{ id: 'trigger1', type: 'trigger' }]
      };
      const engine = new WorkflowEngine(workflow, { browserAdapter: mockAdapter as any });
      const spy = vi.spyOn(engine, 'emit');
      
      engine.execute();
      expect(engine.state).toBe('running');
      expect(spy).toHaveBeenCalledWith('workflow:start', { engineId: engine.id });
      expect(engine.workers.size).toBe(1);
    });

    it('pauses and resumes workflow', () => {
      const engine = new WorkflowEngine({ nodes: [{ id: '1', type: 'trigger' }] }, { browserAdapter: mockAdapter as any });
      engine.execute();
      
      engine.pause();
      expect(engine.state).toBe('paused');
      
      engine.resume();
      expect(engine.state).toBe('running');
    });

    it('stops workflow', () => {
      const engine = new WorkflowEngine({ nodes: [{ id: '1', type: 'trigger' }] }, { browserAdapter: mockAdapter as any });
      engine.execute();
      engine.stop();
      
      expect(engine.state).toBe('stopped');
      expect(engine.isDestroyed).toBe(true);
      expect(engine.workers.size).toBe(0);
    });
  });

  describe('events', () => {
    it('can subscribe to and emit events', () => {
      const engine = new WorkflowEngine({ browserAdapter: mockAdapter as any });
      const listener = vi.fn();
      engine.on('test_event', listener);
      engine.emit('test_event', 123);
      expect(listener).toHaveBeenCalledWith(123);

      engine.off('test_event', listener);
      engine.emit('test_event', 456);
      expect(listener).toHaveBeenCalledTimes(1);
    });
  });

  describe('getState', () => {
    it('returns engine state', () => {
      const engine = new WorkflowEngine({ browserAdapter: mockAdapter as any });
      const state = engine.getState();
      expect(state.id).toBe(engine.id);
      expect(state.state).toBe('idle');
      expect(state.isDestroyed).toBe(false);
    });
  });
});
