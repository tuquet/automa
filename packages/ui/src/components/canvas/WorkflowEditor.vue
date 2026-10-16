<script setup lang="ts">
import type { AutomaPackage, WorkflowEdge, WorkflowNode } from '@automa/types';
import {
  AlignHorizontalDistributeCenter,
  Maximize2,
  Minus,
  Plus,
} from '@lucide/vue';
import { Button } from '@tuquet/vue-ui';
import { computed, type Component, reactive, ref } from 'vue';
import {
  getBlockMeta,
  isExcludedInPackage,
} from '../../utils/block-registry.js';
import {
  autoAlignNodes,
  copyCanvasElements,
  dropPackageIntoWorkflow,
  generateCanvasId,
  reconcilePackageNodeUpdate,
} from '../../utils/canvas-helpers.js';
import BlockBasic from './blocks/BlockBasic.vue';
import BlockBasicWithFallback from './blocks/BlockBasicWithFallback.vue';
import BlockConditions from './blocks/BlockConditions.vue';
import BlockDelay from './blocks/BlockDelay.vue';
import BlockElementExists from './blocks/BlockElementExists.vue';
import BlockGroup from './blocks/BlockGroup.vue';
import BlockLoopBreakpoint from './blocks/BlockLoopBreakpoint.vue';
import BlockNote from './blocks/BlockNote.vue';
import BlockPackage from './blocks/BlockPackage.vue';
import BlockRepeatTask from './blocks/BlockRepeatTask.vue';
import EditorAddPackageDialog from './editor/EditorAddPackageDialog.vue';
import EditorCtxMenu from './editor/EditorCtxMenu.vue';
import EditorSearchBlocks from './editor/EditorSearchBlocks.vue';

const props = withDefaults(
  defineProps<{
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
    packages?: AutomaPackage[];
    isPackageCanvas?: boolean;
    readonly?: boolean;
    activeNodeId?: string | null;
    minimap?: boolean;
  }>(),
  {
    packages: () => [],
    isPackageCanvas: false,
    readonly: false,
    activeNodeId: null,
    minimap: true,
  },
);

const emit = defineEmits<{
  (e: 'update:nodes', nodes: WorkflowNode[]): void;
  (e: 'update:edges', edges: WorkflowEdge[]): void;
  (e: 'edit-node', node: WorkflowNode): void;
  (e: 'settings-node', node: WorkflowNode): void;
  (e: 'run-from-block', nodeId: string): void;
  (e: 'open-package', pkgId: string): void;
  (
    e: 'save-as-package',
    payload: {
      nodes: WorkflowNode[];
      edges: WorkflowEdge[];
      name: string;
      description: string;
      asBlock: boolean;
    },
  ): void;
  (
    e: 'set-package-io',
    payload: {
      ioType: 'inputs' | 'outputs';
      nodeId: string;
      handleId: string;
    },
  ): void;
}>();

const NODE_COMPONENTS: Record<string, Component> = {
  BlockBasic,
  BlockBasicWithFallback,
  BlockConditions,
  BlockDelay,
  BlockElementExists,
  BlockGroup,
  BlockLoopBreakpoint,
  BlockNote,
  BlockPackage,
  BlockRepeatTask,
};

const containerRef = ref<HTMLElement | null>(null);
const viewport = reactive({
  x: 60,
  y: 60,
  zoom: 1,
});

const selectedIds = ref<Set<string>>(new Set());
const isPanning = ref(false);
const panStart = reactive({ x: 0, y: 0, origX: 0, origY: 0 });

const draggingNode = reactive<{
  id: string | null;
  startX: number;
  startY: number;
  origX: number;
  origY: number;
}>({
  id: null,
  startX: 0,
  startY: 0,
  origX: 0,
  origY: 0,
});

const activeConnection = reactive<{
  sourceNodeId: string | null;
  sourceHandleId: string | null;
  mouseX: number;
  mouseY: number;
}>({
  sourceNodeId: null,
  sourceHandleId: null,
  mouseX: 0,
  mouseY: 0,
});

