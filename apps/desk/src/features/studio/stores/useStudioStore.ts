/**
 * Feature-Scoped Composite Pinia Store for Studio
 * Composes domain state from useWorkflowStore and useExecutionStore (DRY & Single Source of Truth)
 */

import type { ButtonExecutionState, Workflow } from '@automa/types'
import { useExecutionStore, useWorkflowStore } from '@automa/ui'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useStudioStore = defineStore('studio', () => {
  const workflowStore = useWorkflowStore()
  const executionStore = useExecutionStore()

  const workflowPath = ref<string>('')
  const selectedWorkflowId = ref<string>('')
  const selectedBrowserId = ref<string>('default')
  const isSidebarOpen = ref<boolean>(true)

  function setWorkflow(data: Partial<Workflow>) {
    workflowStore.setWorkflow(data)
  }

  function markDirty(dirty = true) {
    workflowStore.markDirty(dirty)
  }

  function addLog(message: string, level: 'info' | 'warn' | 'error' = 'info') {
    executionStore.appendLog(message, level)
  }

  function clearLogs() {
    executionStore.clearLogs()
  }

  return {
    // Workflow State (delegated)
    workflow: computed({
      get: () => workflowStore.workflow,
      set: (val: Partial<Workflow>) => workflowStore.setWorkflow(val),
    }),
    workflowPath,
    selectedWorkflowId,
    isDirty: computed({
      get: () => workflowStore.isDirty,
      set: (val: boolean) => workflowStore.markDirty(val),
    }),
    selectedBrowserId,
    isSidebarOpen,

    // Execution & FSM State (delegated)
    executionState: computed({
      get: () => executionStore.fsmState,
      set: (val: ButtonExecutionState) => executionStore.setFsmState(val),
    }),
    activeJobId: computed({
      get: () => executionStore.activeJobId,
      set: (val: string | null) => executionStore.setActiveJob(val),
    }),
    executionLogs: computed(() => executionStore.logs),
    isConsoleOpen: computed({
      get: () => executionStore.isConsoleOpen,
      set: (val: boolean) => executionStore.setConsoleOpen(val),
    }),
    lastError: computed({
      get: () => executionStore.lastError,
      set: (val: string | null) => executionStore.setLastError(val),
    }),

    // Methods
    setWorkflow,
    markDirty,
    addLog,
    clearLogs,
    toggleConsole: () => executionStore.setConsoleOpen(!executionStore.isConsoleOpen),
    toggleSidebar: () => {
      isSidebarOpen.value = !isSidebarOpen.value
    },
    setSidebarOpen: (open: boolean) => {
      isSidebarOpen.value = open
    },
  }
})
