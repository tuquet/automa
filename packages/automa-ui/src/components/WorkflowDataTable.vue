<script setup lang="ts">
import type { WorkflowStorageItem } from '@automa/types/api'
import type { CellContext, ColumnDef, HeaderContext } from '@tanstack/vue-table'
import {
  Download,
  FileCode,
  Layers,
  Package,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
} from 'lucide-vue-next'
import { computed, h, ref } from 'vue'
import { useDeleteWorkflowMutation, useWorkflowsQuery } from '../hooks'
import AutomaButton from './AutomaButton.vue'
import { Badge, Button, Checkbox } from './ui'
import VirtualDataTable from './VirtualDataTable.vue'

defineOptions({
  name: 'WorkflowDataTable',
})

const props = withDefaults(
  defineProps<{
    items?: WorkflowStorageItem[]
    enableServerSearch?: boolean
    enableVirtualization?: boolean
    pageSize?: number
    selectable?: boolean
    filterMode?: 'all' | 'workflows' | 'packages'
    showTypeTabs?: boolean
  }>(),
  {
    items: undefined,
    enableServerSearch: false,
    enableVirtualization: true,
    pageSize: 20,
    selectable: true,
    filterMode: 'all',
    showTypeTabs: true,
  },
)

const emit = defineEmits<{
  'select-workflow': [workflow: WorkflowStorageItem]
  'open-workflow': [workflow: WorkflowStorageItem]
  'run-workflow': [workflow: WorkflowStorageItem]
  'export-workflow': [workflow: WorkflowStorageItem]
  'import-workflow': []
  'create-workflow': []
  'delete-workflow': [workflowId: string]
}>()

const deleteWorkflowMutation = useDeleteWorkflowMutation()

// Query
const searchQuery = ref('')
const {
  data: remoteWorkflows,
  isLoading,
  refetch,
} = useWorkflowsQuery({
  search: computed(() => (props.enableServerSearch ? searchQuery.value : undefined)),
})

function isPackageItem(item: WorkflowStorageItem): boolean {
  const data = (item.data || {}) as Record<string, unknown>
  const settings = (data.settings || {}) as Record<string, unknown>
  return Boolean(
    settings.asBlock === true ||
      item.name?.toLowerCase().includes('.package') ||
      Array.isArray(data.inputs) ||
      Array.isArray(data.outputs),
  )
}

const activeTab = ref<'all' | 'workflows' | 'packages'>(props.filterMode)

const allWorkflows = computed<WorkflowStorageItem[]>(() => {
  if (props.items !== undefined) {
    return props.items
  }
  return remoteWorkflows.value ?? []
})

const workflowsCount = computed(() => allWorkflows.value.filter((w) => !isPackageItem(w)).length)
const packagesCount = computed(() => allWorkflows.value.filter((w) => isPackageItem(w)).length)

const displayedWorkflows = computed<WorkflowStorageItem[]>(() => {
  if (activeTab.value === 'workflows') {
    return allWorkflows.value.filter((w) => !isPackageItem(w))
  }
  if (activeTab.value === 'packages') {
    return allWorkflows.value.filter((w) => isPackageItem(w))
  }
  return allWorkflows.value
})

// Actions
async function onDelete(workflow: WorkflowStorageItem) {
  if (window.confirm(`Delete "${workflow.name || workflow.id}"?`)) {
    emit('delete-workflow', workflow.id)
    await deleteWorkflowMutation.mutateAsync(workflow.id)
  }
}

