<script setup lang="ts">
import type {
  AutomaPackage,
  Workflow,
  WorkflowEdge,
  WorkflowNode,
  WorkflowSettings,
  WorkflowTableColumn,
} from '@automa/types';
import {
  Code2,
  Database,
  PanelLeft,
  Play,
  Save,
  Settings,
  Table2,
} from '@lucide/vue';
import { Badge, Button, Input } from '@tuquet/vue-ui';
import { computed, ref } from 'vue';
import type { AutomaBlockMeta } from '../../utils/block-registry.js';
import {
  dropPackageIntoWorkflow,
  extractPackageFromSelection,
  generateCanvasId,
} from '../../utils/canvas-helpers.js';
import BlockEditInspector from './edit/BlockEditInspector.vue';
import EditBlockSettingsDialog from './edit/EditBlockSettingsDialog.vue';
import EditorBlockPalette from './editor/EditorBlockPalette.vue';
import WorkflowGlobalDataDialog from './modals/WorkflowGlobalDataDialog.vue';
import WorkflowSettingsDialog from './modals/WorkflowSettingsDialog.vue';
import WorkflowTableDialog from './modals/WorkflowTableDialog.vue';
import WorkflowEditor from './WorkflowEditor.vue';

const props = withDefaults(
  defineProps<{
    modelValue: Workflow;
    packages?: AutomaPackage[];
    readonly?: boolean;
    activeNodeId?: string | null;
  }>(),
  {
    packages: () => [],
    readonly: false,
    activeNodeId: null,
  },
);

const emit = defineEmits<{
  (e: 'update:modelValue', wf: Workflow): void;
  (e: 'save', wf: Workflow): void;
  (e: 'run', wf: Workflow): void;
  (e: 'run-from-block', payload: { workflow: Workflow; blockId: string }): void;
  (e: 'save-package', pkg: AutomaPackage): void;
  (e: 'open-package', pkgId: string): void;
  (e: 'create-package'): void;
}>();

const showSidebar = ref(true);
const editingNodeId = ref<string | null>(null);
const settingsNode = ref<WorkflowNode | null>(null);
const showSettingsDialog = ref(false);
const showTableModal = ref(false);
const showGlobalDataModal = ref(false);
const showWorkflowSettingsModal = ref(false);
const showRawJsonPreview = ref(false);

const nodes = computed<WorkflowNode[]>(
  () =>
    ((props.modelValue.drawflow?.nodes ??
      props.modelValue.nodes ??
      []) as WorkflowNode[]),
);

const edges = computed<WorkflowEdge[]>(
  () =>
    props.modelValue.drawflow?.edges ??
    props.modelValue.edges ??
    [],
);

const editingNode = computed<WorkflowNode | null>(
  () => nodes.value.find((n) => n.id === editingNodeId.value) ?? null,
);

const variablesRecord = computed<Record<string, unknown>>(() => {
  const v = props.modelValue.variables;
  if (v && !Array.isArray(v) && typeof v === 'object') {
    return v as Record<string, unknown>;
  }
  return {};
});

function emitWorkflowPatch(patch: Partial<Workflow>) {
  const nextNodes =
    (patch.drawflow?.nodes as WorkflowNode[]) ??
    (patch.nodes as WorkflowNode[]) ??
    nodes.value;
  const nextEdges =
    patch.drawflow?.edges ?? patch.edges ?? edges.value;

  const updated: Workflow = {
    ...props.modelValue,
    ...patch,
    drawflow: {
      nodes: nextNodes,
      edges: nextEdges,
    },
    updatedAt: Date.now(),
  };
  emit('update:modelValue', updated);
}

function updateNodes(nextNodes: WorkflowNode[]) {
  emitWorkflowPatch({
    drawflow: { nodes: nextNodes, edges: edges.value },
  });
}

function updateEdges(nextEdges: WorkflowEdge[]) {
  emitWorkflowPatch({
    drawflow: { nodes: nodes.value, edges: nextEdges },
  });
}

