import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useStudioExecution } from '../../../src/features/studio/composables/useStudioExecution'
import { useStudioStore } from '../../../src/features/studio/stores/useStudioStore'

// Mock API client
vi.mock('../../../src/infrastructure/api/client', () => ({
  submitJob: vi.fn().mockResolvedValue({
    data: { jobId: 'job-test-123' },
  }),
  killJob: vi.fn().mockResolvedValue({
    data: { success: true },
  }),
}))

// Mock SSE client
vi.mock('../../../src/infrastructure/sse/sse-client', () => ({
  globalSseClient: {
    connect: vi.fn(),
    subscribe: vi.fn().mockReturnValue(() => {}),
  },
}))

// Mock Browser Waterfall
vi.mock('../../../src/features/browsers/composables/useBrowserWaterfall', () => ({
  useBrowserWaterfall: vi.fn(() => ({
    resolveBrowser: vi.fn().mockResolvedValue('browser-test-default'),
  })),
}))

describe('useStudioExecution (Button FSM)', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('initializes in IDLE state with not running', () => {
    const { isRunning, isBusy } = useStudioExecution()
    expect(isRunning.value).toBe(false)
    expect(isBusy.value).toBe(false)
  })

  it('transitions through FSM states upon triggerRunOrStop', async () => {
    const studioStore = useStudioStore()
    studioStore.setWorkflow({ name: 'Test Workflow', drawflow: { nodes: [], edges: [] } })

    const { triggerRunOrStop, isRunning } = useStudioExecution()

    await triggerRunOrStop()

    expect(studioStore.activeJobId).toBe('job-test-123')
    expect(studioStore.executionState).toBe('EXECUTING')
    expect(isRunning.value).toBe(true)
    expect(studioStore.executionLogs.length).toBeGreaterThan(0)
  })

  it('terminates active job when triggerRunOrStop is called during execution', async () => {
    const studioStore = useStudioStore()
    studioStore.activeJobId = 'job-test-123'
    studioStore.executionState = 'EXECUTING'

    const { triggerRunOrStop, isRunning } = useStudioExecution()

    await triggerRunOrStop()

    expect(studioStore.activeJobId).toBeNull()
    expect(studioStore.executionState).toBe('IDLE')
    expect(isRunning.value).toBe(false)
  })
})
