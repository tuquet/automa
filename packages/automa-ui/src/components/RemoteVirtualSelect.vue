<script setup lang="ts" generic="T = string">
import { getSelectSchema, type SelectFsmState, type SelectOption } from '@automa/types'
import { useVirtualizer } from '@tanstack/vue-virtual'
import {
  Check,
  ChevronDown,
  Globe,
  Inbox,
  Loader2,
  Plus,
  Search,
  SearchX,
  Workflow,
  X,
} from 'lucide-vue-next'
import { computed, nextTick, ref, watch } from 'vue'
import {
  useBrowsersQuery,
  useStorageTablesQuery,
  useStorageVariablesQuery,
  useWorkflowsQuery,
} from '../hooks'
import { useBrowserStore, useStorageStore } from '../stores'

defineOptions({
  name: 'RemoteVirtualSelect',
})

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
  (e: 'create', selectId: string): void
}>()

const schema = computed(() => getSelectSchema(props.id))
const isOpen = ref(false)
const searchQuery = ref('')
const parentRef = ref<HTMLElement | null>(null)
const searchInputRef = ref<HTMLInputElement | null>(null)
const focusedIndex = ref<number>(-1)

// Domain stores for cross-layer reactive reflection
const browserStore = useBrowserStore()
const storageStore = useStorageStore()

// Automatic Query Dispatching based on Select Schema ID
const browsersQuery = useBrowsersQuery({
  enabled: computed(() => props.id === 'select.browser.profile'),
})
const workflowsQuery = useWorkflowsQuery({
  enabled: computed(() => props.id === 'select.storage.workflow'),
})
const tablesQuery = useStorageTablesQuery()
const variablesQuery = useStorageVariablesQuery()

const rawOptions = computed<SelectOption<T>[]>(() => {
  if (props.customOptions) return props.customOptions

  if (props.id === 'select.browser.profile') {
    const list =
      browsersQuery.data.value && browsersQuery.data.value.length > 0
        ? browsersQuery.data.value
        : browserStore.browsers

    return list.map((b) => {
      const bObj = b as {
        id?: string
        name?: string
        userAgent?: string
        user_agent?: string
        isOnline?: boolean
        is_online?: boolean
      }
      return {
        value: (bObj.id || '') as unknown as string | number,
        label: bObj.name || bObj.id || '',
        description: bObj.userAgent || bObj.user_agent || undefined,
        badge:
          (bObj.isOnline ?? bObj.is_online)
            ? { text: 'Online', variant: 'success' as const }
            : undefined,
      }
    }) as SelectOption<T>[]
  }

  if (props.id === 'select.storage.workflow') {
    return (workflowsQuery.data.value || []).map((w) => ({
      value: (w.id || '') as unknown as string | number,
      label: w.name || w.id || '',
      description: `v${w.version || '1.0.0'}`,
    })) as SelectOption<T>[]
  }

  if (props.id === 'select.storage.table') {
    const list =
      tablesQuery.data.value && tablesQuery.data.value.length > 0
        ? tablesQuery.data.value
        : (storageStore.tables as Array<{ id?: string; name?: string; columns?: unknown[] }>)

    return list.map((t) => ({
      value: (t.id || '') as unknown as string | number,
      label: t.name || t.id || '',
      description: `${t.columns?.length || 0} columns`,
    })) as SelectOption<T>[]
  }

  if (props.id === 'select.storage.variable') {
    const list =
      variablesQuery.data.value && variablesQuery.data.value.length > 0
        ? variablesQuery.data.value
        : (storageStore.variables as Array<{
            key?: string
            id?: string
            name?: string
            value?: unknown
          }>)

    return list.map((v) => ({
      value: (v.key || v.id || '') as unknown as string | number,
      label: v.name || v.key || v.id || '',
      description: typeof v.value === 'string' ? v.value : JSON.stringify(v.value),
    })) as SelectOption<T>[]
  }

  return []
})