const ctxMenu = reactive<{
  visible: boolean;
  x: number;
  y: number;
  targetNodeId: string | null;
  targetHandle: {
    nodeId: string;
    handleId: string;
    type: 'source' | 'target';
  } | null;
}>({
  visible: false,
  x: 0,
  y: 0,
  targetNodeId: null,
  targetHandle: null,
});

const showSavePkgDialog = ref(false);

const selectedNodes = computed(() =>
  props.nodes.filter((n) => selectedIds.value.has(n.id)),
);

const canUngroupSelected = computed(
  () =>
    selectedNodes.value.length === 1 &&
    selectedNodes.value[0]?.label === 'blocks-group',
);

function resolveNodeComponent(node: WorkflowNode): Component {
  if (node.type && NODE_COMPONENTS[node.type]) {
    return NODE_COMPONENTS[node.type]!;
  }
  const meta = getBlockMeta(node.label);
  return NODE_COMPONENTS[meta.component] ?? BlockBasic;
}

function hasPackageUpdate(node: WorkflowNode): boolean {
  if (node.label !== 'block-package') return false;
  const pkgId =
    (node.data?.id as string) || (node.data?.packageId as string) || '';
  if (!pkgId) return false;
  const latest = props.packages.find((p) => p.id === pkgId);
  if (!latest) return false;
  return (
    (latest.updatedAt ?? 0) > ((node.data?.updatedAt as number) ?? 0) ||
    (latest.inputs?.length ?? 0) !==
      ((node.data?.inputs as unknown[])?.length ?? 0) ||
    (latest.outputs?.length ?? 0) !==
      ((node.data?.outputs as unknown[])?.length ?? 0)
  );
}

function syncPackageNode(node: WorkflowNode) {
  const pkgId =
    (node.data?.id as string) || (node.data?.packageId as string) || '';
  const latest = props.packages.find((p) => p.id === pkgId);
  if (!latest) return;

  const { updatedNode, remainingEdges } = reconcilePackageNodeUpdate(
    node,
    latest,
    props.edges,
  );
  emit(
    'update:nodes',
    props.nodes.map((n) => (n.id === node.id ? updatedNode : n)),
  );
  emit('update:edges', remainingEdges);
}

function screenToCanvas(clientX: number, clientY: number) {
  const rect = containerRef.value?.getBoundingClientRect();
  const relX = clientX - (rect?.left ?? 0);
  const relY = clientY - (rect?.top ?? 0);
  return {
    x: Math.round((relX - viewport.x) / viewport.zoom),
    y: Math.round((relY - viewport.y) / viewport.zoom),
  };
}

function getNodeCenterPosition(
  nodeId: string,
  side: 'left' | 'right',
  handleId?: string,
) {
  const node = props.nodes.find((n) => n.id === nodeId);
  if (!node) return { x: 0, y: 0 };
  const baseX = node.position?.x ?? 0;
  const baseY = node.position?.y ?? 0;
  const width = node.label === 'block-package' ? 256 : 240;

  let offsetY = 58;
  if (handleId?.includes('fallback') || handleId?.includes('repeat')) {
    offsetY = 92;
  } else if (node.label === 'block-package' && handleId) {
    const list =
      side === 'left'
        ? ((node.data?.inputs as Array<{ id: string }>) ?? [])
        : ((node.data?.outputs as Array<{ id: string }>) ?? []);
    const suffix = handleId.split(side === 'left' ? '-input-' : '-output-')[1];
    const idx = list.findIndex((item) => item.id === suffix);
    if (idx > 0) {
      offsetY = 74 + idx * 24;
    } else {
      offsetY = 74;
    }
  }

  return {
    x: side === 'left' ? baseX : baseX + width,
    y: baseY + offsetY,
  };
}

function buildBezierPath(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): string {
  const dx = Math.max(Math.abs(x2 - x1) * 0.5, 60);
  return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
}

const renderedEdges = computed(() =>
  props.edges.map((edge) => {
    const start = getNodeCenterPosition(edge.source, 'right', edge.sourceHandle);
    const end = getNodeCenterPosition(edge.target, 'left', edge.targetHandle);
    return {
      edge,
      path: buildBezierPath(start.x, start.y, end.x, end.y),
      midX: (start.x + end.x) / 2,
      midY: (start.y + end.y) / 2,
      isFallback: Boolean(edge.sourceHandle?.includes('fallback')),
    };
  }),
);