function addBlockFromPalette(meta: AutomaBlockMeta) {
  if (meta.id === 'trigger' && nodes.value.some((n) => n.label === 'trigger')) {
    return;
  }
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

function addPackageFromPalette(pkg: AutomaPackage) {
  const offset = nodes.value.length * 40;
  const dropped = dropPackageIntoWorkflow(pkg, {
    x: 220 + (offset % 280),
    y: 140 + (offset % 200),
  });
  emitWorkflowPatch({
    drawflow: {
      nodes: [...nodes.value, ...dropped.nodes],
      edges: [...edges.value, ...dropped.edges],
    },
  });
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

function onSaveSelectionAsPackage(payload: {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  name: string;
  description: string;
  asBlock: boolean;
}) {
  const pkg = extractPackageFromSelection(payload.nodes, payload.edges, {
    name: payload.name,
    description: payload.description,
    asBlock: payload.asBlock,
  });
  emit('save-package', pkg);
}

function onSaveTable(columns: WorkflowTableColumn[]) {
  emitWorkflowPatch({ table: columns });
}

function onSaveVariables(vars: Record<string, unknown>) {
  emitWorkflowPatch({ variables: vars });
}

function onSaveSettings(settings: WorkflowSettings) {
  emitWorkflowPatch({ settings });
}
</script>

<template>
  <div class="flex h-full w-full flex-col overflow-hidden bg-background text-foreground">
    <!-- Top Header Toolbar (Screen 1: Workflow Canvas) -->
    <header class="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-4">
      <div class="flex min-w-0 items-center gap-2.5">
        <Button
          variant="outline"
          size="sm"
          class="h-8 w-8 p-0"
          title="Toggle Block Palette Sidebar"
          @click="showSidebar = !showSidebar"
        >
          <PanelLeft class="size-4" />
        </Button>

        <Input
          class="h-8 w-56 text-sm font-semibold"
          :model-value="props.modelValue.name"
          placeholder="Workflow Name"
          @update:model-value="emitWorkflowPatch({ name: String($event) })"
        />

        <Badge variant="outline" class="hidden text-xs sm:inline-flex">
          {{ nodes.length }} blocks · {{ edges.length }} edges
        </Badge>
      </div>

      <!-- Workflow Actions (Table, Global Data, Settings, JSON Review, Save, Run) -->
      <div class="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          class="h-8 gap-1.5 text-xs"
          @click="showTableModal = true"
        >
          <Table2 class="size-3.5" />
          <span class="hidden md:inline">
            Table ({{ props.modelValue.table?.length || 0 }})
          </span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          class="h-8 gap-1.5 text-xs"
          @click="showGlobalDataModal = true"
        >
          <Database class="size-3.5" />
          <span class="hidden md:inline">Variables</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          class="h-8 gap-1.5 text-xs"
          @click="showWorkflowSettingsModal = true"
        >
          <Settings class="size-3.5" />
          <span class="hidden md:inline">Settings</span>
        </Button>

        <Button
          :variant="showRawJsonPreview ? 'default' : 'outline'"
          size="sm"
          class="h-8 gap-1.5 text-xs"
          title="Toggle Agent Code / JSON View"
          @click="showRawJsonPreview = !showRawJsonPreview"
        >
          <Code2 class="size-3.5" />
          <span class="hidden md:inline">JSON</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          class="h-8 gap-1.5 text-xs"
          @click="emit('save', props.modelValue)"
        >
          <Save class="size-3.5" />
          <span>Save</span>
        </Button>

        <Button
          size="sm"
          class="h-8 gap-1.5 text-xs"
          @click="emit('run', props.modelValue)"
        >
          <Play class="size-3.5" />
          <span>Execute</span>
        </Button>
      </div>
    </header>

    <!-- Main Workspace Body -->
    <div class="flex min-h-0 flex-1 overflow-hidden">
      <!-- Left Sidebar: Blocks & Packages Palette -->
      <EditorBlockPalette
        v-if="showSidebar && !props.readonly"
        :is-package-canvas="false"
        :packages="props.packages"
        @add-block="addBlockFromPalette"
        @add-package="addPackageFromPalette"
        @open-package="emit('open-package', $event)"
        @create-package="emit('create-package')"
      />

      <!-- Center: Interactive DAG Canvas or JSON Split View -->
      <WorkflowEditor
        v-if="!showRawJsonPreview"
        :nodes="nodes"
        :edges="edges"
        :packages="props.packages"
        :is-package-canvas="false"
        :readonly="props.readonly"
        :active-node-id="props.activeNodeId"
        @update:nodes="updateNodes"
        @update:edges="updateEdges"
        @edit-node="editingNodeId = $event.id"
        @settings-node="
          settingsNode = $event;
          showSettingsDialog = true;
        "
        @run-from-block="
          emit('run-from-block', {
            workflow: props.modelValue,
            blockId: $event,
          })
        "
        @open-package="emit('open-package', $event)"
        @save-as-package="onSaveSelectionAsPackage"
      />

      <div
        v-else
        class="flex-1 overflow-y-auto bg-muted/20 p-6 font-mono text-xs"
      >
        <pre class="rounded-xl border border-border bg-card p-4 text-foreground overflow-x-auto">{{ JSON.stringify(props.modelValue, null, 2) }}</pre>
      </div>

      <!-- Right Sidebar: Shadcn Block Property & JSON Inspector -->
      <BlockEditInspector
        :node="editingNode"
        @close="editingNodeId = null"
        @update:data="onUpdateInspectorData"
      />
    </div>

    <!-- Modals -->
    <EditBlockSettingsDialog
      v-model:open="showSettingsDialog"
      :node="settingsNode"
      @save="onUpdateInspectorData"
    />

    <WorkflowTableDialog
      v-model:open="showTableModal"
      :columns="props.modelValue.table || []"
      @save="onSaveTable"
    />

    <WorkflowGlobalDataDialog
      v-model:open="showGlobalDataModal"
      :variables="variablesRecord"
      @save="onSaveVariables"
    />

    <WorkflowSettingsDialog
      v-model:open="showWorkflowSettingsModal"
      :settings="props.modelValue.settings || {}"
      @save="onSaveSettings"
    />
  </div>
</template>
