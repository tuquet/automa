// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import {
  BrowserDataTable,
  RemoteVirtualSelect,
  TablePagination,
  VirtualDataTable,
  WorkflowDataTable,
} from '../src/components'
import { useBrowserStore } from '../src/stores'

// Mock TanStack Vue Query to avoid actual network requests during unit tests
vi.mock('../src/hooks', () => ({
  useBrowsersQuery: vi.fn(() => ({
    data: ref([
      {
        id: 'b-1',
        name: 'Alpha Browser',
        browserType: 'chromium',
        proxy: { server: 'http://1.1.1.1:8080' },
      },
      { id: 'b-2', name: 'Beta Browser', browserType: 'chrome', proxy: null },
      { id: 'b-3', name: 'Gamma Browser', browserType: 'brave', proxy: null },
    ]),
    isLoading: ref(false),
    refetch: vi.fn(),
  })),
  useStartBrowserMutation: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: ref(false),
  })),
  useStopBrowserMutation: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: ref(false),
  })),
  useDeleteBrowserMutation: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: ref(false),
  })),
  useWorkflowsQuery: vi.fn(() => ({
    data: ref([
      {
        id: 'work-1',
        name: 'Workflow One',
        version: '1.0.0',
        blocksCount: 12,
        updatedAt: '2026-08-27T00:00:00Z',
        data: {},
        createdAt: '2026-08-27T00:00:00Z',
      },
      {
        id: 'work-2',
        name: 'Workflow Two',
        version: '2.1.0',
        blocksCount: 5,
        updatedAt: '2026-08-26T00:00:00Z',
        data: {},
        createdAt: '2026-08-26T00:00:00Z',
      },
    ]),
    isLoading: ref(false),
    refetch: vi.fn(),
  })),
  useDeleteWorkflowMutation: vi.fn(() => ({
    mutateAsync: vi.fn(),
    isPending: ref(false),
  })),
  useStorageTablesQuery: vi.fn(() => ({
    data: ref([]),
    isLoading: ref(false),
    refetch: vi.fn(),
  })),
  useStorageVariablesQuery: vi.fn(() => ({
    data: ref([]),
    isLoading: ref(false),
    refetch: vi.fn(),
  })),
}))

