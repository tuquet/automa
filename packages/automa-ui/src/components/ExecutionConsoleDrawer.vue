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
    title: 'Execution Logs',
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

const rowVirtualizer = useVirtualizer(
  computed(() => ({
    count: filteredLogs.value.length,
    getScrollElement: () => parentRef.value,
    estimateSize: () => 28,
    overscan: 10,
  })),
)

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
</script>

<template>
  <div
    v-if="props.open"
    class="automa-execution-drawer"
    data-testid="execution-console-drawer"
  >
    <!-- Drawer Toolbar Header -->
    <div class="automa-drawer-toolbar">
      <div class="automa-drawer-title">
        <Terminal class="h-4 w-4 text-[var(--automa-accent)]" />
        <span>{{ props.title }}</span>
        <span class="automa-drawer-badge">
          {{ filteredLogs.length }} lines
        </span>
      </div>

      <!-- Controls & Filters -->
      <div class="automa-drawer-controls">
        <!-- Search -->
        <div class="automa-drawer-search">
          <Search class="automa-drawer-search-icon" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Filter logs..."
            class="automa-drawer-search-input"
          />
        </div>

        <!-- Level Filters -->
        <div class="automa-drawer-filter-group">
          <button
            type="button"
            class="automa-drawer-filter-btn"
            :class="{ 'is-active': activeFilter === 'all' }"
            @click="activeFilter = 'all'"
          >
            ALL
          </button>
          <button
            type="button"
            class="automa-drawer-filter-btn"
            :class="{ 'is-active-error': activeFilter === 'error' }"
            @click="activeFilter = 'error'"
          >
            ERR
          </button>
        </div>

        <!-- Auto-scroll toggle -->
        <button
          type="button"
          class="automa-drawer-follow-btn"
          :class="{ 'is-following': autoScroll }"
          @click="autoScroll = !autoScroll"
        >
          <ArrowDownToLine class="h-3 w-3" />
          <span>Follow</span>
        </button>

        <!-- Clear Logs -->
        <button
          type="button"
          class="automa-drawer-icon-btn"
          title="Clear console output"
          @click="executionStore.clearLogs"
        >
          <Trash2 class="h-3.5 w-3.5" />
        </button>

        <!-- Close Drawer -->
        <button
          type="button"
          class="automa-drawer-icon-btn"
          @click="emit('close')"
        >
          <X class="h-3.5 w-3.5" />
        </button>
      </div>
    </div>

    <!-- Virtualized Log Stream Viewport -->
    <div
      ref="parentRef"
      class="automa-drawer-logs-viewport"
    >
      <div v-if="filteredLogs.length === 0" class="flex h-full items-center justify-center text-[var(--automa-text-muted)] text-xs">
        No logs yet
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
          class="automa-drawer-log-row"
        >
          <span class="automa-log-time">
            {{ filteredLogs[virtualRow.index]?.timestamp }}
          </span>

          <span
            class="automa-log-level"
            :class="`automa-log-level-${filteredLogs[virtualRow.index]?.level || 'info'}`"
          >
            {{ filteredLogs[virtualRow.index]?.level }}
          </span>

          <span v-if="filteredLogs[virtualRow.index]?.blockId" class="automa-log-block">
            [{{ filteredLogs[virtualRow.index]?.blockId }}]
          </span>

          <span class="automa-log-msg">
            {{ filteredLogs[virtualRow.index]?.message }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