const isLoading = computed(() => {
  if (props.id === 'select.browser.profile') {
    return browsersQuery.isLoading.value && browserStore.browsers.length === 0
  }
  if (props.id === 'select.storage.workflow') {
    return workflowsQuery.isLoading.value
  }
  if (props.id === 'select.storage.table') {
    return tablesQuery.isLoading.value && storageStore.tables.length === 0
  }
  if (props.id === 'select.storage.variable') {
    return variablesQuery.isLoading.value && storageStore.variables.length === 0
  }
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

const itemHeight = computed(() => schema.value?.virtualization?.itemHeightPx || 40)

// TanStack Virtual Engine - wrapped in computed for reactive count and container measurement
const rowVirtualizer = useVirtualizer(
  computed(() => ({
    count: filteredOptions.value.length,
    getScrollElement: () => parentRef.value,
    estimateSize: () => itemHeight.value,
    overscan: 5,
    initialRect: { width: 0, height: 240 },
  })),
)

const virtualItems = computed(() => rowVirtualizer.value.getVirtualItems())
const totalSize = computed(() => {
  const size = rowVirtualizer.value.getTotalSize()
  return size > 0 ? size : filteredOptions.value.length * itemHeight.value
})

const displayItems = computed(() => {
  const items = virtualItems.value
  if (items.length > 0) return items
  return filteredOptions.value.map((_, index) => ({
    index,
    key: index,
    start: index * itemHeight.value,
    size: itemHeight.value,
  }))
})

function toggleDropdown() {
  if (props.disabled) return
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    if (
      props.id === 'select.browser.profile' &&
      (!browsersQuery.data.value || browsersQuery.data.value.length === 0)
    ) {
      browsersQuery.refetch()
    } else if (
      props.id === 'select.storage.workflow' &&
      (!workflowsQuery.data.value || workflowsQuery.data.value.length === 0)
    ) {
      workflowsQuery.refetch()
    }
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

function handleCreateAction() {
  emit('create', props.id)
  isOpen.value = false
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
    class="automa-select-wrapper"
    :data-testid="schema?.presentation?.dataTestId || props.id.replace(/\./g, '-')"
    @keydown="handleKeydown"
  >
    <!-- Select Trigger Button -->
    <button
      type="button"
      class="automa-select-trigger"
      :data-testid="`${schema?.presentation?.dataTestId || props.id.replace(/\./g, '-')}-trigger`"
      :aria-expanded="isOpen"
      :disabled="props.disabled"
      @click="toggleDropdown"
    >
      <span class="truncate flex items-center gap-1.5 flex-1 text-left">
        <template v-if="selectedOption">
          <span class="font-medium truncate">{{ selectedOption.label }}</span>
          <span
            v-if="selectedOption.badge"
            class="inline-flex items-center rounded px-1.5 py-0.2 text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shrink-0"
          >
            {{ selectedOption.badge.text }}
          </span>
        </template>
        <template v-else>
          <span class="text-[var(--automa-text-muted)] truncate">{{ props.placeholder }}</span>
        </template>
      </span>

      <span class="ml-2 flex items-center shrink-0">
        <Loader2 v-if="isLoading" class="h-3.5 w-3.5 animate-spin text-[var(--automa-text-muted)]" />
        <ChevronDown v-else class="h-3.5 w-3.5 text-[var(--automa-text-muted)] transition-transform duration-200" :class="{ 'rotate-180': isOpen }" />
      </span>
    </button>

    <!-- Dropdown Popover -->
    <div
      v-if="isOpen"
      class="automa-select-popover"
    >
      <!-- Search Box -->
      <div v-if="schema?.search?.searchable !== false" class="automa-select-search">
        <div class="automa-select-search-box">
          <Search class="automa-select-search-icon" />
          <input
            ref="searchInputRef"
            v-model="searchQuery"
            type="text"
            class="automa-select-search-input"
            :data-testid="`${schema?.presentation?.dataTestId || props.id.replace(/\./g, '-')}-search`"
            :placeholder="schema?.search?.placeholder || 'Search options...'"
          />
          <button
            v-if="searchQuery"
            type="button"
            class="automa-select-clear-btn"
            :data-testid="`${schema?.presentation?.dataTestId || props.id.replace(/\./g, '-')}-clear`"
            @click="searchQuery = ''"
          >
            <X class="h-3 w-3" />
          </button>
        </div>
      </div>

      <!-- State Renderers -->
      <div v-if="fsmState === 'LOADING'" class="flex items-center justify-center py-6 text-[var(--automa-text-muted)] gap-2">
        <Loader2 class="h-4 w-4 animate-spin text-[var(--automa-accent)]" />
        <span class="text-xs">Loading items...</span>
      </div>

      <div v-else-if="fsmState === 'EMPTY'" class="automa-select-empty-container">
        <!-- Search Query Empty State -->
        <template v-if="searchQuery.trim()">
          <SearchX class="h-6 w-6 text-[var(--automa-text-muted)] opacity-60" />
          <div class="text-center px-3">
            <p class="text-xs font-semibold text-[var(--automa-text-primary)]">No results</p>
            <p class="text-xs text-[var(--automa-text-muted)] mt-0.5 break-all">
              "<span class="font-mono text-[var(--automa-text-primary)]">{{ searchQuery }}</span>"
            </p>
          </div>
        </template>

        <!-- Domain Empty State: Browsers -->
        <template v-else-if="props.id === 'select.browser.profile'">
          <div class="automa-select-empty-icon-wrap">
            <Globe class="h-5 w-5 text-[var(--automa-text-muted)]" />
          </div>
          <div class="text-center px-4">
            <p class="text-xs font-semibold text-[var(--automa-text-primary)]">No browsers</p>
          </div>
          <button
            type="button"
            class="automa-btn automa-btn-primary automa-btn-sm mt-1"
            data-testid="btn-create-browser"
            @click="handleCreateAction"
          >
            <Plus class="h-3.5 w-3.5 mr-1" />
            <span>New Browser</span>
          </button>
        </template>

        <!-- Domain Empty State: Workflows -->
        <template v-else-if="props.id === 'select.storage.workflow'">
          <div class="automa-select-empty-icon-wrap">
            <Workflow class="h-5 w-5 text-[var(--automa-text-muted)]" />
          </div>
          <div class="text-center px-4">
            <p class="text-xs font-semibold text-[var(--automa-text-primary)]">No workflows</p>
          </div>
          <button
            type="button"
            class="automa-btn automa-btn-primary automa-btn-sm mt-1"
            data-testid="btn-create-workflow"
            @click="handleCreateAction"
          >
            <Plus class="h-3.5 w-3.5 mr-1" />
            <span>New Workflow</span>
          </button>
        </template>

        <!-- Fallback Generic Empty State -->
        <template v-else>
          <div class="automa-select-empty-icon-wrap">
            <Inbox class="h-5 w-5 text-[var(--automa-text-muted)]" />
          </div>
          <div class="text-center px-4">
            <p class="text-xs font-semibold text-[var(--automa-text-primary)]">No items</p>
          </div>
        </template>
      </div>

      <!-- TanStack Virtual Scroll Container -->
      <div
        v-else
        ref="parentRef"
        class="max-h-60 overflow-y-auto overflow-x-hidden p-1 automa-select-scroll"
      >
        <div
          :style="{
            height: `${totalSize}px`,
            width: '100%',
            position: 'relative',
          }"
        >
          <div
            v-for="virtualRow in displayItems"
            :key="(virtualRow.key as PropertyKey)"
            :ref="(el) => rowVirtualizer.measureElement(el as HTMLElement)"
            :data-index="virtualRow.index"
            :style="{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              transform: `translateY(${virtualRow.start}px)`,
            }"
            class="automa-select-item"
            :class="[
              (filteredOptions[virtualRow.index]?.value as unknown) === props.modelValue ? 'is-selected' : '',
              focusedIndex === virtualRow.index ? 'bg-[var(--automa-bg-hover)] ring-1 ring-[var(--automa-border-focus)]' : '',
            ]"
            @click="selectItem(filteredOptions[virtualRow.index]!)"
          >
            <div class="flex flex-col truncate">
              <span class="truncate font-medium">{{ filteredOptions[virtualRow.index]?.label }}</span>
              <span v-if="filteredOptions[virtualRow.index]?.description" class="truncate text-xs text-[var(--automa-text-muted)]">
                {{ filteredOptions[virtualRow.index]?.description }}
              </span>
            </div>

            <div class="ml-2 flex flex-shrink-0 items-center gap-1.5">
              <span
                v-if="filteredOptions[virtualRow.index]?.badge"
                class="rounded px-1.5 py-0.2 text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
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
