<template>
  <div
    class="flex flex-col h-screen w-screen overflow-hidden bg-background text-foreground font-sans select-none"
  >
    <!-- Top Header Bar Component (Hidden in Headless Mode) -->
    <studio-header
      v-if="!isHeadless"
      :show-sidebar="state.showSidebar"
      :automa-core-status="automaCoreState.status"
      :current-workflow-id="workflow?.id || currentFilePath"
      :current-workflow-name="workflow?.name || 'Untitled Workflow'"
      :current-file-path="currentFilePath"
      :available-workflows="availableWorkflows"
      :lint-issues-count="lintIssues.length"
      :logs-count="logsCount"
      :is-dirty="store.isDirty"
      :is-job-running="store.isJobRunning"
      :is-job-paused="store.isJobPaused"
      :workflow-settings="workflow?.settings || {}"
      @toggle-sidebar="state.showSidebar = !state.showSidebar"
      @open-storage-explorer="modals.storage = true"
      @open-file-picker="openFilePicker"
      @import-workflow="triggerImportWorkflow"
      @new-workflow="createNewWorkflow"
      @delete-workflow="onDeleteWorkflow"
      @select-workflow="loadWorkflowFromVault"
      @trigger-lint="triggerManualLint(workflow)"
      @open-modal="openModal($event)"
      @save-workflow="saveWorkflowToStorage"
      @export-json="exportJson"
      @run-workflow="onRunWorkflow"
      @kill-all-browsers="onKillAllBrowsers"
      @pause-job="onPauseJob"
      @resume-job="onResumeJob"
      @stop-job="onStopJob"
      @update-workflow-settings="updateWorkflowSettings"
    >
      <template #status>
        <studio-core-status />
      </template>
    </studio-header>

    <input
      ref="fileInputRef"
      data-testid="file-picker-input"
      type="file"
      accept=".json,.automa.json"
      class="hidden"
      @change="onFileSelected"
    />

    <input
      ref="importFileInputRef"
      data-testid="file-import-input"
      type="file"
      accept=".json,.automa.json"
      class="hidden"
      @change="onImportFileSelected"
    />

    <!-- Main Studio Workspace -->
    <div class="flex-1 flex overflow-hidden relative">
      <!-- Left Resizable Sidebar (Palette or Edit Block) -->
      <aside
        v-if="state.showSidebar"
        data-testid="studio-sidebar"
        :style="{ width: `${sidebarCss.width}px` }"
        class="h-full border-r border-border bg-card text-card-foreground z-20 flex flex-col shrink-0 overflow-hidden shadow-sm relative text-xs"
      >
        <!-- Block Form Editor -->
        <workflow-edit-block
          v-if="editState.editing && workflow"
          data-testid="sidebar-edit-block"
          :data="editState.blockData"
          :workflow="workflow"
          :editor="editorInstance"
          @update="updateBlockData"
          @close="closeEditingSidebar"
        />

        <!-- Workflow Details & Block Palette -->
        <workflow-details-card
          v-else-if="workflow"
          data-testid="sidebar-details-card"
          :workflow="workflow"
          @update="updateWorkflowDetails"
        />

        <!-- Resizable Drag Handle -->
        <div
          data-testid="sidebar-resize-handle"
          class="custom-drag"
          title="Drag to resize sidebar"
          @mousedown="startDrag"
        ></div>
      </aside>

      <!-- VueFlow Canvas Area -->
      <main
        data-testid="studio-canvas-main"
        class="flex-1 h-full relative overflow-hidden bg-background text-foreground"
        @dragover.prevent="onDragoverEditor"
        @drop="onDropInEditor"
      >
        <workflow-editor
          v-if="workflow?.drawflow"
          :key="`workflow-editor-${
            workflow?.id || workflow?.name || 'default'
          }-${editorKey}`"
          ref="editorRef"
          data-testid="workflow-editor-canvas"
          :data="workflow?.drawflow"
          :class="{ 'animate-blocks': state.animateBlocks }"
          @init="onEditorInit"
          @edit="onEditBlock"
          @update:node="onUpdateNode"
          @delete:node="onDeleteNode"
        >
          <template #controls-prepend>
            <div
              class="inline-flex items-center rounded-xl bg-card shadow-md border border-border mr-2 p-1.5 gap-1.5"
            >
              <Button
                variant="ghost"
                size="icon-lg"
                data-testid="btn-canvas-undo"
                :disabled="!commandManager.state.value.canUndo"
                title="Undo (Ctrl+Z)"
                class="size-10"
                @click="commandManager.undo"
              >
                <Undo2 class="size-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-lg"
                data-testid="btn-canvas-redo"
                :disabled="!commandManager.state.value.canRedo"
                title="Redo (Ctrl+Y)"
                class="size-10"
                @click="commandManager.redo"
              >
                <Redo2 class="size-5" />
              </Button>
              <div class="inline-block h-5 w-px bg-border my-auto mx-1" />
              <Button
                variant="ghost"
                size="icon-lg"
                data-testid="btn-canvas-auto-align"
                class="size-10 hover:bg-accent text-foreground"
                title="Auto Align Layout"
                @click="autoAlign"
              >
                <Wand2 class="size-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-lg"
                data-testid="btn-canvas-auto-focus"
                class="size-10 hover:bg-accent"
                :title="
                  autoFocusEnabled
                    ? 'Auto-focus Node (On)'
                    : 'Auto-focus Node (Off)'
                "
                @click="autoFocusEnabled = !autoFocusEnabled"
              >
                <Crosshair
                  class="size-5"
                  :class="
                    autoFocusEnabled ? 'text-primary' : 'text-muted-foreground'
                  "
                />
              </Button>
            </div>
          </template>
        </workflow-editor>

        <!-- In-canvas Debugging Dock -->
        <editor-debugging
          v-if="workflowStates && workflowStates.length > 0"
          :states="workflowStates"
          @goToBlock="goToBlock"
        />

        <!-- Canvas Context Menu -->
        <editor-local-ctx-menu
          v-if="editorInstance"
          :editor="editorInstance"
          @copy="copySelectedElements"
          @duplicate="duplicateElements"
          @paste="pasteCopiedElements"
          @group="groupBlocks"
          @ungroup="ungroupBlocks"
        />

        <!-- Empty State when no workflow drawflow is loaded -->
        <div
          v-if="!workflow?.drawflow"
          data-testid="studio-canvas-empty"
          class="flex flex-col items-center justify-center h-full text-muted-foreground gap-3 select-none"
        >
          <div class="p-3 rounded-full bg-muted/50 border border-border">
            <Wand2 class="size-8 text-muted-foreground/60" />
          </div>
          <div class="text-center">
            <p class="text-sm font-medium text-foreground">
              No Workflow Loaded
            </p>
            <p class="text-xs text-muted-foreground mt-0.5">
              Create a new workflow or select one from the storage library
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            class="mt-2 text-xs"
            @click="createNewWorkflow"
          >
            Create New Workflow
          </Button>
        </div>
      </main>
    </div>

    <!-- Modals -->
    <!-- Unified Storage & Vault Hub (Tables / Variables / Secrets) -->
    <unified-storage-modal
      v-if="workflow"
      v-model="modals.storage"
      :workflow="workflow"
      :initial-tab="storageInitialTab"
      @update:workflow="updateWorkflowDetails"
    />

    <!-- Settings Drawer (Right Sheet) -->
    <Sheet v-model:open="modals.settings">
      <SheetContent
        side="right"
        data-testid="drawer-workflow-settings"
        class="w-full sm:max-w-xl p-0 flex flex-col gap-0 bg-card text-card-foreground border-l border-border shadow-2xl z-50 h-full"
      >
        <SheetHeader
          class="px-5 py-4 border-b border-border flex flex-row items-center justify-between space-y-0 shrink-0"
        >
          <div class="flex items-center gap-2.5">
            <div
              class="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0"
            >
              <Settings2 class="size-4" />
            </div>
            <div>
              <SheetTitle
                class="text-sm font-semibold tracking-tight text-foreground"
              >
                Workflow Settings
              </SheetTitle>
              <SheetDescription
                class="text-xs text-muted-foreground line-clamp-1"
              >
                {{
                  workflow?.name || 'Configure execution parameters and options'
                }}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div class="flex-1 overflow-y-auto min-h-0">
          <workflow-settings
            v-if="workflow"
            :workflow="workflow"
            :show-title="false"
            card-class="border-none shadow-none bg-transparent w-full"
            content-class="flex-1 overflow-y-auto"
            @update="updateWorkflowSettings"
            @close="modals.settings = false"
          />
          <div v-else class="p-6 text-center text-xs text-muted-foreground">
            No active workflow selected.
          </div>
        </div>
      </SheetContent>
    </Sheet>

    <!-- Full-featured Native Automa Logs Dialog -->
    <app-logs />

    <!-- Run Workflow Modal Component -->
    <run-workflow-modal
      v-model="runModalState.show"
      :automa-core-state="automaCoreState"
      :run-modal-state="runModalState"
      :is-params-valid="isParamsValid"
      @update:browser-id="runModalState.browserId = $event"
      @update:headless="runModalState.headless = $event"
      @update:close-browser-on-finish="
        runModalState.closeBrowserOnFinish = $event
      "
      @update:param="onUpdateParam"
      @execute="executeWorkflowFromModal"
    />

    <!-- Browsers Quick Management Modal -->
    <browsers-quick-modal v-model="modals.browsers" />

    <!-- Workflows Storage Library Modal -->
    <ui-modal v-model="modals.library" custom-content content-class="max-w-4xl">
      <workflow-library-modal
        @select="loadWorkflowFromVault"
        @close="modals.library = false"
      />
    </ui-modal>

    <!-- Dedicated Portal Root for Overlays inside Iframe/VS Code Webview -->
    <div id="studio-overlay-root" />
  </div>
</template>

<script setup>
import {
  computed,
  onMounted,
  onUnmounted,
  provide,
  reactive,
  ref,
  watch,
} from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@automa/ui';
import { Crosshair, Redo2, Undo2, Wand2, Settings2 } from 'lucide-vue-next';
import defu from 'defu';

import WorkflowEditor from '@/components/newtab/workflow/WorkflowEditor.vue';
import WorkflowEditBlock from '@/components/newtab/workflow/WorkflowEditBlock.vue';
import WorkflowDetailsCard from '@/components/newtab/workflow/WorkflowDetailsCard.vue';
import WorkflowSettings from '@/components/newtab/workflow/WorkflowSettings.vue';
import EditorLocalCtxMenu from '@/components/newtab/workflow/editor/EditorLocalCtxMenu.vue';
import EditorDebugging from '@/components/newtab/workflow/editor/EditorDebugging.vue';
import StudioCoreStatus from '@/components/newtab/workflow/StudioCoreStatus.vue';
import AppLogs from '@/components/newtab/app/AppLogs.vue';

import { useCommandManager } from '@/composable/commandManager';
import { useSidebarResize } from '@/composable/useSidebarResize';
import { useAutomaCoreHealth } from '@/composable/useAutomaCoreHealth';
import { useLiveQuery } from '@/composable/liveQuery';
import emitter from '@/lib/mitt';
import dbLogs from '@/db/logs';

import WorkflowLibraryModal from './components/WorkflowLibraryModal.vue';
import StudioHeader from './components/StudioHeader.vue';
import RunWorkflowModal from './components/RunWorkflowModal.vue';
import BrowsersQuickModal from './components/BrowsersQuickModal.vue';
import UnifiedStorageModal from './components/UnifiedStorageModal.vue';

import { useStudioStore } from './stores/useStudioStore';
import { wsService } from './services/ws.service';
import { getInitialWorkflow } from './adapters/host-bridge';

import { useStudioWorkflow } from './composables/useStudioWorkflow';
import { useStudioLinter } from './composables/useStudioLinter';
import { useStudioExecution } from './composables/useStudioExecution';
import { useStudioCanvas } from './composables/useStudioCanvas';
import { useStudioClipboard } from './composables/useStudioClipboard';
import { useStudioKeyboardShortcuts } from './composables/useStudioKeyboardShortcuts';
import { useStudioHostIpc } from './composables/useStudioHostIpc';
import { useStudioJobControl } from './composables/useStudioJobControl';
import { useStudioFileImport } from './composables/useStudioFileImport';
import { useStudioRouteSync } from './composables/useStudioRouteSync';

const { state: automaCoreState, addEventListener: addCoreEventListener } =
  useAutomaCoreHealth();

const store = useStudioStore();
const commandManager = useCommandManager();
const { sidebarCss, startDrag } = useSidebarResize();

// Core Workflow State
const workflow = computed(() => store.currentWorkflow);
const workflowStates = ref([]);

// Modals State Hub
const modals = reactive({
  settings: false,
  storage: false,
  browsers: false,
  library: false,
});
const storageInitialTab = ref('tables');

// UI State
const state = reactive({
  showSidebar: true,
  animateBlocks: false,
});

const editState = reactive({
  editing: false,
  blockData: null,
});

// Logs Count Query via Dexie
const logsList = useLiveQuery(() => dbLogs.items.toArray(), []);
const logsCount = computed(() => logsList.value?.length || 0);

// 1. Workflow Lifecycle Composable
const {
  editorKey,
  currentFilePath,
  loadWorkflowData,
  loadWorkflowFromStorage,
  saveWorkflowToStorage,
  deleteWorkflowFromStorage,
  exportJson,
  createNewWorkflow,
} = useStudioWorkflow(automaCoreState);

const router = useRouter();
const route = useRoute();

// Route Query Synchronization Composable (?workflow=<id>)
const { initWorkflowFromRoute } = useStudioRouteSync({
  router,
  route,
  store,
  currentFilePath,
  loadWorkflowFromStorage,
  loadWorkflowData,
  getInitialWorkflow,
});

// 2. Linting & Validation (Separated from Execution)
const { lintIssues, runLiveLint, triggerManualLint } =
  useStudioLinter(automaCoreState);

// 2b. Execution Form & API
const { runModalState, isParamsValid, openRunModal, submitWorkflowExecution } =
  useStudioExecution(automaCoreState);

// 3. Canvas Composable
const {
  editorRef,
  editorInstance,
  autoFocusEnabled,
  onEditorInit,
  autoAlign,
  onUpdateNode,
  onDeleteNode,
  onDragoverEditor,
  onDropInEditor,
  goToBlock,
} = useStudioCanvas({
  commandManager,
  setAnimateBlocks: (val) => {
    state.animateBlocks = val;
  },
});

provide('workflow-editor', editorInstance);
provide('workflow', {
  editState: reactive({}),
  isPackage: false,
  data: workflow,
  columns: computed(() => workflow.value?.table || []),
});
provide('workflow-utils', {
  executeFromBlock: () => {},
});
provide('autocompleteData', ref([]));

// 4. Clipboard Composable
const {
  copySelectedElements,
  pasteCopiedElements,
  duplicateElements,
  groupBlocks,
  ungroupBlocks,
} = useStudioClipboard({ editorInstance });

// 5. Host IPC Composable
const { isHeadless, highlightNode, resetNodeHighlights } = useStudioHostIpc({
  onLoadWorkflow: (data) => loadWorkflowData(data),
  onToggleSidebar: (show) => {
    state.showSidebar = show;
  },
  goToBlock,
});

// 6. Global Keyboard Shortcuts Composable
useStudioKeyboardShortcuts({
  onSave: saveWorkflowToStorage,
  onCopy: copySelectedElements,
  onPaste: pasteCopiedElements,
  onDuplicate: duplicateElements,
  onUndo: () => commandManager.undo(),
  onRedo: () => commandManager.redo(),
  onToggleSidebar: () => {
    state.showSidebar = !state.showSidebar;
  },
});

// 7. File Import & Storage Composable
const {
  fileInputRef,
  importFileInputRef,
  availableWorkflows,
  loadAvailableWorkflows,
  loadWorkflowFromVault,
  openFilePicker,
  triggerImportWorkflow,
  onFileSelected,
  onImportFileSelected,
} = useStudioFileImport({
  loadWorkflowData,
  loadWorkflowFromStorage,
  onVaultWorkflowLoaded: () => {
    modals.library = false;
  },
});

async function onDeleteWorkflow(workflowId) {
  const success = await deleteWorkflowFromStorage(workflowId);
  if (success) {
    await loadAvailableWorkflows();
  }
}

// 8. Job Execution & Runtime Control Composable
const {
  onRunWorkflow,
  executeWorkflowFromModal,
  onKillAllBrowsers,
  onPauseJob,
  onResumeJob,
  onStopJob,
} = useStudioJobControl({
  currentFilePath,
  runModalState,
  openRunModal,
  submitWorkflowExecution,
  highlightNode,
  resetNodeHighlights,
});

// Sidebar & Block Editing Handlers
function onEditBlock(data) {
  editState.blockData = data;
  editState.editing = true;
  state.showSidebar = true;
}

function closeEditingSidebar() {
  editState.editing = false;
  editState.blockData = null;
}

function updateBlockData({ id, data }) {
  onUpdateNode({ id, data });
  if (editState.blockData && editState.blockData.id === id) {
    editState.blockData.data = { ...editState.blockData.data, ...data };
  }
}

function updateWorkflowDetails(updated) {
  store.updateWorkflowDetails(updated);
}

function updateWorkflowSettings(newSettings) {
  const currentSettings = store.currentWorkflow?.settings || {};
  const patch = newSettings?.settings ? newSettings.settings : newSettings;
  store.updateWorkflowDetails({
    settings: defu(patch, currentSettings),
  });
}

function onUpdateParam({ index, value }) {
  if (runModalState.parameters && runModalState.parameters[index]) {
    runModalState.parameters[index].value = value;
  }
}

function openModal(modalName) {
  if (['tables', 'variables', 'secrets'].includes(modalName)) {
    storageInitialTab.value = modalName;
    modals.storage = true;
    return;
  }
  if (modalName === 'logs') {
    emitter.emit('open:logs-modal');
    return;
  }
  if (modalName in modals) {
    modals[modalName] = true;
  }
}

// Watchers
watch(
  () => workflow.value?.drawflow?.nodes,
  () => {
    if (workflow.value) {
      runLiveLint(workflow.value);
    }
  },
  { deep: true }
);

function onParentMessage(event) {
  if (event.data?.type === 'automa:click-outside') {
    document.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  }
}

let removeCoreSseListener = null;

onMounted(async () => {
  window.addEventListener('message', onParentMessage);
  loadAvailableWorkflows();
  await initWorkflowFromRoute();
  if (workflow.value) {
    runLiveLint(workflow.value);
  }
  wsService.connect(automaCoreState.baseUrl);

  if (typeof addCoreEventListener === 'function') {
    removeCoreSseListener = addCoreEventListener((payload) => {
      if (!payload || typeof payload !== 'object') return;
      if (payload.blockId) {
        highlightNode?.(payload.blockId);
        store.setActiveBlock(payload.blockId);
      }
      if (payload.type === 'workflow_finished') {
        store.finishJob();
        resetNodeHighlights?.();
      }
    });
  }
});

onUnmounted(() => {
  window.removeEventListener('message', onParentMessage);
  wsService.disconnect();
  if (typeof removeCoreSseListener === 'function') {
    removeCoreSseListener();
  }
});
</script>

<style scoped>
.custom-drag {
  position: absolute;
  top: 0;
  right: 0;
  width: 4px;
  height: 100%;
  cursor: col-resize;
  z-index: 30;
  transition: background-color 0.15s;
}
.custom-drag:hover {
  background-color: var(--primary, #3b82f6);
}
</style>