const draftEdgePath = computed(() => {
  if (!activeConnection.sourceNodeId) return '';
  const start = getNodeCenterPosition(
    activeConnection.sourceNodeId,
    'right',
    activeConnection.sourceHandleId ?? undefined,
  );
  return buildBezierPath(
    start.x,
    start.y,
    activeConnection.mouseX,
    activeConnection.mouseY,
  );
});

function onCanvasMouseDown(event: MouseEvent) {
  if (event.button !== 0) return;
  ctxMenu.visible = false;
  if (!event.ctrlKey && !event.metaKey) {
    selectedIds.value = new Set();
  }
  isPanning.value = true;
  panStart.x = event.clientX;
  panStart.y = event.clientY;
  panStart.origX = viewport.x;
  panStart.origY = viewport.y;
}

function onNodeMouseDown(event: MouseEvent, node: WorkflowNode) {
  if (event.button !== 0) return;
  event.stopPropagation();
  ctxMenu.visible = false;

  if (event.ctrlKey || event.metaKey) {
    const next = new Set(selectedIds.value);
    if (next.has(node.id)) next.delete(node.id);
    else next.add(node.id);
    selectedIds.value = next;
  } else if (!selectedIds.value.has(node.id)) {
    selectedIds.value = new Set([node.id]);
  }

  if (props.readonly) return;
  draggingNode.id = node.id;
  draggingNode.startX = event.clientX;
  draggingNode.startY = event.clientY;
  draggingNode.origX = node.position?.x ?? 0;
  draggingNode.origY = node.position?.y ?? 0;
}

function onCanvasMouseMove(event: MouseEvent) {
  if (isPanning.value) {
    viewport.x = panStart.origX + (event.clientX - panStart.x);
    viewport.y = panStart.origY + (event.clientY - panStart.y);
    return;
  }

  if (draggingNode.id && !props.readonly) {
    const dx = Math.round((event.clientX - draggingNode.startX) / viewport.zoom);
    const dy = Math.round((event.clientY - draggingNode.startY) / viewport.zoom);
    const updated = props.nodes.map((n) =>
      n.id === draggingNode.id
        ? {
            ...n,
            position: {
              x: draggingNode.origX + dx,
              y: draggingNode.origY + dy,
            },
          }
        : n,
    );
    emit('update:nodes', updated);
    return;
  }

  if (activeConnection.sourceNodeId) {
    const pt = screenToCanvas(event.clientX, event.clientY);
    activeConnection.mouseX = pt.x;
    activeConnection.mouseY = pt.y;
  }
}

function onCanvasMouseUp() {
  isPanning.value = false;
  draggingNode.id = null;
  activeConnection.sourceNodeId = null;
  activeConnection.sourceHandleId = null;
}

function onWheel(event: WheelEvent) {
  event.preventDefault();
  const delta = event.deltaY < 0 ? 0.1 : -0.1;
  const next = Math.min(1.6, Math.max(0.4, Number((viewport.zoom + delta).toFixed(2))));
  viewport.zoom = next;
}

function onStartConnect(payload: {
  nodeId: string;
  handleId: string;
  type: 'source' | 'target';
}) {
  if (props.readonly || payload.type !== 'source') return;
  const start = getNodeCenterPosition(payload.nodeId, 'right', payload.handleId);
  activeConnection.sourceNodeId = payload.nodeId;
  activeConnection.sourceHandleId = payload.handleId;
  activeConnection.mouseX = start.x;
  activeConnection.mouseY = start.y;
}

function onEndConnect(payload: {
  nodeId: string;
  handleId: string;
  type: 'source' | 'target';
}) {
  if (
    props.readonly ||
    !activeConnection.sourceNodeId ||
    !activeConnection.sourceHandleId
  ) {
    return;
  }
  if (
    payload.type === 'target' &&
    payload.nodeId !== activeConnection.sourceNodeId
  ) {
    const exists = props.edges.some(
      (e) =>
        e.source === activeConnection.sourceNodeId &&
        e.target === payload.nodeId &&
        e.sourceHandle === activeConnection.sourceHandleId &&
        e.targetHandle === payload.handleId,
    );
    if (!exists) {
      emit('update:edges', [
        ...props.edges,
        {
          id: generateCanvasId('edge'),
          source: activeConnection.sourceNodeId,
          target: payload.nodeId,
          sourceHandle: activeConnection.sourceHandleId,
          targetHandle: payload.handleId,
        },
      ]);
    }
  }
  activeConnection.sourceNodeId = null;
  activeConnection.sourceHandleId = null;
}

