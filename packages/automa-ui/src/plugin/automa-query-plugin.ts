import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import type { App, Plugin } from 'vue'
import { SETTINGS_QUERY_KEY } from '../hooks/useAppSettingsQuery'
import { BROWSERS_QUERY_KEY } from '../hooks/useBrowsersQuery'
import { HISTORY_QUERY_KEY } from '../hooks/useJobHistoryQuery'
import { STORAGE_QUERY_KEY } from '../hooks/useStorageQuery'
import { WORKFLOWS_QUERY_KEY } from '../hooks/useWorkflowsQuery'

export interface AutomaUiPluginOptions {
  baseUrl?: string
  queryClient?: QueryClient
  enableSseAutoInvalidation?: boolean
}

export function createAutomaUiPlugin(options: AutomaUiPluginOptions = {}): Plugin {
  const baseUrl = (options.baseUrl || 'http://127.0.0.1:8765').replace(/\/$/, '')
  const queryClient =
    options.queryClient ||
    new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000 * 20, // 20s
          retry: 1,
          refetchOnWindowFocus: false,
        },
      },
    })

  let eventSource: EventSource | null = null

  function connectSse() {
    if (typeof window === 'undefined' || !window.EventSource) return
    if (options.enableSseAutoInvalidation === false) return

    try {
      eventSource = new EventSource(`${baseUrl}/api/v1/events`)

      eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data)
          const type = payload.type as string
          if (!type) return

          // 1. Browsers Fleet Invalidation
          if (type.startsWith('browser_')) {
            queryClient.invalidateQueries({ queryKey: BROWSERS_QUERY_KEY })
          }

          // 2. Workflows Invalidation
          if (type.startsWith('workflow_')) {
            queryClient.invalidateQueries({ queryKey: WORKFLOWS_QUERY_KEY })
          }

          // 3. Storage Invalidation
          if (type.startsWith('storage_')) {
            queryClient.invalidateQueries({ queryKey: STORAGE_QUERY_KEY })
          }

          // 4. Job History & Status Invalidation
          if (type.startsWith('job_')) {
            queryClient.invalidateQueries({ queryKey: HISTORY_QUERY_KEY })
          }

          // 5. Settings Invalidation
          if (type === 'settings_updated') {
            queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY })
          }
        } catch {
          // Ignore parse errors on malformed SSE frames
        }
      }

      eventSource.onerror = () => {
        // EventSource will auto-reconnect
      }
    } catch {
      // SSE connection error
    }
  }

  return {
    install(app: App) {
      app.use(VueQueryPlugin, { queryClient })
      connectSse()
    },
  }
}
