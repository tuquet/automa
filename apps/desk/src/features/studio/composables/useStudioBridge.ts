import type { Workflow } from '@automa/types'
import { getCurrentInstance, onMounted, onUnmounted, type Ref, ref, watch } from 'vue'
import { useDarkMode } from '../../../composables/useDarkMode'
import { useStudioStore } from '../stores/useStudioStore'

const globalIframeRef = ref<HTMLIFrameElement | null>(null)

let isBridgeMounted = false

export function useStudioBridge(iframeRef?: Ref<HTMLIFrameElement | null>) {
  const studioStore = useStudioStore()
  const { isDark } = useDarkMode()

  if (iframeRef) {
    watch(
      iframeRef,
      (newVal) => {
        globalIframeRef.value = newVal
      },
      { immediate: true },
    )
  }

  const targetIframe = iframeRef || globalIframeRef

  function handleWindowMessage(event: MessageEvent) {
    const msg = event.data
    if (!msg || typeof msg !== 'object') return

    // Handle workflow changes from Studio Canvas
    if (msg.type === 'automa:workflow-changed' || msg.type === 'saveWorkflow') {
      if (msg.data) {
        studioStore.setWorkflow(msg.data)
        studioStore.markDirty(true)
      }
    } else if (msg.type === 'automa:sidebar-changed') {
      if (typeof msg.showSidebar === 'boolean') {
        studioStore.setSidebarOpen(msg.showSidebar)
      }
    }
  }

  function getIframeWindow(): Window | null {
    if (targetIframe.value?.contentWindow) {
      return targetIframe.value.contentWindow
    }
    if (typeof document !== 'undefined') {
      const el = document.querySelector(
        'iframe[data-testid="studio-canvas-iframe"]',
      ) as HTMLIFrameElement | null
      if (el?.contentWindow) {
        globalIframeRef.value = el
        return el.contentWindow
      }
    }
    return null
  }

  function sendToStudio(message: {
    type: string
    data?: unknown
    workflow?: unknown
    theme?: string
    isDark?: boolean
    show?: boolean
    nodeId?: string
  }) {
    const win = getIframeWindow()
    if (!win) {
      console.warn('[StudioBridge] Target iframe contentWindow not accessible')
      return
    }
    try {
      const serialized = JSON.parse(JSON.stringify(message))
      win.postMessage(serialized, '*')
    } catch (err) {
      console.error('[StudioBridge] Failed to postMessage to iframe:', err)
    }
  }

  function syncThemeToStudio() {
    sendToStudio({
      type: 'automa:set-theme',
      theme: isDark.value ? 'dark' : 'light',
      isDark: isDark.value,
    })
  }

  function injectWorkflowIntoStudio(workflow: Partial<Workflow>) {
    sendToStudio({
      type: 'automa:set-workflow',
      data: workflow,
    })
  }

  function highlightNode(nodeId: string) {
    sendToStudio({
      type: 'highlightNode',
      nodeId,
    })
  }

  function resetNodeHighlights() {
    sendToStudio({
      type: 'resetNodeHighlights',
    })
  }

  function toggleStudioSidebar() {
    studioStore.toggleSidebar()
    sendToStudio({
      type: 'automa:set-sidebar',
      show: studioStore.isSidebarOpen,
    })
  }

  function setStudioSidebar(show: boolean) {
    studioStore.setSidebarOpen(show)
    sendToStudio({
      type: 'automa:set-sidebar',
      show,
    })
  }

  function handleKeydown(e: KeyboardEvent) {
    const isMod = e.ctrlKey || e.metaKey
    if (isMod && e.key.toLowerCase() === 'b') {
      e.preventDefault()
      toggleStudioSidebar()
    }
  }

  watch(isDark, () => {
    syncThemeToStudio()
  })

  if (getCurrentInstance()) {
    onMounted(() => {
      if (!isBridgeMounted) {
        window.addEventListener('message', handleWindowMessage)
        window.addEventListener('keydown', handleKeydown)
        isBridgeMounted = true
      }
    })

    onUnmounted(() => {
      if (isBridgeMounted) {
        window.removeEventListener('message', handleWindowMessage)
        window.removeEventListener('keydown', handleKeydown)
        isBridgeMounted = false
      }
    })
  }

  return {
    sendToStudio,
    syncThemeToStudio,
    injectWorkflowIntoStudio,
    highlightNode,
    resetNodeHighlights,
    toggleStudioSidebar,
    setStudioSidebar,
    handleWindowMessage,
  }
}