function removeEdge(edgeId: string) {
  if (props.readonly) return;
  emit(
    'update:edges',
    props.edges.filter((e) => e.id !== edgeId),
  );
}

function removeNode(nodeId: string) {
  if (props.readonly) return;
  emit(
    'update:nodes',
    props.nodes.filter((n) => n.id !== nodeId),
  );
  emit(
    'update:edges',
    props.edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
  );
  selectedIds.value.delete(nodeId);
}

function updateNodeData(nodeId: string, newData: Record<string, unknown>) {
  if (props.readonly) return;
  emit(
    'update:nodes',
    props.nodes.map((n) =>
      n.id === nodeId ? { ...n, data: { ...n.data, ...newData } } : n,
    ),
  );
}

function onDropInCanvas(event: DragEvent) {
  if (props.readonly || !event.dataTransfer) return;
  const position = screenToCanvas(event.clientX, event.clientY);

  // 1. Check for dropped Package (`savedBlocks`)
  const rawSavedPkg = event.dataTransfer.getData('savedBlocks');
  if (rawSavedPkg && !props.isPackageCanvas) {
    try {
      const pkg = JSON.parse(rawSavedPkg) as AutomaPackage;
      const dropped = dropPackageIntoWorkflow(pkg, position);
      emit('update:nodes', [...props.nodes, ...dropped.nodes]);
      if (dropped.edges.length > 0) {
        emit('update:edges', [...props.edges, ...dropped.edges]);
      }
      return;
    } catch {
      // Ignore malformed drop
    }
  }

  // 2. Check for standard block (`block`)
  const rawBlock = event.dataTransfer.getData('block');
  if (!rawBlock) return;
  try {
    const parsed = JSON.parse(rawBlock) as {
      id: string;
      component: string;
      data: Record<string, unknown>;
    };
    if (props.isPackageCanvas && isExcludedInPackage(parsed.id)) {
      return;
    }
    if (
      parsed.id === 'trigger' &&
      props.nodes.some((n) => n.label === 'trigger')
    ) {
      return;
    }
    const newNode: WorkflowNode = {
      id: generateCanvasId(parsed.id),
      label: parsed.id,
      type: parsed.component,
      position,
      data: structuredClone(parsed.data || {}),
    };
    emit('update:nodes', [...props.nodes, newNode]);
    selectedIds.value = new Set([newNode.id]);
  } catch {
    // Ignore malformed drop
  }
}

function onNodeContextMenu(event: MouseEvent, node: WorkflowNode) {
  event.preventDefault();
  event.stopPropagation();
  if (!selectedIds.value.has(node.id)) {
    selectedIds.value = new Set([node.id]);
  }
  ctxMenu.visible = true;
  ctxMenu.x = event.clientX;
  ctxMenu.y = event.clientY;
  ctxMenu.targetNodeId = node.id;
  ctxMenu.targetHandle = null;
}

function onHandleContextMenu(payload: {
  event: MouseEvent;
  nodeId: string;
  handleId: string;
  type: 'source' | 'target';
}) {
  ctxMenu.visible = true;
  ctxMenu.x = payload.event.clientX;
  ctxMenu.y = payload.event.clientY;
  ctxMenu.targetNodeId = payload.nodeId;
  ctxMenu.targetHandle = {
    nodeId: payload.nodeId,
    handleId: payload.handleId,
    type: payload.type,
  };
}

function duplicateSelected() {
  if (selectedNodes.value.length === 0) return;
  const selSet = selectedIds.value;
  const internalEdges = props.edges.filter(
    (e) => selSet.has(e.source) && selSet.has(e.target),
  );
  const copied = copyCanvasElements(selectedNodes.value, internalEdges);
  emit('update:nodes', [...props.nodes, ...copied.nodes]);
  emit('update:edges', [...props.edges, ...copied.edges]);
  selectedIds.value = new Set(copied.nodes.map((n) => n.id));
}

