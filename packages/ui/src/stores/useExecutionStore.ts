import type { ButtonExecutionState, ExecutionStoreState } from '@automa/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useExecutionStore = defineStore('execution', () => {
  const activeJobId = ref<string | null>(null)
  const fsmState = ref<ButtonExecutionState>('IDLE')
  const logs = ref<ExecutionStoreState['logs']>([])
  const lastError = ref<string | null>(null)
  const isConsoleOpen = ref<boolean>(false)

  const isRunning = computed(
    () => fsmState.value === 'EXECUTING' || fsmState.value === 'DISPATCHING',
  )
  const logCount = computed(() => logs.value.length)
  const errorLogs = computed(() => logs.value.filter((l) => l.level === 'error'))

  function setActiveJob(jobId: string | null) {
    activeJobId.value = jobId
    if (jobId) {
      fsmState.value = 'EXECUTING'
      isConsoleOpen.value = true
    } else {
      fsmState.value = 'IDLE'
    }
  }

  function setFsmState(state: ButtonExecutionState) {
    fsmState.value = state
  }

  function appendLog(
    message: string,
    level: ExecutionStoreState['logs'][0]['level'] = 'info',
    blockId?: string,
  ) {
    const entry: ExecutionStoreState['logs'][0] = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toLocaleTimeString(),
      level,
      message,
    }
    if (blockId !== undefined) {
      entry.blockId = blockId
    }
    logs.value.push(entry)
  }

  function clearLogs() {
    logs.value = []
  }

  function setConsoleOpen(open: boolean) {
    isConsoleOpen.value = open
  }

  function setLastError(error: string | null) {
    lastError.value = error
  }

  return {
    activeJobId,
    fsmState,
    logs,
    lastError,
    isConsoleOpen,
    isRunning,
    logCount,
    errorLogs,
    setActiveJob,
    setFsmState,
    appendLog,
    clearLogs,
    setConsoleOpen,
    setLastError,
  }
})
