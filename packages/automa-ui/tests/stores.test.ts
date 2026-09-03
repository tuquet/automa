import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import {
  useBrowserStore,
  useCampaignStore,
  useExecutionStore,
  useSettingsStore,
  useStorageStore,
  useWorkflowStore,
} from '../src/stores'

describe('@automa/ui - 6 Pinia Domain Stores', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('1. useWorkflowStore', () => {
    it('initializes with default workflow and handles mutations', () => {
      const store = useWorkflowStore()
      expect(store.workflow.name).toBe('new-workflow')
      expect(store.isDirty).toBe(false)
      expect(store.fsmState).toBe('IDLE')

      store.setWorkflow({ name: 'custom-flow' }, 'wf_123')
      expect(store.workflow.name).toBe('custom-flow')
      expect(store.workflowId).toBe('wf_123')

      store.markDirty(true)
      expect(store.isDirty).toBe(true)

      store.toggleBreakpoint('node_1')
      expect(store.breakpoints).toContain('node_1')
      store.toggleBreakpoint('node_1')
      expect(store.breakpoints).not.toContain('node_1')
    })
  })

  describe('2. useBrowserStore', () => {
    it('manages browser profiles and filtering', () => {
      const store = useBrowserStore()
      expect(store.browsers).toHaveLength(0)

      store.setBrowsers([
        {
          id: 'chrome_1',
          name: 'Chrome Clean',
          userAgent: 'Mozilla/5.0 Chrome',
          isOnline: false,
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
        {
          id: 'brave_1',
          name: 'Brave Stealth',
          userAgent: 'Mozilla/5.0 Brave',
          isOnline: true,
          createdAt: '2026-01-01',
          updatedAt: '2026-01-01',
        },
      ])

      expect(store.browsers).toHaveLength(2)
      store.setSearchQuery('brave')
      expect(store.filteredBrowsers).toHaveLength(1)
      expect(store.filteredBrowsers[0]?.id).toBe('brave_1')

      store.setBrowserOnline('brave_1', true)
      expect(store.onlineCount).toBe(1)
    })
  })

  describe('3. useExecutionStore', () => {
    it('tracks active jobs, FSM states and appends logs', () => {
      const store = useExecutionStore()
      expect(store.isRunning).toBe(false)

      store.setActiveJob('job_999')
      expect(store.activeJobId).toBe('job_999')
      expect(store.fsmState).toBe('EXECUTING')
      expect(store.isRunning).toBe(true)
      expect(store.isConsoleOpen).toBe(true)

      store.appendLog('Starting workflow execution...', 'info', 'block_1')
      store.appendLog('Element not found', 'error', 'block_2')

      expect(store.logCount).toBe(2)
      expect(store.errorLogs).toHaveLength(1)

      store.clearLogs()
      expect(store.logCount).toBe(0)
    })
  })

  describe('4. useStorageStore', () => {
    it('manages tables, variables, and credentials', () => {
      const store = useStorageStore()
      store.setVariables([
        {
          id: 'var_1',
          key: 'API_URL',
          name: 'API Url',
          value: { url: 'https://example.com' },
        },
      ])
      expect(store.variableCount).toBe(1)

      store.addVariable({
        id: 'var_2',
        key: 'TIMEOUT',
        name: 'Timeout',
        value: { timeout: 5000 },
      })
      expect(store.variableCount).toBe(2)

      store.removeVariable('API_URL')
      expect(store.variableCount).toBe(1)
    })
  })

  describe('5. useCampaignStore', () => {
    it('tracks matrix slots and statuses', () => {
      const store = useCampaignStore()
      store.setCampaign('camp_1', 'Social Matrix')
      expect(store.campaignName).toBe('Social Matrix')

      store.updateSlot(0, { status: 'running', progressPercent: 50 })
      store.updateSlot(1, { status: 'completed', progressPercent: 100 })

      expect(store.activeSlots).toHaveLength(2)
      expect(store.completedSlots).toBe(1)
    })
  })

  describe('6. useSettingsStore', () => {
    it('manages theme and daemon health', () => {
      const store = useSettingsStore()
      expect(store.theme).toBe('dark')
      store.setTheme('light')
      expect(store.theme).toBe('light')

      store.setDaemonHealthy(true)
      expect(store.isDaemonHealthy).toBe(true)
    })
  })
})
