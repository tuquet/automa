<script setup lang="ts">
import type { BrowserResponse } from '@automa/types/api'
import type { CellContext, ColumnDef, HeaderContext } from '@tanstack/vue-table'
import { Plus, RefreshCw, Server, Square, Trash2 } from 'lucide-vue-next'
import { computed, h, ref } from 'vue'
import {
  useBrowsersQuery,
  useDeleteBrowserMutation,
  useStartBrowserMutation,
  useStopBrowserMutation,
} from '../hooks'
import { useBrowserStore } from '../stores'
import AutomaButton from './AutomaButton.vue'
import { Badge, Button, Checkbox } from './ui'
import VirtualDataTable from './VirtualDataTable.vue'

const props = withDefaults(
  defineProps<{
    items?: BrowserResponse[]
    enableServerSearch?: boolean
    enableVirtualization?: boolean
    pageSize?: number
    selectable?: boolean
  }>(),
  {
    items: undefined,
    enableServerSearch: false,
    enableVirtualization: true,
    pageSize: 20,
    selectable: true,
  },
)

const emit = defineEmits<{
  'select-browser': [browser: BrowserResponse]
  'create-browser': []
  'edit-browser': [browser: BrowserResponse]
  'launch-browser': [browserId: string]
  'stop-browser': [browserId: string]
  'delete-browser': [browserId: string]
}>()

const browserStore = useBrowserStore()
const startBrowserMutation = useStartBrowserMutation()
const stopBrowserMutation = useStopBrowserMutation()
const deleteBrowserMutation = useDeleteBrowserMutation()

// Query hooks
const searchQuery = ref('')
const statusFilter = ref<'all' | 'online' | 'offline'>('all')

const {
  data: remoteBrowsers,
  isLoading,
  refetch,
} = useBrowsersQuery({
  search: computed(() => (props.enableServerSearch ? searchQuery.value : undefined)),
})

// Sync remote data into store when available
const allBrowsers = computed<BrowserResponse[]>(() => {
  if (props.items !== undefined) {
    return props.items
  }
  if (remoteBrowsers.value && remoteBrowsers.value.length > 0) {
    return remoteBrowsers.value
  }
  return browserStore.browsers as BrowserResponse[]
})

// Filtered browsers by status tab
const filteredBrowsers = computed(() => {
  return allBrowsers.value.filter((b) => {
    const isOnline = browserStore.onlineBrowserIds.includes(b.id)
    if (statusFilter.value === 'online') return isOnline
    if (statusFilter.value === 'offline') return !isOnline
    return true
  })
})

const onlineCount = computed(
  () => allBrowsers.value.filter((b) => browserStore.onlineBrowserIds.includes(b.id)).length,
)

// Actions
async function onLaunch(browserId: string) {
  emit('launch-browser', browserId)
  await startBrowserMutation.mutateAsync(browserId)
  browserStore.setBrowserOnline(browserId, true)
}

async function onStop(browserId: string) {
  emit('stop-browser', browserId)
  await stopBrowserMutation.mutateAsync(browserId)
  browserStore.setBrowserOnline(browserId, false)
}

async function onDelete(browserId: string) {
  if (window.confirm(`Are you sure you want to delete browser "${browserId}"?`)) {
    emit('delete-browser', browserId)
    await deleteBrowserMutation.mutateAsync(browserId)
    browserStore.removeBrowser(browserId)
  }
}

