import type { BrowserResponse } from '@automa/types'
import { onMounted, onUnmounted } from 'vue'
import { useBrowserStore } from '../stores/useBrowserStore'
import { useCampaignStore } from '../stores/useCampaignStore'
import { useExecutionStore } from '../stores/useExecutionStore'
import { useStorageStore } from '../stores/useStorageStore'
import { useWorkflowStore } from '../stores/useWorkflowStore'

export interface SseSubscriberClient {
  connect?: () => void
  subscribe: (handler: (event: Record<string, unknown>) => void) => () => void
}

/**
 * Canonical SSE to Pinia Domain Stores Reactive Reflection Composable
 * Dispatches real-time server events into 6 domain stores.
 */
export function useBindStoreSse(sseClient: SseSubscriberClient) {
  const executionStore = useExecutionStore()
  const workflowStore = useWorkflowStore()
  const browserStore = useBrowserStore()
  const campaignStore = useCampaignStore()
  const storageStore = useStorageStore()

  let unsubscribe: (() => void) | null = null

  onMounted(() => {
    if (typeof sseClient.connect === 'function') {
      sseClient.connect()
    }

    unsubscribe = sseClient.subscribe((event: Record<string, unknown>) => {
      const eventType = (event.type || event.status || '') as string

      // 1. Job Telemetry & Execution Logs
      if (eventType === 'job_log' || event.message) {
        const msg = (event.message || '') as string
        const lvl = (event.level || 'info') as 'info' | 'warn' | 'error' | 'debug'
        const blockId = (event.blockId || event.block_id) as string | undefined

        executionStore.appendLog(msg, lvl, blockId)
        if (blockId) {
          workflowStore.setActiveNode(blockId)
        }
      }

      // 2. Job Lifecycle FSM Transitions
      if (
        eventType === 'job_status' ||
        eventType === 'job_started' ||
        eventType === 'job_completed' ||
        eventType === 'job_failed'
      ) {
        const st = (event.status || eventType) as string
        if (st === 'running' || st === 'job_started') {
          executionStore.setFsmState('EXECUTING')
          if (event.jobId && typeof event.jobId === 'string')
            executionStore.setActiveJob(event.jobId)
        } else if (st === 'completed' || st === 'job_completed') {
          executionStore.setFsmState('COMPLETED')
          workflowStore.setActiveNode(null)
        } else if (st === 'failed' || st === 'job_failed') {
          executionStore.setFsmState('FAILED')
          if (event.error && typeof event.error === 'string')
            executionStore.setLastError(event.error)
          workflowStore.setActiveNode(null)
        } else if (st === 'stopped' || st === 'killed') {
          executionStore.setFsmState('IDLE')
          workflowStore.setActiveNode(null)
        }
      }

      // 3. Browser Fleet Mutations
      if (eventType === 'browser_created' && event.browser) {
        browserStore.addBrowser(event.browser as unknown as BrowserResponse)
      } else if (eventType === 'browser_deleted' && typeof event.id === 'string') {
        browserStore.removeBrowser(event.id)
      } else if (eventType === 'browser_online' && typeof event.id === 'string') {
        browserStore.setBrowserOnline(event.id, true)
      } else if (eventType === 'browser_offline' && typeof event.id === 'string') {
        browserStore.setBrowserOnline(event.id, false)
      }

      // 4. Campaign Matrix Telemetry
      if (eventType === 'campaign_slot_progress' && typeof event.slotIndex === 'number') {
        const slotStatus =
          event.slotStatus === 'completed' ||
          event.slotStatus === 'failed' ||
          event.slotStatus === 'idle'
            ? event.slotStatus
            : 'running'
        campaignStore.updateSlot(event.slotIndex, {
          progressPercent: typeof event.progressPercent === 'number' ? event.progressPercent : 0,
          status: slotStatus,
        })
      } else if (eventType === 'campaign_aborted') {
        campaignStore.setCampaignStatus('aborted')
      }

      // 5. Storage Cache Invalidation
      if (
        eventType === 'storage_table_changed' ||
        eventType === 'storage_variable_changed' ||
        eventType === 'storage_credential_changed'
      ) {
        storageStore.isLoading = false
      }
    })
  })

  onUnmounted(() => {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  })
}
