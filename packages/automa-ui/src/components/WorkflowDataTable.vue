<script setup lang="ts">
import type { WorkflowStorageItem } from '@automa/types/api'
import type { CellContext, ColumnDef, HeaderContext } from '@tanstack/vue-table'
import {
  Download,
  FileCode,
  FolderOpen,
  Layers,
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

const props = withDefaults(
  defineProps<{
    enableServerSearch?: boolean
    enableVirtualization?: boolean
    pageSize?: number
    selectable?: boolean
  }>(),
  {
    enableServerSearch: false,
    enableVirtualization: true,
    pageSize: 20,
    selectable: true,
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

const workflows = computed<WorkflowStorageItem[]>(() => {
  return remoteWorkflows.value ?? []
})

// Actions
async function onDelete(workflow: WorkflowStorageItem) {
  if (
    window.confirm(`Are you sure you want to delete workflow "${workflow.name || workflow.id}"?`)
  ) {
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
              'onUpdate:checked': (val: boolean) => table.toggleAllPageRowsSelected(!!val),
              'aria-label': 'Select all rows',
              class: 'translate-y-[2px]',
            }),
          cell: ({ row }: CellContext<WorkflowStorageItem, unknown>) =>
            h(Checkbox, {
              checked: row.getIsSelected(),
              'onUpdate:checked': (val: boolean) => row.toggleSelected(!!val),
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
      return h('div', { class: 'flex items-center gap-2' }, [
        h(FileCode, { class: 'size-4 text-primary shrink-0' }),
        h('div', { class: 'flex flex-col gap-0.5 truncate' }, [
          h(
            'span',
            { class: 'font-medium text-xs text-foreground truncate' },
            wf.name || 'Untitled Workflow',
          ),
          h(
            'span',
            { class: 'font-mono text-[10px] text-muted-foreground/80 truncate' },
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
      return h(Badge, { variant: 'outline', class: 'font-mono text-[10px]' }, () => ver)
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
        { class: 'flex items-center gap-1 font-mono text-[11px] text-muted-foreground' },
        [h(Layers, { class: 'size-3' }), h('span', `${count} blocks`)],
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
        { class: 'text-[11px] text-muted-foreground whitespace-nowrap' },
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
            size: 'xs',
            variant: 'primary',
            title: 'Run Workflow via automa-core',
            onClick: () => emit('run-workflow', wf),
          }),

          // Open in Editor Button
          h(
            Button,
            {
              variant: 'outline',
              size: 'xs',
              title: 'Open in Editor',
              onClick: () => emit('open-workflow', wf),
            },
            () => [h(FolderOpen, { class: 'size-3 mr-1' }), 'Open'],
          ),

          // Export JSON Button
          h(
            Button,
            {
              variant: 'ghost',
              size: 'icon-xs',
              class: 'text-muted-foreground hover:text-foreground',
              title: 'Export Workflow JSON',
              onClick: () => emit('export-workflow', wf),
            },
            () => h(Download, { class: 'size-3.5' }),
          ),

          // Delete Button
          h(
            Button,
            {
              variant: 'ghost',
              size: 'icon-xs',
              class: 'text-muted-foreground hover:text-destructive hover:bg-destructive/10',
              title: 'Delete Workflow',
              disabled: isDeleting,
              onClick: () => onDelete(wf),
            },
            () => h(Trash2, { class: 'size-3.5' }),
          ),
        ],
      )
    },
    size: 190,
    enableSorting: false,
  },
]
</script>

<template>
  <div class="automa-workflow-data-table flex flex-col w-full h-full" data-testid="workflow-data-table">
    <VirtualDataTable
      :data="workflows"
      :columns="columns"
      :enable-virtualization="props.enableVirtualization"
      :is-loading="Boolean(isLoading) || deleteWorkflowMutation.isPending.value"
      :initial-page-size="pageSize"
      search-placeholder="Filter workflows by name or file path..."
      empty-text="No workflows found in Storage"
      empty-description="Create a new workflow or import from JSON."
      @row-click="emit('open-workflow', $event)"
    >
      <!-- Custom Toolbar Actions -->
      <template #toolbar>
        <!-- Import JSON Button -->
        <Button
          variant="outline"
          size="sm"
          data-testid="btn-import-workflow"
          title="Import Workflow from JSON file"
          @click="emit('import-workflow')"
        >
          <Upload class="size-3.5 mr-1" />
          <span class="hidden sm:inline">Import</span>
        </Button>

        <!-- Refresh Button -->
        <Button
          variant="outline"
          size="icon-sm"
          title="Refresh Workflows List"
          data-testid="btn-refresh-workflows"
          :disabled="isLoading"
          @click="refetch()"
        >
          <RefreshCw class="size-3.5" :class="{ 'animate-spin': isLoading }" />
        </Button>

        <!-- Create Workflow Button -->
        <Button
          variant="primary"
          size="sm"
          data-testid="btn-create-workflow"
          title="Create New Workflow"
          @click="emit('create-workflow')"
        >
          <Plus class="size-3.5 mr-1" />
          <span>New Workflow</span>
        </Button>
      </template>
    </VirtualDataTable>
  </div>
</template>