describe('@automa/ui - TanStack Virtual Data Table Suite', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  describe('TablePagination.vue', () => {
    it('renders page indicator and total rows correctly', () => {
      const wrapper = mount(TablePagination, {
        props: {
          pageIndex: 0,
          pageSize: 10,
          pageCount: 5,
          totalRows: 50,
          selectedCount: 2,
        },
      })

      expect(wrapper.text()).toContain('2 of 50 selected')
      expect(wrapper.text()).toContain('Page 1 / 5')

      const prevBtn = wrapper.find('[data-testid="btn-pagination-prev"]')
      expect(prevBtn.attributes('disabled')).toBeDefined()

      const nextBtn = wrapper.find('[data-testid="btn-pagination-next"]')
      expect(nextBtn.attributes('disabled')).toBeUndefined()
    })

    it('emits page navigation events on button click', async () => {
      const wrapper = mount(TablePagination, {
        props: {
          pageIndex: 1,
          pageSize: 10,
          pageCount: 3,
          totalRows: 30,
        },
      })

      const nextBtn = wrapper.find('[data-testid="btn-pagination-next"]')
      await nextBtn.trigger('click')
      expect(wrapper.emitted('update:pageIndex')?.[0]).toEqual([2])

      const firstBtn = wrapper.find('[data-testid="btn-pagination-first"]')
      await firstBtn.trigger('click')
      expect(wrapper.emitted('update:pageIndex')?.[1]).toEqual([0])
    })
  })

  describe('VirtualDataTable.vue', () => {
    interface TestItem {
      id: string
      name: string
      score: number
    }

    const testData: TestItem[] = [
      { id: '1', name: 'Item Alpha', score: 95 },
      { id: '2', name: 'Item Beta', score: 80 },
      { id: '3', name: 'Item Gamma', score: 60 },
    ]

    const testColumns = [
      {
        accessorKey: 'name',
        header: 'Name',
      },
      {
        accessorKey: 'score',
        header: 'Score',
      },
    ]

    it('renders column headers and table viewport', () => {
      const wrapper = mount(VirtualDataTable, {
        props: {
          data: testData,
          columns: testColumns,
          title: 'Test Table',
          enableVirtualization: false,
        },
      })

      expect(wrapper.text()).toContain('Test Table')
      expect(wrapper.text()).toContain('Name')
      expect(wrapper.text()).toContain('Score')
      expect(wrapper.text()).toContain('Item Alpha')
      expect(wrapper.text()).toContain('Item Beta')
    })

    it('filters data when search query is entered', async () => {
      const wrapper = mount(VirtualDataTable, {
        props: {
          data: testData,
          columns: testColumns,
          enableVirtualization: false,
        },
      })

      const searchInput = wrapper.find('[data-testid="input-table-search"]')
      await searchInput.setValue('Gamma')

      expect(wrapper.text()).toContain('Item Gamma')
      expect(wrapper.text()).not.toContain('Item Alpha')
    })

    it('emits row-click when row is selected', async () => {
      const wrapper = mount(VirtualDataTable, {
        props: {
          data: testData,
          columns: testColumns,
          enableVirtualization: false,
        },
      })

      const rows = wrapper.findAll('tbody tr')
      const row = rows[0]
      if (row) {
        await row.trigger('click')
      }

      expect(wrapper.emitted('row-click')?.[0]).toEqual([testData[0]])
    })
  })

  describe('BrowserDataTable.vue', () => {
    it('renders browser items and computes status correctly', async () => {
      const browserStore = useBrowserStore()
      browserStore.setBrowserOnline('b-1', true)

      const wrapper = mount(BrowserDataTable, {
        props: {
          selectable: true,
          enableVirtualization: false,
        },
      })

      expect(wrapper.text()).toContain('Alpha Browser')
      expect(wrapper.text()).toContain('Beta Browser')
      expect(wrapper.text()).toContain('ONLINE')
      expect(wrapper.text()).toContain('OFFLINE')
    })

    it('filters browsers by status tabs', async () => {
      const browserStore = useBrowserStore()
      browserStore.setBrowserOnline('b-1', true)

      const wrapper = mount(BrowserDataTable, {
        props: {
          selectable: false,
          enableVirtualization: false,
        },
      })

      const onlineTab = wrapper.find('[data-testid="filter-status-online"]')
      await onlineTab.trigger('click')

      expect(wrapper.text()).toContain('Alpha Browser')
      expect(wrapper.text()).not.toContain('Beta Browser')
    })
  })

  describe('WorkflowDataTable.vue', () => {
    it('renders workflows with name, version and block count', () => {
      const wrapper = mount(WorkflowDataTable, {
        props: {
          selectable: true,
          enableVirtualization: false,
        },
      })

      expect(wrapper.text()).toContain('Workflow One')
      expect(wrapper.text()).toContain('Workflow Two')
      expect(wrapper.text()).toContain('12 blocks')
      expect(wrapper.text()).toContain('5 blocks')
    })
  })

  describe('RemoteVirtualSelect.vue', () => {
    it('renders browser items when open', async () => {
      const wrapper = mount(RemoteVirtualSelect, {
        props: {
          id: 'select.browser.profile',
          placeholder: 'Select browser...',
        },
      })

      const trigger = wrapper.find('.automa-select-trigger')
      await trigger.trigger('click')

      expect(wrapper.text()).toContain('Alpha Browser')
    })

    it('falls back to browserStore.browsers when remote query has no items', async () => {
      const browserStore = useBrowserStore()
      browserStore.setBrowsers([
        {
          id: 'store-b-1',
          name: 'Fallback Pinia Browser',
          isOnline: true,
          createdAt: '',
          updatedAt: '',
        },
      ])

      const hooks = await import('../src/hooks')
      vi.mocked(hooks.useBrowsersQuery).mockReturnValueOnce({
        data: ref([]),
        isLoading: ref(false),
        refetch: vi.fn(),
      } as ReturnType<typeof hooks.useBrowsersQuery>)

      const wrapper = mount(RemoteVirtualSelect, {
        props: {
          id: 'select.browser.profile',
          placeholder: 'Select browser...',
        },
      })

      const trigger = wrapper.find('.automa-select-trigger')
      await trigger.trigger('click')

      expect(wrapper.text()).toContain('Fallback Pinia Browser')
    })
  })
})
