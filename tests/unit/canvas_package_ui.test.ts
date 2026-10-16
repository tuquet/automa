import { describe, expect, it } from 'vitest';
import { definePackage } from '../../packages/types/src/workflow.js';
import {
  getBlockMeta,
  getBlocksByCategory,
  isExcludedInPackage,
} from '../../packages/ui/src/utils/block-registry.js';
import {
  addPackageIOHandle,
  autoAlignNodes,
  copyCanvasElements,
  dropPackageIntoWorkflow,
  extractPackageFromSelection,
  reconcilePackageNodeUpdate,
} from '../../packages/ui/src/utils/canvas-helpers.js';

describe('@automa/ui Shadcn-Vue Canvas & Official Package Helpers', () => {
  it('1. Filters excluded blocks (trigger, block-package, execute-workflow) when in Package Canvas mode', () => {
    expect(isExcludedInPackage('trigger')).toBe(true);
    expect(isExcludedInPackage('block-package')).toBe(true);
    expect(isExcludedInPackage('execute-workflow')).toBe(true);
    expect(isExcludedInPackage('event-click')).toBe(false);

    const wfGrouped = getBlocksByCategory({ isPackage: false });
    const pkgGrouped = getBlocksByCategory({ isPackage: true });

    expect(wfGrouped.general.some((b) => b.id === 'trigger')).toBe(true);
    expect(pkgGrouped.general.some((b) => b.id === 'trigger')).toBe(false);
    expect(getBlockMeta('conditions').component).toBe('BlockConditions');
  });

  it('2. Auto-aligns DAG nodes Left-to-Right (Dagre-equivalent topological ranks)', () => {
    const nodes = [
      { id: 'n3', label: 'event-click', data: {}, position: { x: 0, y: 0 } },
      { id: 'n1', label: 'trigger', data: {}, position: { x: 500, y: 500 } },
      { id: 'n2', label: 'new-tab', data: {}, position: { x: 10, y: 10 } },
    ];
    const edges = [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
    ];

    const aligned = autoAlignNodes(nodes, edges);
    const pos1 = aligned.find((n) => n.id === 'n1')!.position!;
    const pos2 = aligned.find((n) => n.id === 'n2')!.position!;
    const pos3 = aligned.find((n) => n.id === 'n3')!.position!;

    expect(pos1.x).toBeLessThan(pos2.x);
    expect(pos2.x).toBeLessThan(pos3.x);
  });

  it('3. Drops Package into Workflow as atomic BlockPackage when asBlock=true and unpacks inline when asBlock=false', () => {
    const pkgAtomic = definePackage({
      id: 'pkg_atomic',
      name: 'Atomic Package',
      asBlock: true,
      nodes: [
        { id: 's1', label: 'new-tab', data: { url: 'https://a.com' } },
        { id: 's2', label: 'event-click', data: { selector: '#btn' } },
      ],
      edges: [{ id: 'se1', source: 's1', target: 's2' }],
    });

    const atomicDrop = dropPackageIntoWorkflow(pkgAtomic, { x: 300, y: 200 });
    expect(atomicDrop.nodes).toHaveLength(1);
    expect(atomicDrop.nodes[0]?.label).toBe('block-package');
    expect(atomicDrop.nodes[0]?.type).toBe('BlockPackage');
    expect(atomicDrop.edges).toHaveLength(0);

    const pkgInline = definePackage({
      id: 'pkg_inline',
      name: 'Inline Macro Package',
      asBlock: false,
      nodes: [
        { id: 's1', label: 'new-tab', data: { url: 'https://a.com' } },
        { id: 's2', label: 'event-click', data: { selector: '#btn' } },
      ],
      edges: [{ id: 'se1', source: 's1', target: 's2' }],
    });

    const inlineDrop = dropPackageIntoWorkflow(pkgInline, { x: 300, y: 200 });
    expect(inlineDrop.nodes).toHaveLength(2);
    expect(inlineDrop.nodes[0]?.id).not.toBe('s1');
    expect(inlineDrop.edges).toHaveLength(1);
    expect(inlineDrop.edges[0]?.source).toBe(inlineDrop.nodes[0]?.id);
    expect(inlineDrop.edges[0]?.target).toBe(inlineDrop.nodes[1]?.id);
  });

  it('4. Reconciles BlockPackage node update and prunes orphaned handle edges (Official BlockPackage.vue updatePackage)', () => {
    const initialPkg = definePackage({
      id: 'pkg_sync',
      name: 'Syncable Package',
      inputs: [
        { id: 'in_keep', name: 'Keep In', blockId: 'b1', handleId: 'b1-input-1' },
        { id: 'in_drop', name: 'Drop In', blockId: 'b1', handleId: 'b1-input-1' },
      ],
      outputs: [
        { id: 'out_keep', name: 'Keep Out', blockId: 'b1', handleId: 'b1-output-1' },
        { id: 'out_drop', name: 'Drop Out', blockId: 'b1', handleId: 'b1-output-fallback' },
      ],
      nodes: [{ id: 'b1', label: 'element-exists', data: { selector: '#ok' } }],
    });

    const pkgNode = dropPackageIntoWorkflow(initialPkg, { x: 100, y: 100 }).nodes[0]!;
    const workflowEdges = [
      {
        id: 'e_in_keep',
        source: 'trig',
        target: pkgNode.id,
        sourceHandle: 'trig-output-1',
        targetHandle: `${pkgNode.id}-input-in_keep`,
      },
      {
        id: 'e_in_drop',
        source: 'trig',
        target: pkgNode.id,
        sourceHandle: 'trig-output-1',
        targetHandle: `${pkgNode.id}-input-in_drop`,
      },
      {
        id: 'e_out_keep',
        source: pkgNode.id,
        target: 'next_ok',
        sourceHandle: `${pkgNode.id}-output-out_keep`,
        targetHandle: 'next_ok-input-1',
      },
      {
        id: 'e_out_drop',
        source: pkgNode.id,
        target: 'next_err',
        sourceHandle: `${pkgNode.id}-output-out_drop`,
        targetHandle: 'next_err-input-1',
      },
    ];

    const updatedPkg = {
      ...initialPkg,
      name: 'Syncable Package v2',
      inputs: [{ id: 'in_keep', name: 'Keep In', blockId: 'b1', handleId: 'b1-input-1' }],
      outputs: [{ id: 'out_keep', name: 'Keep Out', blockId: 'b1', handleId: 'b1-output-1' }],
      updatedAt: Date.now() + 1000,
    };

    const { updatedNode, remainingEdges } = reconcilePackageNodeUpdate(
      pkgNode,
      updatedPkg,
      workflowEdges,
    );

    expect(updatedNode.data.name).toBe('Syncable Package v2');
    expect(remainingEdges.map((e) => e.id)).toEqual(['e_in_keep', 'e_out_keep']);
  });

  it('5. Adds Package I/O handles without duplicates and extracts selection to a new AutomaPackage', () => {
    const selectedNodes = [
      { id: 't1', label: 'trigger', data: {} },
      { id: 'c1', label: 'new-tab', data: { url: 'https://tuquet.com' } },
      { id: 'c2', label: 'event-click', data: { selector: '#login' } },
    ];
    const allEdges = [
      { id: 'e0', source: 't1', target: 'c1' },
      { id: 'e1', source: 'c1', target: 'c2' },
    ];

    const pkg = extractPackageFromSelection(selectedNodes, allEdges, {
      name: 'Extracted Auth Flow',
      description: 'Created from canvas selection',
      asBlock: true,
    });

    // Trigger is excluded automatically
    expect(pkg.data.nodes.map((n) => n.id)).toEqual(['c1', 'c2']);
    expect(pkg.data.edges).toHaveLength(1);
    expect(pkg.inputs[0]?.blockId).toBe('c1');
    expect(pkg.outputs[0]?.blockId).toBe('c2');

    // Adding duplicate handleId for c1-input-1 is prevented
    const dupRes = addPackageIOHandle(pkg, 'inputs', {
      blockId: 'c1',
      handleId: 'c1-input-1',
    });
    expect(dupRes.added).toBe(false);

    // Adding a fallback output on c2 succeeds
    const addRes = addPackageIOHandle(pkg, 'outputs', {
      blockId: 'c2',
      handleId: 'c2-output-fallback',
      name: 'Fallback Exit',
    });
    expect(addRes.added).toBe(true);
    expect(addRes.updatedPackage.outputs).toHaveLength(2);

    // Copy elements generates distinct IDs
    const copied = copyCanvasElements(selectedNodes.slice(1), [allEdges[1]!]);
    expect(copied.nodes).toHaveLength(2);
    expect(copied.edges).toHaveLength(1);
  });
});
