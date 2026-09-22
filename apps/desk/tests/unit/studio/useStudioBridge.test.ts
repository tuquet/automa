import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useStudioBridge } from '../../../src/features/studio/composables/useStudioBridge'
import { useStudioStore } from '../../../src/features/studio/stores/useStudioStore'

describe('useStudioBridge', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('updates store workflow and dirty state on automa:workflow-changed message', () => {
    const iframeRef = ref<HTMLIFrameElement | null>(null)
    const studioStore = useStudioStore()

    const bridge = useStudioBridge(iframeRef)

    const event = new MessageEvent('message', {
      data: {
        type: 'automa:workflow-changed',
        data: {
          name: 'Updated Workflow from Canvas',
          drawflow: { nodes: [{ id: 'n1' }], edges: [] },
        },
      },
    })

    bridge.handleWindowMessage(event)

    expect(studioStore.isDirty).toBe(true)
    expect(studioStore.workflow?.name).toBe('Updated Workflow from Canvas')
  })

  it('sends postMessage to iframe when injectWorkflowIntoStudio is called', () => {
    const postMessageMock = vi.fn()
    const mockIframe = {
      contentWindow: {
        postMessage: postMessageMock,
      },
    } as unknown as HTMLIFrameElement

    const iframeRef = ref<HTMLIFrameElement | null>(mockIframe)
    const { injectWorkflowIntoStudio } = useStudioBridge(iframeRef)

    injectWorkflowIntoStudio({ name: 'Injected Workflow' })

    expect(postMessageMock).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'automa:set-workflow',
        data: { name: 'Injected Workflow' },
      }),
      '*',
    )
  })

  it('toggles sidebar and sends postMessage to iframe', () => {
    const postMessageMock = vi.fn()
    const mockIframe = {
      contentWindow: {
        postMessage: postMessageMock,
      },
    } as unknown as HTMLIFrameElement

    const iframeRef = ref<HTMLIFrameElement | null>(mockIframe)
    const studioStore = useStudioStore()
    const { toggleStudioSidebar } = useStudioBridge(iframeRef)

    expect(studioStore.isSidebarOpen).toBe(true)

    toggleStudioSidebar()

    expect(studioStore.isSidebarOpen).toBe(false)
    expect(postMessageMock).toHaveBeenCalledWith(
      {
        type: 'automa:set-sidebar',
        show: false,
      },
      '*',
    )
  })

  it('updates store isSidebarOpen on automa:sidebar-changed message', () => {
    const iframeRef = ref<HTMLIFrameElement | null>(null)
    const studioStore = useStudioStore()
    const bridge = useStudioBridge(iframeRef)

    const event = new MessageEvent('message', {
      data: {
        type: 'automa:sidebar-changed',
        showSidebar: false,
      },
    })

    bridge.handleWindowMessage(event)

    expect(studioStore.isSidebarOpen).toBe(false)
  })
})