// TanStack Column Definitions
const columns: ColumnDef<WorkflowStorageItem>[] = [
  ...(props.selectable
    ? [
        {
          id: 'select',
          header: ({ table }: HeaderContext<WorkflowStorageItem, unknown>) =>
            h(Checkbox, {
              checked: table.getIsAllPageRowsSelected(),
              indeterminate: table.getIsSomePageRowsSelected(),
              'onUpdate:checked': (val: boolean | 'indeterminate') => table.toggleAllPageRowsSelected(!!val),
              'aria-label': 'Select all rows',
              class: 'translate-y-[2px]',
            }),
          cell: ({ row }: CellContext<WorkflowStorageItem, unknown>) =>
            h(Checkbox, {
              checked: row.getIsSelected(),
              'onUpdate:checked': (val: boolean | 'indeterminate') => row.toggleSelected(!!val),
              'aria-label': 'Select row',
              class: 'translate-y-[2px]',
              onClick: (e: MouseEvent) => e.stopPropagation(),
            }),
          size: 36,
          enableSorting: false,
        } as ColumnDef<WorkflowStorageItem>,
      ]
    : []),
  {
    id: 'name',
    header: 'Workflow Name',
    accessorKey: 'name',
    cell: ({ row }) => {
      const wf = row.original
      const isPkg = isPackageItem(wf)
      return h('div', { class: 'flex items-center gap-2' }, [
        h(isPkg ? Package : FileCode, {
          class: isPkg ? 'size-4 text-amber-500 shrink-0' : 'size-4 text-primary shrink-0',
        }),
        h('div', { class: 'flex flex-col gap-0.5 truncate' }, [
          h('div', { class: 'flex items-center gap-1.5' }, [
            h(
              'span',
              { class: 'font-semibold text-sm text-foreground truncate' },
              wf.name || 'Untitled Workflow',
            ),
            isPkg
              ? h(
                  Badge,
                  {
                    variant: 'secondary',
                    class: 'text-xs px-1.5 py-0 text-amber-600 dark:text-amber-400 font-medium',
                  },
                  () => 'Package',
                )
              : null,
          ]),
          h(
            'span',
            { class: 'font-mono text-xs text-muted-foreground/80 truncate' },
            wf.description || wf.id,
          ),
        ]),
      ])
    },
  },
  {
    id: 'version',
    header: 'Version',
    accessorKey: 'version',
    cell: ({ row }) => {
      const ver = row.original.version || 'v1.0.0'
      return h(Badge, { variant: 'outline', class: 'font-mono text-xs' }, () => ver)
    },
    size: 90,
  },
  {
    id: 'blocks',
    header: 'Blocks',
    accessorFn: (row) => {
      const extra = row as unknown as Record<string, unknown>
      return (extra.blocksCount as number) ?? 0
    },
    cell: ({ row }) => {
      const extra = row.original as unknown as Record<string, unknown>
      const count = (extra.blocksCount as number) ?? 0
      return h(
        'div',
        { class: 'flex items-center gap-1.5 font-mono text-xs text-muted-foreground' },
        [h(Layers, { class: 'size-3.5' }), h('span', `${count} blocks`)],
      )
    },
    size: 110,
  },
  {
    id: 'updatedAt',
    header: 'Updated',
    accessorKey: 'updatedAt',
    cell: ({ row }) => {
      const time = row.original.updatedAt
      return h(
        'span',
        { class: 'text-xs text-muted-foreground whitespace-nowrap' },
        time ? String(time).split('T')[0] : '-',
      )
    },
    size: 110,
  },
  {
    id: 'actions',
    header: 'Actions',
    cell: ({ row }) => {
      const wf = row.original
      const isDeleting = deleteWorkflowMutation.isPending.value

      return h(
        'div',
        {
          class: 'flex items-center gap-1 justify-end',
          onClick: (e: MouseEvent) => e.stopPropagation(),
        },
        [
          // Run Button
          h(AutomaButton, {
            id: 'btn.workflow.run',
            size: 'sm',
            variant: 'default',
            title: 'Run Workflow via automa-core',
            onClick: () => emit('run-workflow', wf),
          }),

          // Export JSON Button
          h(
            Button,
            {
              variant: 'ghost',
              size: 'icon-sm',
              class: 'text-muted-foreground hover:text-foreground',
              title: 'Export JSON',
              onClick: () => emit('export-workflow', wf),
            },
            () => h(Download, { class: 'size-3.5' }),
          ),

          // Delete Button
          h(
            Button,
            {
              variant: 'ghost',
              size: 'icon-sm',
              class:
                'text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-70 hover:opacity-100 transition-opacity',
              title: 'Delete',
              disabled: isDeleting,
              onClick: () => onDelete(wf),
            },
            () => h(Trash2, { class: 'size-3.5' }),
          ),
        ],
      )
    },
    size: 110,
    enableSorting: false,
  },
]
</script>

<template>
  <div class="automa-workflow-data-table flex flex-col w-full h-full" data-testid="workflow-data-table">
    <VirtualDataTable
      :data="displayedWorkflows"
      :columns="columns"
      :enable-virtualization="props.enableVirtualization"
      :is-loading="Boolean(isLoading) || deleteWorkflowMutation.isPending.value"
      :initial-page-size="pageSize"
      search-placeholder="Search..."
      empty-text="No workflows"
      empty-description=""
      @row-click="emit('open-workflow', $event)"
    >
      <!-- Custom Toolbar Actions -->
      <template #toolbar>
        <!-- Category Filter Tabs -->
        <div v-if="props.showTypeTabs" class="flex items-center bg-muted/60 p-0.5 rounded-md border border-border/60 text-xs">
          <button
            type="button"
            class="px-2.5 py-1 rounded font-medium transition-colors cursor-pointer"
            :class="
              activeTab === 'all'
                ? 'bg-background text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            "
            data-testid="tab-workflows-all"
            @click="activeTab = 'all'"
          >
            All ({{ allWorkflows.length }})
          </button>
          <button
            type="button"
            class="px-2.5 py-1 rounded font-medium transition-colors flex items-center gap-1 cursor-pointer"
            :class="
              activeTab === 'workflows'
                ? 'bg-background text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            "
            data-testid="tab-workflows-workflows"
            @click="activeTab = 'workflows'"
          >
            Workflows ({{ workflowsCount }})
          </button>
          <button
            type="button"
            class="px-2.5 py-1 rounded font-medium transition-colors flex items-center gap-1 cursor-pointer"
            :class="
              activeTab === 'packages'
                ? 'bg-background text-foreground shadow-2xs'
                : 'text-muted-foreground hover:text-foreground'
            "
            data-testid="tab-workflows-packages"
            @click="activeTab = 'packages'"
          >
            Packages ({{ packagesCount }})
          </button>
        </div>

        <!-- Import JSON Button -->
        <Button
          variant="outline"
          size="sm"
          data-testid="btn-import-workflow"
          title="Import"
          @click="emit('import-workflow')"
        >
          <Upload class="size-3.5 mr-1" />
          <span class="hidden sm:inline">Import</span>
        </Button>

        <!-- Refresh Button -->
        <Button
          variant="outline"
          size="icon-sm"
          title="Refresh"
          data-testid="btn-refresh-workflows"
          :disabled="isLoading"
          @click="refetch()"
        >
          <RefreshCw class="size-3.5" :class="{ 'animate-spin': isLoading }" />
        </Button>

        <!-- Create Workflow Button -->
        <Button
          variant="default"
          size="sm"
          data-testid="btn-create-workflow"
          title="Create"
          @click="emit('create-workflow')"
        >
          <Plus class="size-3.5 mr-1" />
          <span>New</span>
        </Button>
      </template>
    </VirtualDataTable>
  </div>
</template>
