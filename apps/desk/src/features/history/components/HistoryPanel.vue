<script setup lang="ts">
import type { JobHistoryItem, LogItem } from '@automa/types/api'
import {
  AutomaButton,
  Badge,
  type BadgeVariants,
  Button,
  type ColumnDef,
  VirtualDataTable,
} from '@automa/ui'
import { Clock, X as CloseIcon, FileText, History, RotateCw, Trash2 } from 'lucide-vue-next'
import { computed, h, onMounted, ref } from 'vue'
import {
  clearAllJobHistory,
  deleteJobHistoryItem,
  getJobExecutionLogs,
  getJobHistory,
  submitJob,
} from '../../../infrastructure/api/client'

defineOptions({
  name: 'HistoryPanel',
})

const props = withDefaults(
  defineProps<{
    showHeader?: boolean
    pageSize?: number
    borderless?: boolean
  }>(),
  {
    showHeader: true,
    pageSize: 15,
    borderless: false,
  },
)

const historyItems = ref<JobHistoryItem[]>([])
const isLoading = ref(false)

async function loadHistory() {
  isLoading.value = true
  try {
    const res = await getJobHistory()
    if (res.data) {
      historyItems.value = res.data
    }
  } catch (err) {
    console.error('History read error:', err)
  } finally {
    isLoading.value = false
  }
}

async function handleClearAll() {
  try {
    await clearAllJobHistory()
    await loadHistory()
  } catch (err) {
    console.error('Clear history error:', err)
  }
}

async function handleDeleteItem(id: string) {
  try {
    await deleteJobHistoryItem({ path: { job_id: id } })
    await loadHistory()
  } catch (err) {
    console.error('Delete history item error:', err)
  }
}

const selectedJobForLogs = ref<JobHistoryItem | null>(null)
const jobLogs = ref<LogItem[]>([])
const isLoadingLogs = ref(false)

async function handleViewLogs(item: JobHistoryItem) {
  selectedJobForLogs.value = item
  isLoadingLogs.value = true
  jobLogs.value = []
  try {
    const res = await getJobExecutionLogs({ path: { job_id: item.id } })
    if (res.data?.logs && Array.isArray(res.data.logs)) {
      jobLogs.value = res.data.logs as unknown as LogItem[]
    }
  } catch (err) {
    console.error('Failed to load logs:', err)
  } finally {
    isLoadingLogs.value = false
  }
}

async function handleRerun(item: JobHistoryItem) {
  try {
    await submitJob({
      body: {
        workflowData: {
          name: item.name,
        },
        options: {
          headless: false,
        },
      },
    })
    await loadHistory()
  } catch (err) {
    console.error('Re-run error:', err)
  }
}

function getStatusVariant(status: string): NonNullable<BadgeVariants['variant']> {
  const s = status.toLowerCase()
  if (s === 'completed' || s === 'success') return 'outline'
  if (s === 'running' || s === 'executing' || s === 'dispatching') return 'secondary'
  if (s === 'failed' || s === 'error') return 'destructive'
  return 'outline'
}

const historyColumns = computed<ColumnDef<JobHistoryItem>[]>(() => [
  {
    id: 'name',
    header: 'Workflow',
    accessorFn: (row) => row.name || 'Workflow Run',
    cell: ({ row }) =>
      h('div', { class: 'flex items-center gap-2 font-medium text-xs text-foreground' }, [
        h(Clock, { class: 'size-3.5 text-muted-foreground shrink-0' }),
        h('span', row.original.name || 'Workflow Run'),
      ]),
  },
  {
    id: 'id',
    header: 'Job',
    accessorFn: (row) => row.id,
    cell: ({ row }) =>
      h('span', { class: 'font-mono text-xs text-muted-foreground' }, row.original.id),
  },
  {
    id: 'status',
    header: 'Status',
    accessorFn: (row) => row.status,
    cell: ({ row }) => {
      const status = row.original.status || 'unknown'
      const variant = getStatusVariant(status)
      return h(Badge, { variant, class: 'text-xs capitalize font-medium' }, () => status)
    },
  },
  {
    id: 'createdAt',
    header: 'Time',
    accessorFn: (row) => row.createdAt || 'Recent',
    cell: ({ row }) =>
      h(
        'span',
        { class: 'text-xs text-muted-foreground tabular-nums' },
        row.original.createdAt || 'Recent',
      ),
  },
  {
    id: 'actions',
    header: 'Actions',
    size: 110,
    cell: ({ row }) =>
      h('div', { class: 'flex items-center gap-1 justify-end' }, [
        h(
          Button,
          {
            variant: 'ghost',
            size: 'icon-sm',
            class: 'text-muted-foreground hover:text-foreground',
            title: 'View Logs',
            'data-testid': 'btn-view-job-logs',
            onClick: () => handleViewLogs(row.original),
          },
          () => h(FileText, { class: 'size-3.5' }),
        ),
        h(
          Button,
          {
            variant: 'ghost',
            size: 'icon-sm',
            class: 'text-muted-foreground hover:text-foreground',
            title: 'Re-run',
            onClick: () => handleRerun(row.original),
          },
          () => h(RotateCw, { class: 'size-3.5' }),
        ),
        h(
          Button,
          {
            variant: 'ghost',
            size: 'icon-sm',
            class: 'text-muted-foreground hover:text-destructive',
            title: 'Delete',
            onClick: () => handleDeleteItem(row.original.id),
          },
          () => h(Trash2, { class: 'size-3.5' }),
        ),
      ]),
    enableSorting: false,
  },
])

