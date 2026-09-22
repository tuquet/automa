<template>
  <vue-flow
    :id="props.id"
    data-testid="vue-flow-root"
    :class="{ disabled: isDisabled }"
    :edge-updater-radius="20"
    delete-key-code="Delete"
    :elevate-edges-on-select="true"
    :default-zoom="props.data?.zoom ?? 1"
    :min-zoom="setMinValue(+store.settings.editor.minZoom || 0.5, 0.1)"
    :max-zoom="
      setMinValue(
        +store.settings.editor.maxZoom || 1.2,
        +store.settings.editor.minZoom + 0.1
      )
    "
    :multi-selection-key-code="isMac ? 'Meta' : 'Control'"
    :default-position="getPosition(props.data?.position)"
    v-bind="props.options || {}"
    :default-edge-options="{
      type: 'custom',
      updatable: true,
      selectable: true,
      markerEnd: settings.arrow ? MarkerType.ArrowClosed : '',
    }"
  >
    <Background />
    <MiniMap
      v-if="minimap"
      data-testid="canvas-minimap"
      :node-class-name="minimapNodeClassName"
      :node-color="minimapNodeColor"
      pannable
      zoomable
      class="hidden md:block shadow-md border border-border rounded-lg overflow-hidden !z-20"
    />
    <div
      v-if="editorControls"
      data-testid="editor-controls-bar"
      class="absolute left-0 bottom-0 z-10 flex w-full items-center p-4 md:pr-60"
    >
      <slot name="controls-prepend" />
      <div class="pointer-events-none grow" />
      <slot name="controls-append" />
      <div
        class="inline-flex items-center rounded-xl bg-card shadow-md border border-border p-1.5 gap-1.5"
      >
        <Button
          variant="ghost"
          size="icon-lg"
          data-testid="btn-canvas-fit-view"
          :title="t('workflow.editor.resetZoom')"
          class="size-10 hover:bg-accent text-foreground"
          @click="editor.fitView()"
        >
          <Maximize2 class="size-5" />
        </Button>
        <div class="inline-block h-5 w-px bg-border my-auto mx-1" />
        <Button
          variant="ghost"
          size="icon-lg"
          data-testid="btn-canvas-zoom-out"
          :title="t('workflow.editor.zoomOut')"
          class="size-10 hover:bg-accent text-foreground"
          @click="editor.zoomOut()"
        >
          <Minus class="size-5" />
        </Button>
        <Button
          variant="ghost"
          size="icon-lg"
          data-testid="btn-canvas-zoom-in"
          :title="t('workflow.editor.zoomIn')"
          class="size-10 hover:bg-accent text-foreground"
          @click="editor.zoomIn()"
        >
          <Plus class="size-5" />
        </Button>
      </div>
    </div>
    <template v-for="(node, name) in nodeTypes" :key="name" #[name]="nodeProps">
      <component
        :is="node"
        v-bind="{
          ...nodeProps,
          editor: name === 'node-BlockPackage' ? editor : null,
        }"
        @delete="deleteBlock"
        @settings="initEditBlockSettings"
        @edit="editBlock(nodeProps, $event)"
        @update="updateBlockData(nodeProps.id, $event)"
      />
    </template>
    <template #edge-custom="edgeProps">
      <editor-custom-edge v-bind="edgeProps" />
    </template>
    <ui-modal
      v-model="blockSettingsState.show"
      :title="t('workflow.blocks.base.settings.title')"
      content-class="max-w-xl"
      @close="clearBlockSettings"
    >
      <edit-block-settings
        :data="blockSettingsState.data"
        @change="updateBlockSettingsData"
      />
    </ui-modal>
  </vue-flow>
