import {
  type AutomaPackage,
  definePackage,
  type PackageIO,
  type WorkflowEdge,
  type WorkflowNode,
} from '@automa/types';
import { getBlockMeta, isExcludedInPackage } from './block-registry.js';

export function generateCanvasId(prefix = 'node'): string {
  const rand = Math.random().toString(36).substring(2, 9);
  return prefix ? `${prefix}-${rand}` : rand;
}

export interface AutoAlignOptions {
  startX?: number;
  startY?: number;
  rankSep?: number;
  nodeSep?: number;
}

/**
 * Deterministic Left-to-Right (LR) layered DAG layout (Dagre-equivalent)
 * Assigns `{ x, y }` coordinates to every node based on topological rank.
 */
export function autoAlignNodes<T extends WorkflowNode>(
  nodes: T[],
  edges: WorkflowEdge[],
  options?: AutoAlignOptions,
): T[] {
  if (nodes.length === 0) return [];

  const startX = options?.startX ?? 80;
  const startY = options?.startY ?? 100;
  const rankSep = options?.rankSep ?? 280;
  const nodeSep = options?.nodeSep ?? 120;

  const nodeMap = new Map<string, T>();
  const inDegree = new Map<string, number>();
  const adj = new Map<string, string[]>();

  for (const node of nodes) {
    nodeMap.set(node.id, node);
    inDegree.set(node.id, 0);
    adj.set(node.id, []);
  }

  for (const edge of edges) {
    if (
      nodeMap.has(edge.source) &&
      nodeMap.has(edge.target) &&
      edge.source !== edge.target
    ) {
      adj.get(edge.source)?.push(edge.target);
      inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
    }
  }

  const ranks = new Map<string, number>();
  const queue: string[] = [];

  for (const node of nodes) {
    if (node.label === 'trigger' || (inDegree.get(node.id) ?? 0) === 0) {
      ranks.set(node.id, 0);
      queue.push(node.id);
    }
  }

  if (queue.length === 0 && nodes[0]) {
    ranks.set(nodes[0].id, 0);
    queue.push(nodes[0].id);
  }

  const visitedEdges = new Set<string>();
  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const currentRank = ranks.get(currentId) ?? 0;
    const neighbors = adj.get(currentId) ?? [];

    for (const nextId of neighbors) {
      const edgeKey = `${currentId}->${nextId}`;
      if (visitedEdges.has(edgeKey)) continue;
      visitedEdges.add(edgeKey);

      const nextRank = Math.max(ranks.get(nextId) ?? 0, currentRank + 1);
      if ( nextRank <= nodes.length) {
        ranks.set(nextId, nextRank);
        queue.push(nextId);
      }
    }
  }

  const columns = new Map<number, T[]>();
  for (const node of nodes) {
    const rank = ranks.get(node.id) ?? 0;
    const list = columns.get(rank) ?? [];
    list.push(node);
    columns.set(rank, list);
  }

  const sortedRanks = Array.from(columns.keys()).sort((a, b) => a - b);
  const updatedById = new Map<string, T>();

  sortedRanks.forEach((rank, colIndex) => {
    const colNodes = columns.get(rank) ?? [];
    colNodes.forEach((node, rowIndex) => {
      updatedById.set(node.id, {
        ...node,
        position: {
          x: startX + colIndex * rankSep,
          y: startY + rowIndex * nodeSep,
        },
      });
    });
  });

  return nodes.map((n) => updatedById.get(n.id) ?? n);
}

/**
 * Clones a subgraph of nodes and edges with brand-new IDs and remapped handles.
 * Used for Duplicate, Copy/Paste, and Inline Package Unpacking (`asBlock === false`).
 */
export function copyCanvasElements(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[],
  anchorPosition?: { x: number; y: number },
): { nodes: WorkflowNode[]; edges: WorkflowEdge[] } {
  const idMap = new Map<string, string>();
  const minX =
    nodes.length > 0
      ? Math.min(...nodes.map((n) => n.position?.x ?? 0))
      : 0;
  const minY =
    nodes.length > 0
      ? Math.min(...nodes.map((n) => n.position?.y ?? 0))
      : 0;

  const clonedNodes: WorkflowNode[] = nodes.map((node, idx) => {
    const newId = generateCanvasId(node.label || 'node');
    idMap.set(node.id, newId);

    const origX = node.position?.x ?? idx * 240;
    const origY = node.position?.y ?? 120;
    const position = anchorPosition
      ? {
          x: anchorPosition.x + (origX - minX),
          y: anchorPosition.y + (origY - minY),
        }
      : {
          x: origX + 40,
          y: origY + 40,
        };

    const meta = getBlockMeta(node.label);
    return {
      ...structuredClone(node),
      id: newId,
      type: node.type || meta.component,
      position,
    };
  });

  const clonedEdges: WorkflowEdge[] = [];
  for (const edge of edges) {
    const newSource = idMap.get(edge.source);
    const newTarget = idMap.get(edge.target);
    if (!newSource || !newTarget) continue;

    const sourceHandle = edge.sourceHandle
      ? edge.sourceHandle.replace(edge.source, newSource)
      : `${newSource}-output-1`;
    const targetHandle = edge.targetHandle
      ? edge.targetHandle.replace(edge.target, newTarget)
      : `${newTarget}-input-1`;

    clonedEdges.push({
      id: generateCanvasId('edge'),
      source: newSource,
      target: newTarget,
      sourceHandle,
      targetHandle,
    });
  }

  return { nodes: clonedNodes, edges: clonedEdges };
}