// TanStack Column Definitions
const columns: ColumnDef<BrowserResponse>[] = [
  ...(props.selectable
    ? [
        {
          id: 'select',
          header: ({ table }: HeaderContext<BrowserResponse, unknown>) =>
            h(Checkbox, {
              checked: table.getIsAllPageRowsSelected(),
              indeterminate: table.getIsSomePageRowsSelected(),
              'onUpdate:checked': (val: boolean) => table.toggleAllPageRowsSelected(!!val),
              'aria-label': 'Select all rows',
              class: 'translate-y-[2px]',
            }),
          cell: ({ row }: CellContext<BrowserResponse, unknown>) =>
            h(Checkbox, {
              checked: row.getIsSelected(),
              'onUpdate:checked': (val: boolean) => row.toggleSelected(!!val),
              'aria-label': 'Select row',
              class: 'translate-y-[2px]',
              onClick: (e: MouseEvent) => e.stopPropagation(),
            }),
          size: 36,
          enableSorting: false,
        } as ColumnDef<BrowserResponse>,
      ]
    : []),
  {
    id: 'status',
    header: 'Status',
    accessorFn: (row) => (browserStore.onlineBrowserIds.includes(row.id) ? 'online' : 'offline'),
    cell: ({ row }) => {
      const isOnline = browserStore.onlineBrowserIds.includes(row.original.id)
      return h(
        Badge,
        {
          variant: isOnline ? 'success' : 'secondary',
          class: 'gap-1.5 font-mono text-[11px] uppercase tracking-wider',
        },
        () => [
          h('span', {
            class: [
              'size-1.5 rounded-full',
              isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-muted-foreground/50',
            ],
          }),
          isOnline ? 'ONLINE' : 'OFFLINE',
        ],
      )
    },
    size: 110,
  },
  {
    id: 'name',
    header: 'Profile',
    accessorKey: 'name',
    cell: ({ row }) => {
      const b = row.original
      const hasDistinctId = b.id && b.id !== b.name
      return h('div', { class: 'flex items-center gap-1.5' }, [
        h('span', { class: 'font-medium text-xs text-foreground truncate' }, b.name),
        hasDistinctId
          ? h(
              'span',
              { class: 'font-mono text-[10px] text-muted-foreground/60 truncate' },
              `(${b.id})`,
            )
          : null,
      ])
    },
  },
  {
    id: 'timezone',
    header: 'Timezone',
    accessorKey: 'timezone',
    cell: ({ row }) => {
      const tz = row.original.timezone
      return h(
        'span',
        { class: 'font-mono text-[11px] text-muted-foreground' },
        tz || 'UTC (System)',
      )
    },
    size: 140,
  },
  {
    id: 'proxy',
    header: 'Proxy',
    accessorFn: (row) => {
      const extra = row as unknown as Record<string, unknown>
      const proxy = extra.proxy as { server?: string } | undefined
      return proxy?.server || 'direct'
    },
    cell: ({ row }) => {
      const extra = row.original as unknown as Record<string, unknown>
      const proxy = extra.proxy as { server?: string } | undefined
      if (!proxy?.server) {
        return h(
          Badge,
          { variant: 'secondary', class: 'text-[10px] font-mono text-muted-foreground' },
          () => 'Direct',
        )
      }
      return h('div', { class: 'flex items-center gap-1 font-mono text-[11px] text-foreground' }, [
        h(Server, { class: 'size-3 text-muted-foreground' }),
        h('span', { class: 'truncate max-w-[140px]' }, proxy.server),
      ])
    },
    size: 150,
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const b = row.original
      const isOnline = browserStore.onlineBrowserIds.includes(b.id)
      const isPending = startBrowserMutation.isPending.value || stopBrowserMutation.isPending.value

      return h(
        'div',
        {
          class: 'flex items-center gap-1 justify-end',
          onClick: (e: MouseEvent) => e.stopPropagation(),
        },
        [
          // Launch / Stop Button
          isOnline
            ? h(
                Button,
                {
                  variant: 'outline',
                  size: 'xs',
                  class: 'border-amber-500/40 text-amber-500 hover:bg-amber-500/10',
                  title: 'Stop Browser Process',
                  disabled: isPending,
                  onClick: () => onStop(b.id),
                },
                () => [h(Square, { class: 'size-3 mr-1 fill-current' }), 'Stop'],
              )
            : h(AutomaButton, {
                id: 'btn.browser.launch',
                size: 'xs',
                variant: 'primary',
                title: 'Launch',
                disabled: isPending,
                onClick: () => onLaunch(b.id),
              }),

          // Delete Button
          h(
            Button,
            {
              variant: 'ghost',
              size: 'icon-xs',
              class:
                'text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-70 hover:opacity-100 transition-opacity',
              title: 'Delete',
              onClick: () => onDelete(b.id),
            },
            () => h(Trash2, { class: 'size-3.5' }),
          ),
        ],
      )
    },
    size: 140,
    enableSorting: false,
  },
]
</script>

<template>
  <div class="automa-browser-data-table flex flex-col w-full h-full" data-testid="browser-data-table">
    <VirtualDataTable
      :data="filteredBrowsers"
      :columns="columns"
      :enable-virtualization="props.enableVirtualization"
      :is-loading="Boolean(isLoading) || startBrowserMutation.isPending.value || stopBrowserMutation.isPending.value"
      :initial-page-size="pageSize"
      search-placeholder="Search..."
      empty-text="No browsers"
      empty-description=""
      @row-click="emit('select-browser', $event)"
    >
      <!-- Custom Toolbar Actions -->
      <template #toolbar>
        <!-- Status Filter Switcher -->
        <div class="flex items-center bg-muted/60 p-0.5 rounded-md border border-border/60 text-xs">
          <button
            type="button"
            class="px-2.5 py-1 rounded font-medium transition-colors"
            :class="
              statusFilter === 'all'
                ? 'bg-background text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            "
            data-testid="filter-status-all"
            @click="statusFilter = 'all'"
          >
            All ({{ allBrowsers.length }})
          </button>
          <button
            type="button"
            class="px-2.5 py-1 rounded font-medium transition-colors flex items-center gap-1"
            :class="
              statusFilter === 'online'
                ? 'bg-background text-emerald-500 shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            "
            data-testid="filter-status-online"
            @click="statusFilter = 'online'"
          >
            <span class="size-1.5 rounded-full bg-emerald-500" />
            Online ({{ onlineCount }})
          </button>
          <button
            type="button"
            class="px-2.5 py-1 rounded font-medium transition-colors"
            :class="
              statusFilter === 'offline'
                ? 'bg-background text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            "
            data-testid="filter-status-offline"
            @click="statusFilter = 'offline'"
          >
            Offline ({{ allBrowsers.length - onlineCount }})
          </button>
        </div>

        <!-- Refresh Button -->
        <Button
          variant="outline"
          size="icon-sm"
          title="Refresh"
          data-testid="btn-refresh-browsers"
          :disabled="isLoading"
          @click="refetch()"
        >
          <RefreshCw class="size-3.5" :class="{ 'animate-spin': isLoading }" />
        </Button>

        <!-- Create Browser Button -->
        <Button
          variant="primary"
          size="sm"
          data-testid="btn-create-browser"
          title="Create Browser"
          @click="emit('create-browser')"
        >
          <Plus class="size-3.5 mr-1" />
          <span>New Browser</span>
        </Button>
      </template>
    </VirtualDataTable>
  </div>
</template>
