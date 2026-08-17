import { describe, it, expect, vi } from 'vitest';
import { WorkflowWorker, templating } from '../src/engine/WorkflowWorker.js';
import { WorkflowEngine } from '../src/engine/WorkflowEngine.js';

describe('WorkflowWorker', () => {
  const mockAdapter = {
    sendMessageToTab: vi.fn(),
    injectContentScript: vi.fn(),
  };

  describe('templating function', () => {
    it('templates strings in data object', async () => {
      const block = { id: '1', data: { text: 'Hello {{ name }}' } };
      const data = { name: 'Alice' };
      const result = await templating({ block, data });
      expect(result.data.text).toBe('Hello Alice');
      expect(result.replacedValue).toEqual({ '{{ name }}': 'Alice' });
    });

    it('templates deeply nested objects and arrays', async () => {
      const block = { id: '1', data: { arr: ['Val: {{ val }}'], obj: { nested: '{{ val }}' } } };
      const data = { val: 42 };
      const result = await templating({ block, data });
      expect(result.data.arr[0]).toBe('Val: 42');
      expect(result.data.obj.nested).toBe(42);
    });
  });

  describe('worker logic', () => {
    it('initializes worker and executes block', async () => {
      const workflow = {
        nodes: [{ id: '1', type: 'trigger' }]
      };
      const engine = new WorkflowEngine(workflow, { browserAdapter: mockAdapter as any });
      engine.init();
      
      const worker = engine.addWorker({ blockId: '1' });
      expect(worker.id).toMatch(/^worker-\d+/);
      expect(worker.currentBlock).toBeDefined();
    });

    it('pauses execution block when engine paused', async () => {
      const workflow = {
        nodes: [{ id: '1', type: 'trigger' }]
      };
      const engine = new WorkflowEngine(workflow, { browserAdapter: mockAdapter as any });
      engine.execute();
      engine.pause();
      
      const worker = engine.addWorker({ blockId: '1' });
      expect(worker.pausedBlockExecution).not.toBeNull();
      
      engine.resume();
      expect(worker.pausedBlockExecution).toBeNull();
    });

    it('pauses next execution', async () => {
      const workflow = {
        nodes: [{ id: '1', type: 'trigger' }]
      };
      const engine = new WorkflowEngine(workflow, { browserAdapter: mockAdapter as any });
      engine.execute();
      engine.pause();
      
      const worker = Array.from(engine.workers.values())[0];
      worker.executeNextBlocks(['someConnection'], {});
      expect(worker.pausedNextExecution).not.toBeNull();
      
      engine.resume();
      expect(worker.pausedNextExecution).toBeNull();
    });

    it('executes next blocks and creates new workers for branches', () => {
      const workflow = {
        nodes: [
          { id: '1', type: 'trigger' },
          { id: '2', type: 'action' },
          { id: '3', type: 'action' },
        ]
      };
      const engine = new WorkflowEngine(workflow, { browserAdapter: mockAdapter as any });
      engine.registerBlockHandler('action', vi.fn());
      engine.init();
      const worker = engine.addWorker({ blockId: '1' });
      worker.executeNextBlocks(['2', { id: '3' }], {});
      expect(engine.workers.size).toBeGreaterThanOrEqual(1);
    });
  });
});