/**
 * Drops an `AutomaPackage` onto a Workflow Canvas.
 * Matches Official Automa (`workflows/[id].vue` `onDropInEditor`):
 * - `pkg.settings.asBlock !== false`: inserts a single `block-package` node.
 * - `pkg.settings.asBlock === false`: unpacks `pkg.data.nodes` and `pkg.data.edges` inline.
 */
export function dropPackageIntoWorkflow(
  pkg: AutomaPackage,
  position: { x: number; y: number },
): { nodes: WorkflowNode[]; edges: WorkflowEdge[] } {
  const asBlock = pkg.settings?.asBlock ?? true;
  if (asBlock) {
    const nodeId = generateCanvasId('pkg');
    const pkgCopy = structuredClone(pkg);
    return {
      nodes: [
        {
          id: nodeId,
          label: 'block-package',
          type: 'BlockPackage',
          position,
          data: {
            ...pkgCopy,
            packageId: pkgCopy.id,
            packageName: pkgCopy.name,
          },
        },
      ],
      edges: [],
    };
  }

  return copyCanvasElements(
    (pkg.data?.nodes as WorkflowNode[]) || [],
    pkg.data?.edges || [],
    position,
  );
}

/**
 * Reconciles a `block-package` node with an updated `AutomaPackage` definition.
 * Matches Official Automa (`BlockPackage.vue` `updatePackage()`):
 * Prunes edges attached to removed `inputs` or `outputs` handles and updates `node.data`.
 */
export function reconcilePackageNodeUpdate(
  pkgNode: WorkflowNode,
  latestPkg: AutomaPackage,
  edges: WorkflowEdge[],
): { updatedNode: WorkflowNode; remainingEdges: WorkflowEdge[] } {
  const validInputIds = new Set((latestPkg.inputs || []).map((i) => i.id));
  const validOutputIds = new Set((latestPkg.outputs || []).map((o) => o.id));

  const remainingEdges = edges.filter((edge) => {
    if (edge.target === pkgNode.id && edge.targetHandle) {
      const inputId = edge.targetHandle.split('-input-')[1];
      if (inputId && !validInputIds.has(inputId)) {
        return false;
      }
    }
    if (edge.source === pkgNode.id && edge.sourceHandle) {
      const outputId = edge.sourceHandle.split('-output-')[1];
      if (outputId && !validOutputIds.has(outputId)) {
        return false;
      }
    }
    return true;
  });

  const pkgClone = structuredClone(latestPkg);
  const updatedNode: WorkflowNode = {
    ...pkgNode,
    data: {
      ...pkgNode.data,
      ...pkgClone,
      packageId: pkgClone.id,
      packageName: pkgClone.name,
    },
  };

  return { updatedNode, remainingEdges };
}

/**
 * Adds an Input or Output handle mapping to an `AutomaPackage`.
 * Matches Official Automa (`workflows/[id].vue` `addPackageIO`).
 */
export function addPackageIOHandle(
  pkg: AutomaPackage,
  type: 'inputs' | 'outputs',
  payload: { blockId: string; handleId: string; name?: string },
): { updatedPackage: AutomaPackage; added: boolean } {
  const list: PackageIO[] = structuredClone(pkg[type] || []);
  const exists = list.some(
    (io) =>
      io.blockId === payload.blockId && io.handleId === payload.handleId,
  );
  if (exists) {
    return { updatedPackage: pkg, added: false };
  }

  const index = list.length + 1;
  list.push({
    id: generateCanvasId(type === 'inputs' ? 'in' : 'out'),
    name:
      payload.name ||
      (type === 'inputs' ? `Input ${index}` : `Output ${index}`),
    blockId: payload.blockId,
    handleId: payload.handleId,
  });

  return {
    updatedPackage: {
      ...pkg,
      [type]: list,
      updatedAt: Date.now(),
    },
    added: true,
  };
}

/**
 * Extracts selected canvas nodes and their interconnecting edges into a new `AutomaPackage`.
 * Matches Official Automa (`workflows/[id].vue` `saveBlockToFolder`).
 */
export function extractPackageFromSelection(
  selectedNodes: WorkflowNode[],
  allEdges: WorkflowEdge[],
  meta: {
    name: string;
    description?: string;
    icon?: string;
    asBlock?: boolean;
  },
): AutomaPackage {
  const validNodes = selectedNodes
    .filter((n) => !isExcludedInPackage(n.label))
    .map((n) => structuredClone(n));
  const nodeIds = new Set(validNodes.map((n) => n.id));

  const internalEdges = allEdges
    .filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))
    .map((e) => structuredClone(e));

  // Automatically infer default first input & last output if not empty
  const targetNodeIds = new Set(internalEdges.map((e) => e.target));
  const sourceNodeIds = new Set(internalEdges.map((e) => e.source));

  const entryNode =
    validNodes.find((n) => !targetNodeIds.has(n.id)) ?? validNodes[0];
  const exitNode =
    [...validNodes].reverse().find((n) => !sourceNodeIds.has(n.id)) ??
    validNodes[validNodes.length - 1];

  const inputs: PackageIO[] = entryNode
    ? [
        {
          id: generateCanvasId('in'),
          name: 'Input 1',
          blockId: entryNode.id,
          handleId: `${entryNode.id}-input-1`,
        },
      ]
    : [];

  const outputs: PackageIO[] = exitNode
    ? [
        {
          id: generateCanvasId('out'),
          name: 'Output 1',
          blockId: exitNode.id,
          handleId: `${exitNode.id}-output-1`,
        },
      ]
    : [];

  return definePackage({
    name: meta.name || 'Unnamed Package',
    description: meta.description || '',
    icon: meta.icon || 'mdiPackageVariantClosed',
    asBlock: meta.asBlock ?? true,
    inputs,
    outputs,
    nodes: validNodes,
    edges: internalEdges,
  });
}
