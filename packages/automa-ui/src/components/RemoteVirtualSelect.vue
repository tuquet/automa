<script setup lang="ts" generic="T = string">
import { getSelectSchema, type SelectFsmState, type SelectOption } from '@automa/types'
import { useVirtualizer } from '@tanstack/vue-virtual'
import { Check, ChevronDown, Loader2, Search, X } from 'lucide-vue-next'
import { computed, nextTick, ref, watch } from 'vue'
import { useBrowsersQuery } from '../hooks/useBrowsersQuery'
import { useStorageTablesQuery, useStorageVariablesQuery } from '../hooks/useStorageQuery'
import { useWorkflowsQuery } from '../hooks/useWorkflowsQuery'

const props = withDefaults(
  defineProps<{
    id: string
    modelValue?: T | null
    placeholder?: string
    disabled?: boolean
    customOptions?: SelectOption<T>[]
  }>(),
  {
    modelValue: null,
    placeholder: 'Select an option...',
    disabled: false,
    customOptions: undefined,
  },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: T): void
  (e: 'change', option: SelectOption<T>): void
}>()

const schema = computed(() => getSelectSchema(props.id))
const isOpen = ref(false)
const searchQuery = ref('')
const parentRef = ref<HTMLElement | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)
const focusedIndex = ref<number>(-1)

// Automatic Query Dispatching based on Select Schema ID
const browsersQuery = useBrowsersQuery()
const workflowsQuery = useWorkflowsQuery()
const tablesQuery = useStorageTablesQuery()
const variablesQuery = useStorageVariablesQuery()

const rawOptions = computed<SelectOption<T>[]>(() => {
  if (props.customOptions) return props.customOptions

  if (props.id === 'select.browser.profile') {
    return (browsersQuery.data.value || []).map((b) => ({
      value: (b.id || '') as unknown as string | number,
      label: b.name || b.id || '',
      description: b.userAgent || undefined,
      badge: b.isOnline ? { text: 'Online', variant: 'success' } : undefined,
    })) as SelectOption<T>[]
  }

  if (props.id === 'select.storage.workflow') {
    return (workflowsQuery.data.value || []).map((w) => ({
      value: (w.id || '') as unknown as string | number,
      label: w.name || w.id || '',
      description: `v${w.version || '1.0.0'}`,
    })) as SelectOption<T>[]
  }

  if (props.id === 'select.storage.table') {
    return (tablesQuery.data.value || []).map((t) => ({
      value: (t.id || '') as unknown as string | number,
      label: t.name || t.id || '',
      description: `${t.columns?.length || 0} columns`,
    })) as SelectOption<T>[]
  }

  if (props.id === 'select.storage.variable') {
    return (variablesQuery.data.value || []).map((v) => ({
      value: (v.key || v.id || '') as unknown as string | number,
      label: v.name || v.key || v.id || '',
      description: typeof v.value === 'string' ? v.value : JSON.stringify(v.value),
    })) as SelectOption<T>[]
  }

  return []
})

const isLoading = computed(() => {
  if (props.id === 'select.browser.profile') return browsersQuery.isLoading.value
  if (props.id === 'select.storage.workflow') return workflowsQuery.isLoading.value
  if (props.id === 'select.storage.table') return tablesQuery.isLoading.value
  if (props.id === 'select.storage.variable') return variablesQuery.isLoading.value
  return false
})

const filteredOptions = computed(() => {
  if (!searchQuery.value.trim()) return rawOptions.value
  const q = searchQuery.value.toLowerCase().trim()
  return rawOptions.value.filter(
    (opt) => opt.label.toLowerCase().includes(q) || opt.description?.toLowerCase().includes(q),
  )
})

const selectedOption = computed(() =>
  rawOptions.value.find((opt) => opt.value === (props.modelValue as unknown as string | number)),
)

const fsmState = computed<SelectFsmState>(() => {
  if (isLoading.value) return 'LOADING'
  if (filteredOptions.value.length === 0) return 'EMPTY'
  return 'READY'
})

// TanStack Virtual Engine
const rowVirtualizer = useVirtualizer({
  count: filteredOptions.value.length,
  getScrollElement: () => parentRef.value,
  estimateSize: () => schema.value?.virtualization?.itemHeightPx || 40,
  overscan: 5,
})

const virtualItems = computed(() => rowVirtualizer.value.getVirtualItems())
const totalSize = computed(() => rowVirtualizer.value.getTotalSize())

function toggleDropdown() {
  if (props.disabled) return
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    nextTick(() => {
      searchInputRef.value?.focus()
    })
  }
}

function selectItem(option: SelectOption<T>) {
  emit('update:modelValue', option.value as unknown as T)
  emit('change', option)
  isOpen.value = false
  searchQuery.value = ''
}

function handleKeydown(e: KeyboardEvent) {
  if (!isOpen.value) {
    if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ') {
      e.preventDefault()
      isOpen.value = true
    }
    return
  }

  if (e.key === 'Escape') {
    isOpen.value = false
    return
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    focusedIndex.value = Math.min(focusedIndex.value + 1, filteredOptions.value.length - 1)
    rowVirtualizer.value.scrollToIndex(focusedIndex.value, { align: 'auto' })
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    focusedIndex.value = Math.max(focusedIndex.value - 1, 0)
    rowVirtualizer.value.scrollToIndex(focusedIndex.value, { align: 'auto' })
  } else if (e.key === 'Enter' && focusedIndex.value >= 0) {
    e.preventDefault()
    const item = filteredOptions.value[focusedIndex.value]
    if (item) selectItem(item)
  }
}

