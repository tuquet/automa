<script setup lang="ts">
import type {
  AutomaPackage,
  WorkflowEdge,
  WorkflowNode,
} from '@automa/types';
import {
  FileText,
  Package,
  PanelLeft,
  Save,
  Sliders,
  Workflow as WorkflowIcon,
} from '@lucide/vue';
import { Badge, Button, Input, Tabs, TabsList, TabsTrigger } from '@tuquet/vue-ui';
import { computed, ref } from 'vue';
import {
  type AutomaBlockMeta,
  isExcludedInPackage,
} from '../../utils/block-registry.js';
import {
  addPackageIOHandle,
  generateCanvasId,
} from '../../utils/canvas-helpers.js';
import BlockEditInspector from './edit/BlockEditInspector.vue';
import EditBlockSettingsDialog from './edit/EditBlockSettingsDialog.vue';
import EditorBlockPalette from './editor/EditorBlockPalette.vue';
import PackageDetailsPanel from './package/PackageDetailsPanel.vue';
import PackageSettingsPanel from './package/PackageSettingsPanel.vue';
import WorkflowEditor from './WorkflowEditor.vue';

const props = withDefaults(
  defineProps<{
    modelValue: AutomaPackage;
    readonly?: boolean;
  }>(),
  {
    readonly: false,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', pkg: AutomaPackage): void;
  (e: 'save', pkg: AutomaPackage): void;
}>();

const activeTab = ref<'editor' | 'settings' | 'details'>('editor');
const showSidebar = ref(true);
const editingNodeId = ref<string | null>(null);
const settingsNode = ref<WorkflowNode | null>(null);
const showSettingsDialog = ref(false);
const editorRef = ref<InstanceType<typeof WorkflowEditor> | null>(null);

const nodes = computed<WorkflowNode[]>(
  () => ((props.modelValue.data?.nodes ?? []) as WorkflowNode[]),
);

const edges = computed<WorkflowEdge[]>(
  () => props.modelValue.data?.edges ?? [],
);

const editingNode = computed<WorkflowNode | null>(
  () => nodes.value.find((n) => n.id === editingNodeId.value) ?? null,
);

function emitPackagePatch(patch: Partial<AutomaPackage>) {
  const updated: AutomaPackage = {
    ...props.modelValue,
    ...patch,
    updatedAt: Date.now(),
  };
  emit('update:modelValue', updated);
}

function updateNodes(nextNodes: WorkflowNode[]) {
  const filtered = nextNodes.filter((n) => !isExcludedInPackage(n.label));
  emitPackagePatch({
    data: {
      nodes: filtered,
      edges: edges.value,
    },
  });
}

function updateEdges(nextEdges: WorkflowEdge[]) {
  emitPackagePatch({
    data: {
      nodes: nodes.value,
      edges: nextEdges,
    },
  });
}

function addBlockFromPalette(meta: AutomaBlockMeta) {
  if (isExcludedInPackage(meta.id)) return;
  const offset = nodes.value.length * 36;
  const newNode: WorkflowNode = {
    id: generateCanvasId(meta.id),
    label: meta.id,
    type: meta.component,
    position: { x: 160 + (offset % 320), y: 120 + (offset % 240) },
    data: structuredClone(meta.defaultData),
  };
  updateNodes([...nodes.value, newNode]);
  editingNodeId.value = newNode.id;
}

function onUpdateInspectorData(payload: {
  nodeId: string;
  data: Record<string, unknown>;
}) {
  updateNodes(
    nodes.value.map((n) =>
      n.id === payload.nodeId ? { ...n, data: payload.data } : n,
    ),
  );
}

function onSetPackageIO(payload: {
  ioType: 'inputs' | 'outputs';
  nodeId: string;
  handleId: string;
}) {
  const { updatedPackage } = addPackageIOHandle(
    props.modelValue,
    payload.ioType,
    {
      blockId: payload.nodeId,
      handleId: payload.handleId,
    },
  );
  emit('update:modelValue', updatedPackage);
}

function onFocusBlockFromSettings(blockId: string) {
  activeTab.value = 'editor';
  setTimeout(() => {
    editorRef.value?.focusNode(blockId);
  }, 50);
}
</script>

<template>
  <div class="flex h-full w-full flex-col overflow-hidden bg-background text-foreground">
    <!-- Top Header Toolbar (Screen 2: Package Canvas) -->
    <header class="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-4">
      <div class="flex min-w-0 items-center gap-2.5">
        <Button
          v-if="activeTab === 'editor'"
          variant="outline"
          size="sm"
          class="h-8 w-8 p-0"
          title="Toggle Block Palette"
          @click="showSidebar = !showSidebar"
        >
          <PanelLeft class="size-4" />
        </Button>

        <div class="flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
          <Package class="size-4" />
        </div>

        <Input
          class="h-8 w-56 text-sm font-semibold"
          :model-value="props.modelValue.name"
          placeholder="Package Name"
          @update:model-value="emitPackagePatch({ name: String($event) })"
        />

        <Badge variant="outline" class="hidden text-xs md:inline-flex">
          {{ props.modelValue.inputs?.length || 0 }} in ·
          {{ props.modelValue.outputs?.length || 0 }} out
        </Badge>
      </div>

      <!-- Mode Switcher Tabs (Editor / I/O & Settings / Details) -->
      <Tabs v-model="activeTab" class="w-auto">
        <TabsList class="grid h-8 grid-cols-3">
          <TabsTrigger value="editor" class="gap-1.5 px-3 text-xs">
            <WorkflowIcon class="size-3.5" />
            <span>Canvas</span>
          </TabsTrigger>
          <TabsTrigger value="settings" class="gap-1.5 px-3 text-xs">
            <Sliders class="size-3.5" />
            <span>I/O & Settings</span>
          </TabsTrigger>
          <TabsTrigger value="details" class="gap-1.5 px-3 text-xs">
            <FileText class="size-3.5" />
            <span>Details & JSON</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <!-- Save Button -->
      <div class="flex items-center gap-2">
        <Button
          size="sm"
          class="h-8 gap-1.5 text-xs"
          @click="emit('save', props.modelValue)"
        >
          <Save class="size-3.5" />
          <span>Save Package</span>
        </Button>
      </div>
    </header>

    <!-- Tab 1: Package Visual Canvas -->
    <div
      v-if="activeTab === 'editor'"
      class="flex min-h-0 flex-1 overflow-hidden"
    >
      <EditorBlockPalette
        v-if="showSidebar && !props.readonly"
        :is-package-canvas="true"
        @add-block="addBlockFromPalette"
      />

      <WorkflowEditor
        ref="editorRef"
        :nodes="nodes"
        :edges="edges"
        :is-package-canvas="true"
        :readonly="props.readonly"
        @update:nodes="updateNodes"
        @update:edges="updateEdges"
        @edit-node="editingNodeId = $event.id"
        @settings-node="
          settingsNode = $event;
          showSettingsDialog = true;
        "
        @set-package-io="onSetPackageIO"
      />

      <BlockEditInspector
        :node="editingNode"
        @close="editingNodeId = null"
        @update:data="onUpdateInspectorData"
      />
    </div>

    <!-- Tab 2: Package I/O Handles & Settings -->
    <div
      v-else-if="activeTab === 'settings'"
      class="flex-1 overflow-y-auto bg-muted/20"
    >
      <PackageSettingsPanel
        :pkg="props.modelValue"
        @update:pkg="emit('update:modelValue', $event)"
        @focus-block="onFocusBlockFromSettings"
      />
    </div>

    <!-- Tab 3: Package Documentation & Full .automa-pkg JSON -->
    <div
      v-else
      class="flex-1 overflow-y-auto bg-muted/20"
    >
      <PackageDetailsPanel
        :pkg="props.modelValue"
        @update:pkg="emit('update:modelValue', $event)"
      />
    </div>

    <!-- Per-block Error Settings Modal -->
    <EditBlockSettingsDialog
      v-model:open="showSettingsDialog"
      :node="settingsNode"
      @save="onUpdateInspectorData"
    />
  </div>
</template>
