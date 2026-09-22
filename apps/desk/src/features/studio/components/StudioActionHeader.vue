<script setup lang="ts">
import { AutomaButton, Button, RemoteVirtualSelect } from '@automa/ui'
import {
  Clock,
  Database,
  GitBranch,
  Globe,
  PanelLeft,
  PanelLeftClose,
  Settings,
  Terminal,
} from 'lucide-vue-next'
import { onMounted, onUnmounted, ref } from 'vue'
import { useLayoutModals } from '../../../shared/composables/useLayoutModals'
import { useStudioBridge } from '../composables/useStudioBridge'
import { useStudioExecution } from '../composables/useStudioExecution'
import { useStudioWorkflow } from '../composables/useStudioWorkflow'
import { useStudioStore } from '../stores/useStudioStore'

defineOptions({ name: 'StudioActionHeader' })

const fileInputRef = ref<HTMLInputElement | null>(null)
const studioStore = useStudioStore()
const { isRunning, elapsedSeconds, triggerRunOrStop } = useStudioExecution()
const {
  isSaving,
  isLinting,
  handleSaveWorkflow,
  handleLintWorkflow,
  handleExportWorkflow,
  handleImportWorkflow,
  handleFileInputChange,
  loadWorkflowById,
  createNewWorkflow,
} = useStudioWorkflow()
const { toggleStudioSidebar } = useStudioBridge()
const { openBrowsersModal, openStorageModal, openHistoryModal, openSettingsModal } =
  useLayoutModals()

function handleCreateBrowser() {
  openBrowsersModal()
}

async function handleWorkflowSelect(id: string | number) {
  if (!id) return
  await loadWorkflowById(String(id))
}

function handleCreateWorkflow() {
  createNewWorkflow()
}

function triggerImport() {
  handleImportWorkflow(fileInputRef.value)
}