</template>
<script setup>
import {
  onMounted,
  onBeforeUnmount,
  watch,
  computed,
  reactive,
  provide,
  shallowRef,
} from 'vue';
import { useI18n } from 'vue-i18n';
import {
  VueFlow,
  useVueFlow,
  MarkerType,
  getConnectedEdges,
} from '@vue-flow/core';
import { Background } from '@vue-flow/background';
import { MiniMap } from '@vue-flow/minimap';
import cloneDeep from 'lodash.clonedeep';
import { Button } from '@automa/ui';
import { Maximize2, Minus, Plus } from 'lucide-vue-next';
import { useStore } from '@/stores/main';
import { getBlocks } from '@/utils/getSharedData';
import { categories } from '@/utils/shared';
import EditBlockSettings from './edit/EditBlockSettings.vue';
import EditorCustomEdge from './editor/EditorCustomEdge.vue';
import '@vue-flow/minimap/dist/style.css';

defineOptions({
  name: 'WorkflowEditor',
});

const props = defineProps({
  id: {
    type: String,
    default: 'editor',
  },
  data: {
    type: Object,
    default: () => ({
      x: 0,
      y: 0,
      zoom: 0,
      nodes: [],
      edges: [],
    }),
  },
  options: {
    type: Object,
    default: () => ({}),
  },
  editorControls: {
    type: Boolean,
    default: true,
  },
  minimap: {
    type: Boolean,
    default: true,
  },
  disabled: Boolean,
});
const emit = defineEmits([
  'edit',
  'init',
  'update:node',
  'delete:node',
  'update:settings',
]);

const fallbackBlocks = {
  BlockBasic: ['BlockExportData'],
  BlockBasicWithFallback: ['BlockWebhook'],
};

const isMac = navigator.appVersion.indexOf('Mac') !== -1;
const blockModules = import.meta.glob('../../block/*.vue', {
  eager: true,
});
const nodeTypes = Object.entries(blockModules).reduce((acc, [path, module]) => {
  const name = path
    .split('/')
    .pop()
    .replace(/\.vue$/, '');
  const component = module?.default ?? module;
  if (fallbackBlocks[name]) {
    fallbackBlocks[name].forEach((fallbackBlock) => {
      acc[`node-${fallbackBlock}`] = component;
    });
  }
  acc[`node-${name}`] = component;
  return acc;
}, {});
const getPosition = (position) => (Array.isArray(position) ? position : [0, 0]);
const setMinValue = (num, min) => (num < min ? min : num);

const { t } = useI18n();
const store = useStore();
const editor = useVueFlow(props.id);
const editorRef = shallowRef(editor);
provide('workflow-editor', editorRef);
editor.onConnect((params) => {
  params.class = `source-${params.sourceHandle} target-${params.targetHandle}`;
  params.updatable = true;
  editor.addEdges([params]);
});
editor.onEdgeUpdate(({ edge, connection }) => {
  const isBothOutput =
    connection.sourceHandle.includes('output') &&
    connection.targetHandle.includes('output');
  if (isBothOutput) return;

  Object.assign(edge, connection);
});

const blocks = getBlocks();
const settings = store.settings.editor;
const isDisabled = computed(() => props.options.disabled ?? props.disabled);

const blockSettingsState = reactive({
  show: false,
  data: {},
});