function deleteSelected() {
  if (selectedIds.value.size === 0) return;
  const sel = selectedIds.value;
  emit(
    'update:nodes',
    props.nodes.filter((n) => !sel.has(n.id)),
  );
  emit(
    'update:edges',
    props.edges.filter((e) => !sel.has(e.source) && !sel.has(e.target)),
  );
  selectedIds.value = new Set();
}

function groupSelectedBlocks() {
  const groupable = selectedNodes.value.filter(
    (n) =>
      !['trigger', 'block-package', 'blocks-group', 'conditions'].includes(
        n.label,
      ),
  );
  if (groupable.length < 2) return;
  const removeSet = new Set(groupable.map((n) => n.id));
  const anchor = groupable[0]?.position ?? { x: 200, y: 160 };

  const groupNode: WorkflowNode = {
    id: generateCanvasId('group'),
    label: 'blocks-group',
    type: 'BlockGroup',
    position: { ...anchor },
    data: {
      name: `Group (${groupable.length})`,
      blocks: groupable.map((n) => ({
        id: n.label,
        itemId: n.id,
        data: structuredClone(n.data),
      })),
    },
  };

  emit(
    'update:nodes',
    [...props.nodes.filter((n) => !removeSet.has(n.id)), groupNode],
  );
  emit(
    'update:edges',
    props.edges.filter(
      (e) => !removeSet.has(e.source) && !removeSet.has(e.target),
    ),
  );
  selectedIds.value = new Set([groupNode.id]);
}

function ungroupSelectedBlock() {
  const groupNode = selectedNodes.value[0];
  if (!groupNode || groupNode.label !== 'blocks-group') return;
  const items =
    (groupNode.data?.blocks as Array<{
      id: string;
      itemId: string;
      data: Record<string, unknown>;
    }>) || [];
  if (items.length === 0) return;

  const basePos = groupNode.position ?? { x: 200, y: 160 };
  const unpackedNodes: WorkflowNode[] = [];
  const unpackedEdges: WorkflowEdge[] = [];

  items.forEach((item, index) => {
    const meta = getBlockMeta(item.id);
    const nodeId = item.itemId || generateCanvasId(item.id);
    unpackedNodes.push({
      id: nodeId,
      label: item.id,
      type: meta.component,
      position: {
        x: basePos.x + index * 260,
        y: basePos.y,
      },
      data: structuredClone(item.data || {}),
    });
    const nextItem = items[index + 1];
    if (nextItem) {
      const nextId = nextItem.itemId || generateCanvasId(nextItem.id);
      unpackedEdges.push({
        id: generateCanvasId('edge'),
        source: nodeId,
        target: nextId,
        sourceHandle: `${nodeId}-output-1`,
        targetHandle: `${nextId}-input-1`,
      });
    }
  });

  emit(
    'update:nodes',
    [...props.nodes.filter((n) => n.id !== groupNode.id), ...unpackedNodes],
  );
  emit('update:edges', [
    ...props.edges.filter(
      (e) => e.source !== groupNode.id && e.target !== groupNode.id,
    ),
    ...unpackedEdges,
  ]);
}

function handleAutoAlign() {
  const aligned = autoAlignNodes(props.nodes, props.edges);
  emit('update:nodes', aligned);
  fitView();
}

function fitView() {
  viewport.x = 60;
  viewport.y = 60;
  viewport.zoom = 1;
}

function focusNode(nodeId: string) {
  const target = props.nodes.find((n) => n.id === nodeId);
  if (!target) return;
  selectedIds.value = new Set([nodeId]);
  const rect = containerRef.value?.getBoundingClientRect();
  const centerX = (rect?.width ?? 900) / 2;
  const centerY = (rect?.height ?? 600) / 2;
  viewport.zoom = 1;
  viewport.x = Math.round(centerX - (target.position?.x ?? 0) - 120);
  viewport.y = Math.round(centerY - (target.position?.y ?? 0) - 60);
}