function handleKeydown(e: KeyboardEvent) {
  const isMod = e.ctrlKey || e.metaKey
  if (isMod && e.key.toLowerCase() === 'o') {
    e.preventDefault()
    triggerImport()
  } else if (isMod && e.key.toLowerCase() === 's') {
    e.preventDefault()
    if (studioStore.isDirty) {
      handleSaveWorkflow()
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('automa:command-import-workflow', triggerImport)
  window.addEventListener('automa:command-export-workflow', handleExportWorkflow)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('automa:command-import-workflow', triggerImport)
  window.removeEventListener('automa:command-export-workflow', handleExportWorkflow)
})
</script>

<template>
  <div
    data-testid="layout-studio-action-header"
    class="h-11 w-full px-3.5 bg-card/90 backdrop-blur-md border-b border-border flex items-center justify-between gap-3 select-none z-20 transition-colors text-foreground"
  >
    <!-- Hidden File Input for Web Import Fallback -->
    <input
      ref="fileInputRef"
      type="file"
      accept=".json,.workflow.json,.automa.json"
      class="hidden"
      data-testid="file-import-input"
      @change="handleFileInputChange"
    />
    <!-- Left: Sidebar Toggle, Workflow Selector & Browser Picker -->
    <div
      data-testid="studio-workflow-info"
      class="flex items-center gap-2"
    >
      <!-- Single Toggle Sidebar Button -->
      <Button
        variant="ghost"
        size="sm"
        data-testid="btn-toggle-studio-sidebar"
        :title="studioStore.isSidebarOpen ? 'Hide Block Palette (Ctrl+B)' : 'Show Block Palette (Ctrl+B)'"
        class="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
        @click="toggleStudioSidebar"
      >
        <PanelLeftClose v-if="studioStore.isSidebarOpen" class="size-4" />
        <PanelLeft v-else class="size-4" />
      </Button>

      <div class="h-3.5 w-px bg-border"></div>

      <!-- Workflow Selector via RemoteVirtualSelect -->
      <div
        data-testid="studio-workflow-picker-group"
        class="flex items-center gap-1.5 min-w-[200px]"
      >
        <GitBranch class="size-3.5 text-primary shrink-0" :stroke-width="1.8" />
        <div class="flex-1">
          <RemoteVirtualSelect
            id="select.storage.workflow"
            v-model="studioStore.selectedWorkflowId"
            :placeholder="studioStore.workflow?.name || 'Select workflow...'"
            @update:model-value="handleWorkflowSelect"
            @create="handleCreateWorkflow"
          />
        </div>
        <span
          v-if="studioStore.isDirty"
          class="size-1.5 rounded-full bg-amber-500 shrink-0"
          title="Unsaved changes"
        />
      </div>

      <div class="h-3.5 w-px bg-border"></div>

      <!-- Browser Profile Selector via RemoteVirtualSelect -->
      <div
        data-testid="studio-browser-picker-group"
        class="flex items-center gap-1.5 min-w-[200px]"
      >
        <Globe class="size-3.5 text-muted-foreground shrink-0" :stroke-width="1.8" />
        <div class="flex-1">
          <RemoteVirtualSelect
            id="select.browser.profile"
            v-model="studioStore.selectedBrowserId"
            placeholder="Select browser..."
            @create="handleCreateBrowser"
          />
        </div>
      </div>
    </div>

    <!-- Right: Action Buttons (Run/Stop, Save, Lint, Console Drawer & Popup Modals) -->
    <div
      data-testid="studio-action-buttons-group"
      class="flex items-center gap-1.5"
    >
      <!-- All-in-One Popup Tables Navigation -->
      <Button
        variant="ghost"
        size="icon-sm"
        data-testid="btn-open-browsers-modal"
        title="Browsers"
        class="text-muted-foreground hover:text-foreground"
        @click="openBrowsersModal"
      >
        <Globe class="size-3.5" />
      </Button>

      <Button
        variant="ghost"
        size="icon-sm"
        data-testid="btn-open-storage-modal"
        title="Storage"
        class="text-muted-foreground hover:text-foreground"
        @click="openStorageModal"
      >
        <Database class="size-3.5" />
      </Button>

      <Button
        variant="ghost"
        size="icon-sm"
        data-testid="btn-open-history-modal"
        title="History"
        class="text-muted-foreground hover:text-foreground"
        @click="openHistoryModal"
      >
        <Clock class="size-3.5" />
      </Button>

      <Button
        variant="ghost"
        size="icon-sm"
        data-testid="btn-open-settings-modal"
        title="Settings"
        class="text-muted-foreground hover:text-foreground"
        @click="openSettingsModal"
      >
        <Settings class="size-3.5" />
      </Button>

      <div class="h-3.5 w-px bg-border mx-0.5"></div>

      <!-- Import Button -->
      <AutomaButton
        id="btn.workflow.import"
        size="sm"
        variant="ghost"
        label="Import"
        title="Import Workflow (Ctrl+O)"
        :disabled="isRunning"
        @click="triggerImport"
      />

      <!-- Export Button -->
      <AutomaButton
        id="btn.workflow.export"
        size="sm"
        variant="ghost"
        label="Export"
        title="Export JSON"
        :disabled="!studioStore.workflow || isRunning"
        @click="handleExportWorkflow"
      />

      <!-- Lint Button -->
      <AutomaButton
        id="btn.workflow.lint"
        size="sm"
        variant="ghost"
        label="Lint"
        :loading="isLinting"
        :disabled="isRunning"
        title="Lint"
        @click="handleLintWorkflow"
      />

      <!-- Save Button -->
      <AutomaButton
        id="btn.workflow.save"
        size="sm"
        variant="outline"
        label="Save"
        :loading="isSaving"
        :disabled="!studioStore.isDirty"
        title="Save (Ctrl+S)"
        @click="handleSaveWorkflow"
      />

      <!-- Run / Stop Button (FSM) -->
      <AutomaButton
        :id="isRunning ? 'btn.workflow.stop' : 'btn.workflow.run'"
        size="sm"
        :variant="isRunning ? 'destructive' : 'default'"
        @click="triggerRunOrStop"
      >
        <template v-if="isRunning">
          <span class="font-mono tabular-nums">Stop ({{ elapsedSeconds.toFixed(1) }}s)</span>
        </template>
      </AutomaButton>

      <div class="h-3.5 w-px bg-border mx-0.5"></div>

      <!-- Toggle Console Drawer Button -->
      <Button
        variant="ghost"
        size="sm"
        data-testid="btn-view-job-logs"
        title="Console Logs"
        class="gap-1.5 px-2 text-xs font-medium"
        :class="studioStore.isConsoleOpen ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground'"
        @click="studioStore.toggleConsole"
      >
        <Terminal class="size-3.5" :stroke-width="1.8" />
        <span>Logs</span>
        <span
          v-if="studioStore.executionLogs.length > 0"
          class="size-1.5 rounded-full bg-primary animate-pulse"
        ></span>
      </Button>
    </div>
  </div>
</template>