function initEditBlockSettings({ blockId, details, data, itemId }) {
  blockSettingsState.data = {
    itemId,
    blockId,
    id: details.id,
    data: cloneDeep(data),
  };
  blockSettingsState.show = true;
}
function clearBlockSettings() {
  Object.assign(blockSettingsState, {
    data: null,
    show: false,
  });
}
function minimapNodeClassName({ label }) {
  const block = blocks[label];
  if (!block || !block.category) return 'bg-accent';
  const categoryObj = categories[block.category];

  return categoryObj?.color || 'bg-accent';
}
function minimapNodeColor(node) {
  const label = node.label || node.id;
  const block = blocks[label];
  if (!block || !block.category) return '#ea580c';
  const colorMap = {
    general: '#3b82f6',
    interaction: '#10b981',
    data: '#f59e0b',
    flow: '#8b5cf6',
    online: '#06b6d4',
  };
  return colorMap[block.category] || '#ea580c';
}
function updateBlockData(nodeId, data = {}) {
  if (isDisabled.value) return;

  const node = editor.findNode(nodeId);
  node.data = { ...node.data, ...data };

  emit('update:node', node);
}
function updateBlockSettingsData(newSettings) {
  if (isDisabled.value) return;

  const nodeId = blockSettingsState.data.blockId;
  const node = editor.findNode(nodeId);

  if (blockSettingsState.data.itemId) {
    const index = node.data.blocks.findIndex(
      (item) => item.itemId === blockSettingsState.data.itemId
    );
    if (index === -1) return;

    node.data.blocks[index].data = {
      ...node.data.blocks[index].data,
      ...newSettings,
    };
  } else {
    node.data = { ...node.data, ...newSettings };
  }

  emit('update:settings', {
    settings: newSettings,
    itemId: blockSettingsState.data.itemId,
    blockId: blockSettingsState.data.blockId,
  });
}
function editBlock({ id, label, data }, additionalData = {}) {
  if (isDisabled.value) return;

  emit('edit', {
    id: label,
    blockId: id,
    data: cloneDeep(data),
    ...additionalData,
  });
}
function deleteBlock(nodeId) {
  if (isDisabled.value) return;

  editor.removeNodes([nodeId]);
  emit('delete:node', nodeId);
}
function onMousedown(event) {
  if (isDisabled.value && event.shiftKey) {
    event.stopPropagation();
    event.preventDefault();
  }
}
function applyFlowData(customData) {
  const flowData = customData || props.data;
  if (settings.snapToGrid) {
    editor.snapToGrid.value = true;
    editor.snapGrid.value = Object.values(settings.snapGrid);
  }

  editor.setNodes(
    flowData?.nodes?.map((node) => ({ ...node, events: {} })) || []
  );
  editor.setEdges(flowData?.edges || []);
  editor.setViewport({
    x: flowData?.x || 0,
    y: flowData?.y || 0,
    zoom: flowData?.zoom || 1,
  });

  setTimeout(() => {
    try {
      editor.fitView?.({ padding: 0.2 });
    } catch (_) {
      // Ignored
    }
  }, 50);
}

watch(
  () => props.data,
  (newData) => {
    if (newData) {
      applyFlowData(newData);
    }
  },
  { deep: false }
);

watch(
  () => props.disabled,
  (value) => {
    const keys = [
      'nodesDraggable',
      'edgesUpdatable',
      'nodesConnectable',
      'elementsSelectable',
    ];

    keys.forEach((key) => {
      editor[key].value = !value;
    });
  },
  { immediate: true }
);
watch(editor.getSelectedNodes, (nodes, _, cleanup) => {
  const connectedEdges = getConnectedEdges(nodes, editor.getEdges.value);

  connectedEdges.forEach((edge) => {
    edge.class = 'connected-edges';
  });

  cleanup(() => {
    connectedEdges.forEach((edge) => {
      edge.class = undefined;
    });
  });
});

onMounted(() => {
  applyFlowData();
  window.addEventListener('mousedown', onMousedown, true);
  emit('init', editor);
});
onBeforeUnmount(() => {
  window.removeEventListener('mousedown', onMousedown, true);
});

defineExpose({
  editor,
  getNodes: () => editor.getNodes?.value || [],
  getEdges: () => editor.getEdges?.value || [],
  getSelectedNodes: () => editor.getSelectedNodes?.value || [],
  fitView: (params) => editor.fitView?.(params),
  zoomIn: () => editor.zoomIn?.(),
  zoomOut: () => editor.zoomOut?.(),
  addNodes: (nodes) => editor.addNodes?.(nodes),
  removeNodes: (nodes) => editor.removeNodes?.(nodes),
  addEdges: (edges) => editor.addEdges?.(edges),
  removeEdges: (edges) => editor.removeEdges?.(edges),
  setNodes: (nodes) => editor.setNodes?.(nodes),
  setEdges: (edges) => editor.setEdges?.(edges),
  applyNodeChanges: (changes) => editor.applyNodeChanges?.(changes),
  applyEdgeChanges: (changes) => editor.applyEdgeChanges?.(changes),
  project: (pos) => editor.project?.(pos),
});
</script>
<style>
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';
</style>
