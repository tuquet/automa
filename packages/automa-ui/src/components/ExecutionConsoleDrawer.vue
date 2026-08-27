<script setup lang="ts">
import { useVirtualizer } from '@tanstack/vue-virtual'
import { ArrowDownToLine, Search, Terminal, Trash2, X } from 'lucide-vue-next'
import { computed, nextTick, ref, watch } from 'vue'
import { useExecutionStore } from '../stores/useExecutionStore'

const props = withDefaults(
  defineProps<{
    open?: boolean
    title?: string
  }>(),
  {
    open: true,
    title: 'Execution Logs & Diagnostics',
  },
)

const emit = defineEmits<(e: 'close') => void>()

const executionStore = useExecutionStore()
const searchQuery = ref('')
const activeFilter = ref<'all' | 'info' | 'warn' | 'error'>('all')
const autoScroll = ref(true)
const parentRef = ref<HTMLElement | null>(null)

const filteredLogs = computed(() => {
  let list = executionStore.logs
  if (activeFilter.value !== 'all') {
    list = list.filter((l) => l.level === activeFilter.value)
  }
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(
      (l) => l.message.toLowerCase().includes(q) || l.blockId?.toLowerCase().includes(q),
    )
  }
  return list
})

const rowVirtualizer = useVirtualizer({
  count: filteredLogs.value.length,
  getScrollElement: () => parentRef.value,
  estimateSize: () => 28,
  overscan: 10,
})

const virtualItems = computed(() => rowVirtualizer.value.getVirtualItems())
const totalSize = computed(() => rowVirtualizer.value.getTotalSize())

// Auto scroll to bottom on new logs if autoScroll is enabled
watch(
  () => executionStore.logs.length,
  () => {
    if (autoScroll.value && filteredLogs.value.length > 0) {
      nextTick(() => {
        rowVirtualizer.value.scrollToIndex(filteredLogs.value.length - 1, {
          align: 'end',
        })
      })
    }
  },
)

function getLevelClass(level: string) {
  switch (level) {
    case 'error':
      return 'text-rose-500 bg-rose-500/10 border-rose-500/20'
    case 'warn':
      return 'text-amber-500 bg-amber-500/10 border-amber-500/20'
    case 'success':
      return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
    default:
      return 'text-sky-500 bg-sky-500/10 border-sky-500/20'
  }
}
</script>

<template>
  <div
    v-if="props.open"
    class="automa-execution-drawer flex h-72 w-full flex-col border-t border-[var(--automa-border)] bg-[var(--automa-bg)] font-mono text-xs shadow-lg transition-all"
    data-testid="execution-console-drawer"
  >
    <!-- Drawer Toolbar Header -->
    <div class="flex h-9 items-center justify-between border-b border-[var(--automa-border-subtle)] bg-[var(--automa-bg-subtle)] px-3 text-[var(--automa-text-primary)]">
      <div class="flex items-center gap-2">
        <Terminal class="h-4 w-4 text-[var(--automa-accent)]" />
        <span class="font-semibold">{{ props.title }}</span>
        <span class="rounded-full bg-[var(--automa-bg-active)] px-2 py-0.5 text-[10px] text-[var(--automa-accent)]">
          {{ filteredLogs.length }} lines
        </span>
      </div>

      <!-- Controls & Filters -->
      <div class="flex items-center gap-2">
        <!-- Search -->
        <div class="relative flex items-center">
          <Search class="absolute left-2 h-3 w-3 text-[var(--automa-text-muted)]" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Filter logs..."
            class="h-6 w-36 rounded border border-[var(--automa-border)] bg-[var(--automa-bg)] pl-6 pr-2 text-[11px] text-[var(--automa-text-primary)] focus:border-[var(--automa-border-focus)] focus:outline-none"
          />
        </div>

        <!-- Level Filters -->
        <div class="flex rounded border border-[var(--automa-border)] p-0.5">
          <button
            type="button"
            class="px-1.5 py-0.5 text-[10px] rounded transition-colors"
            :class="activeFilter === 'all' ? 'bg-[var(--automa-accent)] text-white' : 'text-[var(--automa-text-muted)] hover:text-[var(--automa-text-primary)]'"
            @click="activeFilter = 'all'"
          >
            ALL
          </button>
          <button
            type="button"
            class="px-1.5 py-0.5 text-[10px] rounded transition-colors"
            :class="activeFilter === 'error' ? 'bg-rose-600 text-white' : 'text-[var(--automa-text-muted)] hover:text-[var(--automa-text-primary)]'"
            @click="activeFilter = 'error'"
          >
            ERR
          </button>
        </div>

        <!-- Auto-scroll toggle -->
        <button
          type="button"
          class="flex items-center gap-1 rounded border border-[var(--automa-border)] px-1.5 py-0.5 text-[10px] transition-colors"
          :class="autoScroll ? 'border-blue-500/50 bg-blue-500/10 text-blue-600 dark:text-blue-400' : 'text-[var(--automa-text-muted)] hover:text-[var(--automa-text-primary)]'"
          @click="autoScroll = !autoScroll"
        >
          <ArrowDownToLine class="h-3 w-3" />
          <span>Follow</span>
        </button>

        <!-- Clear Logs -->
        <button
          type="button"
          class="rounded p-1 text-[var(--automa-text-muted)] hover:bg-[var(--automa-bg-hover)] hover:text-[var(--automa-text-primary)]"
          title="Clear console output"
          @click="executionStore.clearLogs"
        >
          <Trash2 class="h-3.5 w-3.5" />
        </button>

        <!-- Close Drawer -->
        <button
          type="button"
          class="rounded p-1 text-[var(--automa-text-muted)] hover:bg-[var(--automa-bg-hover)] hover:text-[var(--automa-text-primary)]"
          @click="emit('close')"
        >
          <X class="h-3.5 w-3.5" />
        </button>
      </div>
    </div>

    <!-- Virtualized Log Stream Viewport -->
    <div
      ref="parentRef"
      class="h-full w-full overflow-y-auto bg-[var(--automa-bg)] p-2 select-text"
    >
      <div v-if="filteredLogs.length === 0" class="flex h-full items-center justify-center text-[var(--automa-text-muted)] text-xs">
        No log entries recorded yet
      </div>

      <div
        v-else
        :style="{
          height: `${totalSize}px`,
          width: '100%',
          position: 'relative',
        }"
      >
        <div
          v-for="virtualRow in virtualItems"
          :key="(virtualRow.key as PropertyKey)"
          :ref="(el) => rowVirtualizer.measureElement(el as HTMLElement)"
          :data-index="virtualRow.index"
          :style="{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: `translateY(${virtualRow.start}px)`,
          }"
          class="flex items-start gap-2 py-0.5 text-[11px] leading-relaxed text-[var(--automa-text-primary)]"
        >
          <span class="text-[var(--automa-text-muted)] flex-shrink-0 text-[10px]">
            {{ filteredLogs[virtualRow.index]?.timestamp }}
          </span>

          <span
            class="inline-flex flex-shrink-0 items-center rounded border px-1 py-0.2 text-[9px] uppercase font-semibold"
            :class="getLevelClass(filteredLogs[virtualRow.index]?.level || 'info')"
          >
            {{ filteredLogs[virtualRow.index]?.level }}
          </span>

          <span v-if="filteredLogs[virtualRow.index]?.blockId" class="text-indigo-500 dark:text-indigo-400 font-medium flex-shrink-0">
            [{{ filteredLogs[virtualRow.index]?.blockId }}]
          </span>

          <span class="break-all whitespace-pre-wrap">
            {{ filteredLogs[virtualRow.index]?.message }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