onMounted(() => {
  loadHistory()
})

defineExpose({
  loadHistory,
})
</script>

<template>
  <div class="h-full w-full flex flex-col overflow-hidden">
    <!-- Header Bar -->
    <div v-if="showHeader" class="flex items-center justify-between pb-3 border-b border-border shrink-0">
      <div class="flex items-center gap-2.5">
        <div class="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
          <History class="size-4" :stroke-width="2" />
        </div>
        <h2 class="font-semibold text-xs tracking-tight text-foreground">History</h2>
      </div>

      <div class="flex items-center gap-2">
        <AutomaButton
          id="btn.history.clear_all"
          size="sm"
          variant="outline"
          class="border-destructive/40 text-destructive hover:bg-destructive/10"
          @click="handleClearAll"
        />
        <AutomaButton
          id="btn.history.refresh"
          size="sm"
          variant="default"
          :loading="isLoading"
          @click="loadHistory"
        />
      </div>
    </div>

    <!-- Virtual History Table -->
    <div class="flex-1 min-h-0 overflow-hidden flex flex-col" :class="{ 'mt-3': showHeader }">
      <VirtualDataTable
        :data="historyItems"
        :columns="historyColumns"
        :enable-virtualization="true"
        :enable-search="true"
        :page-size="pageSize"
        :borderless="borderless"
        empty-text="No history"
        empty-description=""
      >
        <template v-if="!showHeader" #toolbar>
          <AutomaButton
            id="btn.history.clear_all"
            size="sm"
            variant="outline"
            class="border-destructive/40 text-destructive hover:bg-destructive/10"
            @click="handleClearAll"
          />
          <AutomaButton
            id="btn.history.refresh"
            size="sm"
            variant="default"
            :loading="isLoading"
            @click="loadHistory"
          />
        </template>
      </VirtualDataTable>
    </div>

    <!-- Job Execution Logs Viewer Dialog -->
    <div
      v-if="selectedJobForLogs"
      data-testid="job-logs-viewer-dialog"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none"
      @click.self="selectedJobForLogs = null"
    >
      <div class="w-full max-w-2xl max-h-[80vh] rounded-xl bg-card border border-border flex flex-col overflow-hidden shadow-2xl">
        <div class="px-4 py-3 border-b border-border flex items-center justify-between bg-muted/40 shrink-0">
          <div class="flex items-center gap-2">
            <FileText class="size-4 text-primary" />
            <span class="text-sm font-semibold">Logs: {{ selectedJobForLogs.name || selectedJobForLogs.id }}</span>
          </div>
          <button
            type="button"
            data-testid="btn-close-logs"
            class="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
            @click="selectedJobForLogs = null"
          >
            <CloseIcon class="size-4" />
          </button>
        </div>
        <div class="flex-1 overflow-y-auto p-3 font-mono text-xs bg-background/50 space-y-1">
          <div v-if="isLoadingLogs" class="text-center py-6 text-muted-foreground">Loading logs...</div>
          <div v-else-if="jobLogs.length === 0" class="text-center py-6 text-muted-foreground">No logs recorded for this job.</div>
          <div v-for="(log, idx) in jobLogs" :key="log.id || idx" class="flex items-start gap-2">
            <span class="text-muted-foreground tabular-nums shrink-0">{{ log.createdAt || '—' }}</span>
            <span
              class="shrink-0 font-semibold"
              :class="log.type === 'error' ? 'text-destructive' : log.type === 'warn' ? 'text-amber-500' : 'text-primary'"
            >
              [{{ (log.type || 'info').toUpperCase() }}]
            </span>
            <span class="text-foreground/90 break-all">{{ log.message }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
