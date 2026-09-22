/**
 * Event-Driven Workflow Execution Engine (FSM)
 * Strictly conforms to docs/SRS_BUTTON_BUSINESS_LOGIC_EVENT_DRIVEN.md
 */

import { computed, getCurrentInstance, onMounted, onUnmounted, ref } from 'vue'
import { killJob, submitJob } from '../../../infrastructure/api/client'
import { globalSseClient } from '../../../infrastructure/sse/sse-client'
import { useBrowserWaterfall } from '../../browsers/composables/useBrowserWaterfall'
import { useStudioStore } from '../stores/useStudioStore'
import { useStudioBridge } from './useStudioBridge'

export function useStudioExecution() {
  const studioStore = useStudioStore()
  const { resolveBrowser } = useBrowserWaterfall()
  const { highlightNode, resetNodeHighlights } = useStudioBridge()
  const elapsedSeconds = ref(0)
  let timerInterval: ReturnType<typeof setInterval> | null = null

  const isRunning = computed(() => studioStore.executionState === 'EXECUTING')
  const isBusy = computed(
    () =>
      studioStore.executionState === 'VALIDATING' ||
      studioStore.executionState === 'DISPATCHING' ||
      studioStore.executionState === 'TERMINATING',
  )

  function startTimer() {
    elapsedSeconds.value = 0
    if (timerInterval) clearInterval(timerInterval)
    timerInterval = setInterval(() => {
      elapsedSeconds.value += 0.1
    }, 100)
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }

  async function triggerRunOrStop() {
    // 1. If currently executing -> Action is STOP / KILL
    if (isRunning.value && studioStore.activeJobId) {
      studioStore.executionState = 'TERMINATING'
      studioStore.addLog(`Terminating active job ${studioStore.activeJobId}...`, 'warn')
      resetNodeHighlights()
      try {
        await killJob({ path: { job_id: studioStore.activeJobId } })
        studioStore.executionState = 'IDLE'
        studioStore.activeJobId = null
        stopTimer()
      } catch (err: unknown) {
        const errorMsg = (err as { message?: string })?.message || 'Failed to kill job'
        studioStore.addLog(`Error stopping job: ${errorMsg}`, 'error')
        studioStore.executionState = 'IDLE'
      }
      return
    }

    if (studioStore.executionState !== 'IDLE') return

    // 2. Phase 1: Validation
    resetNodeHighlights()
    studioStore.executionState = 'VALIDATING'
    studioStore.lastError = null
    studioStore.clearLogs()
    studioStore.isConsoleOpen = true

    if (!studioStore.workflow) {
      studioStore.lastError = 'No workflow to execute'
      studioStore.executionState = 'FAILED'
      setTimeout(() => {
        studioStore.executionState = 'IDLE'
      }, 2000)
      return
    }

    // 🌊 Pre-flight Cascading & Browser Resolution Waterfall (SRS Section 2.1)
    const resolvedBrowserId = await resolveBrowser()
    if (!resolvedBrowserId) {
      studioStore.executionState = 'IDLE'
      return
    }

    studioStore.selectedBrowserId = resolvedBrowserId

    // 3. Phase 2: Dispatching API
    studioStore.executionState = 'DISPATCHING'
    studioStore.addLog(
      `Dispatching workflow execution with browser [${resolvedBrowserId}]...`,
      'info',
    )

    try {
      const response = await submitJob({
        body: {
          workflowData: studioStore.workflow as Record<string, unknown>,
          options: {
            headless: false,
          },
        },
      })

      const jobId =
        response.data?.jobId || (response.data as unknown as { job_id?: string })?.job_id
      if (response.data && jobId) {
        studioStore.activeJobId = jobId
        studioStore.executionState = 'EXECUTING'
        studioStore.addLog(`Job started successfully. ID: ${jobId}`, 'info')
        startTimer()
      } else {
        throw new Error(
          response.error ? JSON.stringify(response.error) : 'Unknown response from core',
        )
      }
    } catch (err: unknown) {
      const errorMsg = (err as { message?: string })?.message || 'Failed to submit workflow job'
      studioStore.executionState = 'FAILED'
      studioStore.lastError = errorMsg
      studioStore.addLog(`Execution error: ${errorMsg}`, 'error')
      resetNodeHighlights()
      setTimeout(() => {
        studioStore.executionState = 'IDLE'
      }, 3000)
    }
  }

  // 4. Phase 3: Event-Driven Reaction (Subscribing to SSE /api/v1/events)
  function handleSseEvent(event: {
    type: string
    jobId?: string
    message?: string
    status?: string
    error?: string
    nodeId?: string
    node_id?: string
  }) {
    if (event.jobId && studioStore.activeJobId && event.jobId !== studioStore.activeJobId) {
      return
    }

    if (
      event.type === 'step:start' ||
      event.type === 'node:start' ||
      event.type === 'node:executing'
    ) {
      const targetNodeId = event.nodeId || event.node_id
      if (targetNodeId) {
        highlightNode(targetNodeId)
      }
    } else if (event.type === 'task:log' && event.message) {
      studioStore.addLog(event.message, 'info')
    } else if (event.type === 'task:completed' || event.status === 'completed') {
      resetNodeHighlights()
      studioStore.addLog('Workflow execution completed successfully.', 'info')
      studioStore.executionState = 'COMPLETED'
      stopTimer()
      setTimeout(() => {
        studioStore.executionState = 'IDLE'
        studioStore.activeJobId = null
      }, 2000)
    } else if (event.type === 'task:error' || event.status === 'failed') {
      resetNodeHighlights()
      const errMsg = event.error || event.message || 'Workflow execution failed'
      studioStore.addLog(`Workflow error: ${errMsg}`, 'error')
      studioStore.executionState = 'FAILED'
      studioStore.lastError = errMsg
      stopTimer()
      setTimeout(() => {
        studioStore.executionState = 'IDLE'
        studioStore.activeJobId = null
      }, 3000)
    }
  }

  if (getCurrentInstance()) {
    let unsubscribeSse: (() => void) | null = null

    onMounted(() => {
      globalSseClient.connect()
      unsubscribeSse = globalSseClient.subscribe(handleSseEvent)
    })

    onUnmounted(() => {
      stopTimer()
      if (unsubscribeSse) {
        unsubscribeSse()
        unsubscribeSse = null
      }
    })
  }

  return {
    isRunning,
    isBusy,
    elapsedSeconds,
    triggerRunOrStop,
    handleSseEvent,
  }
}
