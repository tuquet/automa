import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref } from 'vue';
import { GraphLayoutService } from '../../src/services/graphLayout.service';
import { useStudioCanvas } from '../../src/studio/composables/useStudioCanvas';
import { useStudioStore } from '../../src/studio/stores/useStudioStore';

vi.mock('vue-toastification', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

describe('GraphLayoutService', () => {
  it('computes dagre layout and returns position changes in LR order', () => {
    const nodes = [
      { id: 'node_1', label: 'trigger', dimensions: { width: 180, height: 80 } },
      { id: 'node_2', label: 'click-element', dimensions: { width: 180, height: 80 } },
    ];
    const edges = [
      { id: 'e1-2', source: 'node_1', target: 'node_2' },
    ];

    const changes = GraphLayoutService.computeDagreLayout(nodes, edges, {
      rankdir: 'LR',
      ranksep: 100,
      nodesep: 50,
    });

    expect(changes).toHaveLength(2);
    const node1Change = changes.find((c) => c.id === 'node_1');
    const node2Change = changes.find((c) => c.id === 'node_2');

    expect(node1Change).toBeDefined();
    expect(node2Change).toBeDefined();
    expect(node1Change.type).toBe('position');
    expect(node1Change.dragging).toBe(false);
    // In LR direction, node_1 should be to the left of node_2
    expect(node1Change.position.x).toBeLessThan(node2Change.position.x);
  });

  it('supports option aliases direction, rankSpacing, nodeSpacing', () => {
    const nodes = [
      { id: 'node_a', label: 'trigger' },
      { id: 'node_b', label: 'delay' },
    ];
    const edges = [{ source: 'node_a', target: 'node_b' }];

    const changes = GraphLayoutService.computeDagreLayout(nodes, edges, {
      direction: 'TB',
      rankSpacing: 120,
      nodeSpacing: 60,
    });

    expect(changes).toHaveLength(2);
    const nodeA = changes.find((c) => c.id === 'node_a');
    const nodeB = changes.find((c) => c.id === 'node_b');
    // In TB direction, node_a should be above node_b
    expect(nodeA.position.y).toBeLessThan(nodeB.position.y);
  });

  it('gracefully handles missing or disconnected edge endpoints', () => {
    const nodes = [{ id: 'node_x', label: 'trigger' }];
    const edges = [{ source: 'node_x', target: 'node_non_existent' }];

    const changes = GraphLayoutService.computeDagreLayout(nodes, edges);
    expect(changes).toHaveLength(1);
    expect(changes[0].id).toBe('node_x');
  });

  it('layoutWorkflow returns updated nodes and nodeChanges', () => {
    const nodes = [
      { id: 'n1', label: 'trigger', position: { x: 0, y: 0 } },
      { id: 'n2', label: 'log-data', position: { x: 0, y: 0 } },
    ];
    const edges = [{ source: 'n1', target: 'n2' }];

    const result = GraphLayoutService.layoutWorkflow(nodes, edges);
    expect(result.nodes).toHaveLength(2);
    expect(result.nodeChanges).toHaveLength(2);
    expect(result.edges).toEqual(edges);
    expect(result.nodes[0].position.x).toBeDefined();
    expect(result.nodes[1].position.x).toBeGreaterThan(result.nodes[0].position.x);
  });
});

describe('useStudioCanvas autoAlign', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('performs autoAlign, applies node changes, updates store, and fits view', async () => {
    const store = useStudioStore();
    store.setWorkflow({
      id: 'wf-1',
      name: 'Test Workflow',
      drawflow: {
        nodes: [
          { id: 'node-1', label: 'trigger', position: { x: 500, y: 500 } },
          { id: 'node-2', label: 'delay', position: { x: 100, y: 100 } },
        ],
        edges: [
          { id: 'e1', source: 'node-1', target: 'node-2' },
        ],
      },
    });

    const mockApplyNodeChanges = vi.fn();
    const mockFitView = vi.fn();
    const animateState = { active: false };

    const { onEditorInit, autoAlign } = useStudioCanvas({
      commandManager: null,
      setAnimateBlocks: (val) => {
        animateState.active = val;
      },
    });

    const mockEditor = {
      getNodes: ref(store.currentWorkflow.drawflow.nodes),
      getEdges: ref(store.currentWorkflow.drawflow.edges),
      applyNodeChanges: mockApplyNodeChanges,
      fitView: mockFitView,
    };

    onEditorInit(mockEditor);
    await autoAlign();

    expect(mockApplyNodeChanges).toHaveBeenCalled();
    const appliedChanges = mockApplyNodeChanges.mock.calls[0][0];
    expect(appliedChanges).toHaveLength(2);

    // Verify store nodes positions were updated
    const updatedNode1 = store.getNode('node-1');
    const updatedNode2 = store.getNode('node-2');
    expect(updatedNode1.position.x).toBeLessThan(updatedNode2.position.x);
    expect(store.isDirty).toBe(true);

    // Verify fitView was called
    expect(mockFitView).toHaveBeenCalledWith(
      expect.objectContaining({ padding: 0.2, duration: 400 })
    );
  });
});
