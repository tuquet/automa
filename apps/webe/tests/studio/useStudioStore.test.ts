import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, beforeEach } from 'vitest';
import { useStudioStore } from '../../src/studio/stores/useStudioStore';

describe('useStudioStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('initializes with a default empty workflow', () => {
    const store = useStudioStore();
    expect(store.currentWorkflow).toBeNull();
    expect(store.isDirty).toBe(false);
  });

  it('sets workflow and computes nodes count', () => {
    const store = useStudioStore();
    store.setWorkflow({
      id: '123',
      drawflow: {
        nodes: [{ id: 'node_1' }, { id: 'node_2' }],
        edges: []
      }
    });

    expect(store.currentWorkflow.id).toBe('123');
    expect(store.getNodesCount).toBe(2);
  });

  it('updates node data correctly', () => {
    const store = useStudioStore();
    store.setWorkflow({
      drawflow: {
        nodes: [{ id: 'node_1', label: 'trigger', data: { param: 'value', parameters: [{ name: 'foo' }] } }],
        edges: []
      }
    });

    store.updateNodeData('node_1', { param: 'new-value' });
    const node = store.getNode('node_1');
    expect(node.data.param).toBe('new-value');
    expect(store.getTriggerParameters).toEqual([{ name: 'foo' }]);
    expect(store.isDirty).toBe(true);
  });

  it('handles job lifecycle transitions correctly', () => {
    const store = useStudioStore();
    expect(store.activeJobId).toBeNull();
    expect(store.isJobRunning).toBe(false);
    expect(store.isJobPaused).toBe(false);

    store.startJob('job_abc123');
    expect(store.activeJobId).toBe('job_abc123');
    expect(store.isJobRunning).toBe(true);
    expect(store.isJobPaused).toBe(false);

    store.pauseJob();
    expect(store.isJobPaused).toBe(true);

    store.resumeJob();
    expect(store.isJobPaused).toBe(false);

    store.setActiveBlock('node_456');
    expect(store.activeBlockId).toBe('node_456');

    store.finishJob();
    expect(store.activeJobId).toBeNull();
    expect(store.isJobRunning).toBe(false);
    expect(store.isJobPaused).toBe(false);
    expect(store.activeBlockId).toBeNull();
  });

  it('adds and deletes nodes cleanly', () => {
    const store = useStudioStore();
    store.setWorkflow({
      drawflow: { nodes: [], edges: [] }
    });

    store.addNode({ id: 'node_new', label: 'click' });
    expect(store.getNodesCount).toBe(1);
    expect(store.getNode('node_new')?.label).toBe('click');

    store.deleteNode('node_new');
    expect(store.getNodesCount).toBe(0);
  });
});