watch(isOpen, (open) => {
  if (!open) {
    searchQuery.value = ''
    focusedIndex.value = -1
  }
})
</script>

<template>
  <div
    class="automa-select-wrapper relative inline-block w-full font-sans text-sm"
    :data-testid="schema?.presentation?.dataTestId || props.id"
    @keydown="handleKeydown"
  >
    <!-- Select Trigger Button -->
    <button
      type="button"
      class="automa-select-trigger flex h-9 w-full items-center justify-between rounded-lg border border-[var(--automa-border)] bg-[var(--automa-bg)] px-3 text-[var(--automa-text-primary)] transition-all hover:bg-[var(--automa-bg-hover)] focus:border-[var(--automa-border-focus)] focus:outline-none focus:ring-1 focus:ring-[var(--automa-border-focus)] disabled:cursor-not-allowed disabled:opacity-50"
      :aria-expanded="isOpen"
      :disabled="props.disabled"
      @click="toggleDropdown"
    >
      <span class="truncate">
        <template v-if="selectedOption">
          <span class="font-medium">{{ selectedOption.label }}</span>
          <span v-if="selectedOption.badge" class="ml-2 inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            {{ selectedOption.badge.text }}
          </span>
        </template>
        <template v-else>
          <span class="text-[var(--automa-text-muted)]">{{ props.placeholder }}</span>
        </template>
      </span>

      <span class="ml-2 flex items-center">
        <Loader2 v-if="isLoading" class="h-4 w-4 animate-spin text-[var(--automa-text-muted)]" />
        <ChevronDown v-else class="h-4 w-4 text-[var(--automa-text-muted)] transition-transform duration-200" :class="{ 'rotate-180': isOpen }" />
      </span>
    </button>

    <!-- Dropdown Popover -->
    <div
      v-if="isOpen"
      class="automa-select-popover absolute left-0 top-full z-50 mt-1.5 w-full min-w-[200px] overflow-hidden rounded-xl border border-[var(--automa-border)] bg-[var(--automa-bg)] shadow-[var(--automa-shadow-dropdown)] backdrop-blur-md"
    >
      <!-- Search Box -->
      <div v-if="schema?.search?.searchable !== false" class="border-b border-[var(--automa-border-subtle)] p-2">
        <div class="relative flex items-center">
          <Search class="absolute left-2.5 h-3.5 w-3.5 text-[var(--automa-text-muted)]" />
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            class="h-8 w-full rounded-md border border-[var(--automa-border)] bg-[var(--automa-bg-subtle)] pl-8 pr-7 text-xs text-[var(--automa-text-primary)] placeholder-[var(--automa-text-muted)] focus:border-[var(--automa-border-focus)] focus:outline-none"
            :placeholder="schema?.search?.placeholder || 'Search options...'"
          />
          <button
            v-if="searchQuery"
            type="button"
            class="absolute right-2 text-[var(--automa-text-muted)] hover:text-[var(--automa-text-primary)]"
            @click="searchQuery = ''"
          >
            <X class="h-3 w-3" />
          </button>
        </div>
      </div>

      <!-- State Renderers -->
      <div v-if="fsmState === 'LOADING'" class="flex items-center justify-center py-6 text-[var(--automa-text-muted)]">
        <Loader2 class="mr-2 h-4 w-4 animate-spin" />
        <span class="text-xs">Loading items...</span>
      </div>

      <div v-else-if="fsmState === 'EMPTY'" class="py-6 text-center text-xs text-[var(--automa-text-muted)]">
        No matching options found
      </div>

      <!-- TanStack Virtual Scroll Container -->
      <div
        v-else
        ref="parentRef"
        class="max-h-60 overflow-y-auto p-1"
      >
        <div
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
            class="flex cursor-pointer select-none items-center justify-between rounded-md px-2.5 py-2 text-xs transition-colors"
            :class="[
              (filteredOptions[virtualRow.index]?.value as unknown) === props.modelValue
                ? 'bg-[var(--automa-bg-active)] text-[var(--automa-accent)] font-medium'
                : 'text-[var(--automa-text-primary)] hover:bg-[var(--automa-bg-hover)]',
              focusedIndex === virtualRow.index ? 'bg-[var(--automa-bg-hover)] ring-1 ring-[var(--automa-border-focus)]' : '',
            ]"
            @click="selectItem(filteredOptions[virtualRow.index]!)"
          >
            <div class="flex flex-col truncate">
              <span class="truncate font-medium">{{ filteredOptions[virtualRow.index]?.label }}</span>
              <span v-if="filteredOptions[virtualRow.index]?.description" class="truncate text-[10px] text-[var(--automa-text-muted)]">
                {{ filteredOptions[virtualRow.index]?.description }}
              </span>
            </div>

            <div class="ml-2 flex flex-shrink-0 items-center gap-1.5">
              <span
                v-if="filteredOptions[virtualRow.index]?.badge"
                class="rounded px-1 py-0.5 text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              >
                {{ filteredOptions[virtualRow.index]?.badge?.text }}
              </span>
              <Check
                v-if="(filteredOptions[virtualRow.index]?.value as unknown) === props.modelValue"
                class="h-3.5 w-3.5 text-[var(--automa-accent)]"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