function confirmSavePackage(meta: {
  name: string;
  description: string;
  asBlock: boolean;
}) {
  const sel = selectedIds.value;
  const internalEdges = props.edges.filter(
    (e) => sel.has(e.source) && sel.has(e.target),
  );
  emit('save-as-package', {
    nodes: selectedNodes.value,
    edges: internalEdges,
    ...meta,
  });
}

defineExpose({
  handleAutoAlign,
  fitView,
  focusNode,
});
</script>

<template>
  <div
    ref="containerRef"
    class="vue-flow relative h-full w-full flex-1 overflow-hidden bg-background select-none"
    @mousedown="onCanvasMouseDown"
    @mousemove="onCanvasMouseMove"
    @mouseup="onCanvasMouseUp"
    @wheel="onWheel"
    @dragover.prevent
    @drop="onDropInCanvas"
  >
    <!-- Dotted Canvas Background Pattern -->
    <div
      class="pointer-events-none absolute inset-0 opacity-40"
      :style="{
        backgroundImage:
          'radial-gradient(circle, currentColor 1px, transparent 1px)',
        backgroundSize: `${24 * viewport.zoom}px ${24 * viewport.zoom}px`,
        backgroundPosition: `${viewport.x}px ${viewport.y}px`,
      }"
    />

    <!-- Transformed Graph Layer (Edges + Nodes) -->
    <div
      class=" absolute left-0 top-0 origin-top-left"
      :style="{
        transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
      }"
    >
      <!-- SVG Edges Layer -->
      <svg
        class="pointer-events-none overflow-visible"
        width="4000"
        height="3000"
      >
        <defs>
          <marker
            id="automa-arrow"
            viewBox="0 0 10 10"
            refX="7"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" class="fill-primary" />
          </marker>
          <marker
            id="automa-arrow-fallback"
            viewBox="0 0 10 10"
            refX="7"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 1 L 10 5 L 0 9 z" class="fill-destructive" />
          </marker>
        </defs>

        <g
          v-for="item in renderedEdges"
          :key="item.edge.id"
          class="pointer-events-auto group/edge cursor-pointer"
          @dblclick.stop="removeEdge(item.edge.id)"
        >
          <path
            :d="item.path"
            fill="none"
            stroke-width="2.5"
            :class="
              item.isFallback
                ? 'stroke-destructive/80 hover:stroke-destructive'
                : 'stroke-primary/70 hover:stroke-primary'
            "
            :marker-end="
              item.isFallback
                ? 'url(#automa-arrow-fallback)'
                : 'url(#automa-arrow)'
            "
          />
          <circle
            :cx="item.midX"
            :cy="item.midY"
            r="9"
            class="fill-popover stroke-border opacity-0 transition-opacity group-hover/edge:opacity-100"
            @click.stop="removeEdge(item.edge.id)"
          />
          <text
            :x="item.midX"
            :y="item.midY + 3.5"
            text-anchor="middle"
            class="fill-destructive text-xs font-bold opacity-0 transition-opacity group-hover/edge:opacity-100"
            @click.stop="removeEdge(item.edge.id)"
          >
            ×
          </text>
        </g>

        <!-- Active Dragging Connection Line -->
        <path
          v-if="draftEdgePath"
          :d="draftEdgePath"
          fill="none"
          stroke-width="2"
          stroke-dasharray="5,5"
          class="stroke-primary"
        />
      </svg>

      <!-- HTML Nodes Layer -->
      <div
        v-for="node in props.nodes"
        :key="node.id"
        :data-id="node.id"
        class="vue-flow__node absolute"
        :style="{
          left: `${node.position?.x ?? 0}px`,
          top: `${node.position?.y ?? 0}px`,
        }"
        @mousedown="onNodeMouseDown($event, node)"
        @contextmenu="onNodeContextMenu($event, node)"
      >
        <component
          :is="resolveNodeComponent(node)"
          :id="node.id"
          :label="node.label"
          :data="node.data"
          :selected="selectedIds.has(node.id)"
          :active="props.activeNodeId === node.id"
          :is-package-canvas="props.isPackageCanvas"
          :has-package-update="hasPackageUpdate(node)"
          @edit="emit('edit-node', node)"
          @settings="emit('settings-node', node)"
          @delete="removeNode(node.id)"
          @run-from-block="emit('run-from-block', node.id)"
          @update="updateNodeData(node.id, $event)"
          @sync-package="syncPackageNode(node)"
          @open-package="emit('open-package', $event)"
          @start-connect="onStartConnect"
          @end-connect="onEndConnect"
          @handle-contextmenu="onHandleContextMenu"
        />
      </div>
    </div>

    <!-- Bottom Controls Bar (Official Automa WorkflowEditor.vue controls) -->
    <div class="pointer-events-none absolute bottom-4 left-4 right-4 z-20 flex items-center justify-between">
      <div class="pointer-events-auto flex items-center gap-2">
        <EditorSearchBlocks :nodes="props.nodes" @focus-node="focusNode" />
        <Button
          variant="outline"
          size="sm"
          class="h-8 gap-1.5 bg-card text-xs shadow-sm"
          title="Auto-align blocks Left-to-Right (Dagre)"
          @click="handleAutoAlign"
        >
          <AlignHorizontalDistributeCenter class="size-3.5" />
          <span>Auto Align</span>
        </Button>
      </div>

      <div class="pointer-events-auto flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          class="h-8 w-8 bg-card p-0 shadow-sm"
          title="Reset / Fit View"
          @click="fitView"
        >
          <Maximize2 class="size-3.5" />
        </Button>

        <div class="flex items-center rounded-lg border border-border bg-card shadow-sm">
          <Button
            variant="ghost"
            size="sm"
            class="h-8 w-8 rounded-r-none p-0"
            title="Zoom Out"
            @click="viewport.zoom = Math.max(0.4, Number((viewport.zoom - 0.1).toFixed(2)))"
          >
            <Minus class="size-3.5" />
          </Button>
          <span class="px-2 text-xs font-medium text-muted-foreground">
            {{ Math.round(viewport.zoom * 100) }}%
          </span>
          <Button
            variant="ghost"
            size="sm"
            class="h-8 w-8 rounded-l-none p-0"
            title="Zoom In"
            @click="viewport.zoom = Math.min(1.6, Number((viewport.zoom + 0.1).toFixed(2)))"
          >
            <Plus class="size-3.5" />
          </Button>
        </div>
      </div>
    </div>

    <!-- MiniMap Preview -->
    <div
      v-if="props.minimap && props.nodes.length > 0"
      class="pointer-events-none absolute bottom-16 right-4 z-10 hidden h-28 w-44 overflow-hidden rounded-xl border border-border bg-card/90 p-2 shadow-sm md:block"
    >
      <div class="relative h-full w-full">
        <div
          v-for="node in props.nodes"
          :key="`mini-${node.id}`"
          class="absolute h-2.5 w-6 rounded-sm"
          :class="
            selectedIds.has(node.id)
              ? 'bg-primary'
              : node.label === 'block-package'
                ? 'bg-primary/60'
                : 'bg-muted-foreground/40'
          "
          :style="{
            left: `${Math.min(140, Math.max(0, Math.round((node.position?.x ?? 0) / 12)))}px`,
            top: `${Math.min(84, Math.max(0, Math.round((node.position?.y ?? 0) / 12)))}px`,
          }"
        />
      </div>
    </div>

    <!-- Context Menu -->
    <EditorCtxMenu
      :visible="ctxMenu.visible"
      :x="ctxMenu.x"
      :y="ctxMenu.y"
      :is-package-canvas="props.isPackageCanvas"
      :selected-count="selectedIds.size"
      :can-ungroup="canUngroupSelected"
      :target-node-id="ctxMenu.targetNodeId"
      :target-handle="ctxMenu.targetHandle"
      @close="ctxMenu.visible = false"
      @duplicate="duplicateSelected"
      @group="groupSelectedBlocks"
      @ungroup="ungroupSelectedBlock"
      @save-as-package="showSavePkgDialog = true"
      @execute-from-block="emit('run-from-block', $event)"
      @delete-selected="deleteSelected"
      @set-package-io="emit('set-package-io', $event)"
    />

    <!-- Save Selection as Package Dialog -->
    <EditorAddPackageDialog
      v-model:open="showSavePkgDialog"
      :selected-count="selectedIds.size"
      @confirm="confirmSavePackage"
    />
  </div>
</template>
