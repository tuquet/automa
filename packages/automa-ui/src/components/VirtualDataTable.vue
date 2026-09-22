<script setup lang="ts" generic="TData">
import type {
  ColumnDef,
  ColumnFiltersState,
  PaginationState,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from '@tanstack/vue-table'
import {
  FlexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useVueTable,
} from '@tanstack/vue-table'
import { useVirtualizer } from '@tanstack/vue-virtual'
import { ArrowDown, ArrowUp, ArrowUpDown, Loader2, Search } from 'lucide-vue-next'
import { computed, ref, watch } from 'vue'
import {
  Input,
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from './ui'

defineOptions({
  name: 'VirtualDataTable',
})

const props = withDefaults(
  defineProps<{
    data: TData[]
    columns: ColumnDef<TData, unknown>[]
    title?: string
    searchPlaceholder?: string
    enableSearch?: boolean
    enableVirtualization?: boolean
    estimateRowHeight?: number
    overscan?: number
    enablePagination?: boolean
    pageSizeOptions?: number[]
    initialPageSize?: number
    serverPagination?: {
      pageIndex: number
      pageSize: number
      totalRows: number
      pageCount?: number
    }
    isLoading?: boolean
    emptyText?: string
    emptyDescription?: string
    enableRowSelection?: boolean
    borderless?: boolean
  }>(),
  {
    title: undefined,
    searchPlaceholder: 'Search...',
    enableSearch: true,
    enableVirtualization: true,
    estimateRowHeight: 40,
    overscan: 8,
    enablePagination: true,
    pageSizeOptions: () => [10, 20, 50, 100],
    initialPageSize: 20,
    serverPagination: undefined,
    isLoading: false,
    emptyText: 'No records',
    emptyDescription: '',
    enableRowSelection: false,
    borderless: false,
  },
)

const emit = defineEmits<{
  'update:globalFilter': [query: string]
  'update:serverPage': [page: number]
  'update:serverPageSize': [size: number]
  'row-click': [row: TData]
  'selection-change': [selectedRows: TData[]]
}>()

// State Management
const sorting = ref<SortingState>([])
const columnFilters = ref<ColumnFiltersState>([])
const columnVisibility = ref<VisibilityState>({})
const rowSelection = ref<RowSelectionState>({})
const globalFilter = ref<string>('')

const pagination = ref<PaginationState>({
  pageIndex: props.serverPagination?.pageIndex ?? 0,
  pageSize: props.serverPagination?.pageSize ?? props.initialPageSize,
})

// Sync server pagination state
watch(
  () => props.serverPagination,
  (server) => {
    if (server) {
      pagination.value.pageIndex = server.pageIndex
      pagination.value.pageSize = server.pageSize
    }
  },
  { deep: true },
)

const isServerPaginated = computed(() => Boolean(props.serverPagination))

// TanStack Vue Table Instance
const table = useVueTable({
  get data() {
    return props.data
  },
  get columns() {
    return props.columns
  },
  state: {
    get sorting() {
      return sorting.value
    },
    get columnFilters() {
      return columnFilters.value
    },
    get columnVisibility() {
      return columnVisibility.value
    },
    get rowSelection() {
      return rowSelection.value
    },
    get globalFilter() {
      return globalFilter.value
    },
    get pagination() {
      return pagination.value
    },
  },
  manualPagination: isServerPaginated.value,
  pageCount: isServerPaginated.value
    ? (props.serverPagination?.pageCount ??
      Math.ceil((props.serverPagination?.totalRows ?? 0) / (props.serverPagination?.pageSize || 1)))
    : undefined,
  enableRowSelection: props.enableRowSelection,
  onSortingChange: (updaterOrValue) => {
    sorting.value =
      typeof updaterOrValue === 'function' ? updaterOrValue(sorting.value) : updaterOrValue
  },
  onColumnFiltersChange: (updaterOrValue) => {
    columnFilters.value =
      typeof updaterOrValue === 'function' ? updaterOrValue(columnFilters.value) : updaterOrValue
  },
  onColumnVisibilityChange: (updaterOrValue) => {
    columnVisibility.value =
      typeof updaterOrValue === 'function' ? updaterOrValue(columnVisibility.value) : updaterOrValue
  },
  onRowSelectionChange: (updaterOrValue) => {
    rowSelection.value =
      typeof updaterOrValue === 'function' ? updaterOrValue(rowSelection.value) : updaterOrValue
    const selected = table.getSelectedRowModel().rows.map((r) => r.original)
    emit('selection-change', selected)
  },
  onGlobalFilterChange: (updaterOrValue) => {
    const val =
      typeof updaterOrValue === 'function' ? updaterOrValue(globalFilter.value) : updaterOrValue
    globalFilter.value = val
    emit('update:globalFilter', val)
  },
  onPaginationChange: (updaterOrValue) => {
    pagination.value =
      typeof updaterOrValue === 'function' ? updaterOrValue(pagination.value) : updaterOrValue
    if (isServerPaginated.value) {
      emit('update:serverPage', pagination.value.pageIndex)
      emit('update:serverPageSize', pagination.value.pageSize)
    }
  },
  getCoreRowModel: getCoreRowModel(),
  getSortedRowModel: getSortedRowModel(),
  getFilteredRowModel: getFilteredRowModel(),
  getPaginationRowModel: isServerPaginated.value ? undefined : getPaginationRowModel(),
})

// Rows currently active in viewport (either paginated or all)
const tableRows = computed(() => table.getRowModel().rows)

// Virtualizer setup
const tableContainerRef = ref<HTMLElement | null>(null)

const rowVirtualizer = useVirtualizer(
  computed(() => ({
    count: props.enableVirtualization ? tableRows.value.length : 0,
    getScrollElement: () => tableContainerRef.value,
    estimateSize: () => props.estimateRowHeight,
    overscan: props.overscan,
  })),
)

const virtualRows = computed(() =>
  props.enableVirtualization ? rowVirtualizer.value.getVirtualItems() : [],
)

const totalVirtualHeight = computed(() =>
  props.enableVirtualization ? rowVirtualizer.value.getTotalSize() : 0,
)

// Pagination computations
const effectiveTotalRows = computed(() => {
  if (isServerPaginated.value && props.serverPagination) {
    return props.serverPagination.totalRows
  }
  return table.getFilteredRowModel().rows.length
})

const effectivePageCount = computed(() => {
  if (isServerPaginated.value && props.serverPagination) {
    return (
      props.serverPagination.pageCount ??
      Math.ceil(props.serverPagination.totalRows / (props.serverPagination.pageSize || 1))
    )
  }
  return table.getPageCount()
})

const selectedRowsCount = computed(() => Object.keys(rowSelection.value).length)

function onPageChange(newPageIndex: number) {
  table.setPageIndex(newPageIndex)
  if (isServerPaginated.value) {
    emit('update:serverPage', newPageIndex)
  }
}

function onPageSizeChange(newPageSize: number) {
  table.setPageSize(newPageSize)
  if (isServerPaginated.value) {
    emit('update:serverPageSize', newPageSize)
  }
}

function measureRowElement(el: unknown) {
  if (!el) return
  const node = ((el as { $el?: HTMLElement }).$el ?? el) as HTMLElement
  if (node && typeof node.getAttribute === 'function') {
    rowVirtualizer.value.measureElement(node)
  }
}
</script>

<template>
  <div
    class="automa-virtual-data-table flex flex-col w-full h-full overflow-hidden select-none"
    :class="
      borderless
        ? 'border-0 rounded-none bg-transparent'
        : 'border border-border rounded-lg bg-card'
    "
  >
    <!-- Top Toolbar Bar -->
    <div
      v-if="title || enableSearch || $slots.toolbar"
      class="flex flex-wrap items-center justify-between gap-2 p-3 border-b border-border bg-card/60"
      data-testid="data-table-toolbar"
    >
      <!-- Left: Title or Search -->
      <div class="flex items-center gap-2.5 flex-1 min-w-[200px]">
        <h3 v-if="title" class="font-semibold text-sm text-foreground mr-2 truncate">
          {{ title }}
        </h3>
        <div v-if="enableSearch" class="relative max-w-xs flex-1">
          <Search class="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
          <Input
            :model-value="globalFilter"
            :placeholder="searchPlaceholder"
            class="pl-8 h-8 text-xs bg-background/80"
            data-testid="input-table-search"
            @update:model-value="table.setGlobalFilter(String($event))"
          />
        </div>
      </div>

      <!-- Right: Custom Toolbar Slot & Extra Actions -->
      <div class="flex items-center gap-2">
        <slot name="toolbar" :table="table" :selected-count="selectedRowsCount" />
      </div>
    </div>

    <!-- Main Scrollable Table Viewport -->
    <div
      ref="tableContainerRef"
      class="flex-1 w-full overflow-auto relative min-h-[220px]"
      data-testid="table-viewport"
    >
      <!-- Loading Overlay -->
      <div
        v-if="isLoading"
        class="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[1px]"
        data-testid="table-loading-spinner"
      >
        <Loader2 class="size-6 animate-spin text-primary mb-1.5" />
        <span class="text-sm text-muted-foreground font-medium">Loading records...</span>
      </div>

      <Table class="w-full text-sm">
        <!-- Sticky Header -->
        <TableHeader class="sticky top-0 z-10 bg-muted/80 backdrop-blur-xs border-b border-border">
          <TableRow
            v-for="headerGroup in table.getHeaderGroups()"
            :key="headerGroup.id"
            class="hover:bg-transparent"
          >
            <TableHead
              v-for="header in headerGroup.headers"
              :key="header.id"
              :style="{ width: header.getSize() ? `${header.getSize()}px` : undefined }"
              class="h-9 px-3 text-sm font-semibold text-foreground select-none"
            >
              <div
                v-if="!header.isPlaceholder"
                class="flex items-center gap-1.5"
                :class="{
                  'cursor-pointer select-none hover:text-primary transition-colors':
                    header.column.getCanSort(),
                }"
                @click="header.column.getToggleSortingHandler()?.($event)"
              >
                <slot
                  :name="`header-${header.column.id}`"
                  :header="header"
                  :column="header.column"
                >
                  <FlexRender
                    :render="header.column.columnDef.header"
                    :props="header.getContext()"
                  />
                </slot>

                <!-- Sorting indicator icons -->
                <template v-if="header.column.getCanSort()">
                  <ArrowUp
                    v-if="header.column.getIsSorted() === 'asc'"
                    class="size-3 text-primary"
                  />
                  <ArrowDown
                    v-else-if="header.column.getIsSorted() === 'desc'"
                    class="size-3 text-primary"
                  />
                  <ArrowUpDown
                    v-else
                    class="size-3 text-muted-foreground/40 hover:text-foreground"
                  />
                </template>
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>

        <!-- Table Body: Virtualized Rows or Standard Rows -->
        <TableBody>
          <!-- Empty State -->
          <template v-if="tableRows.length === 0 && !isLoading">
            <TableRow>
              <TableCell :colspan="props.columns.length" class="h-44 text-center p-0">
                <slot name="empty">
                  <TableEmpty
                    :title="emptyText"
                    :description="emptyDescription"
                  />
                </slot>
              </TableCell>
            </TableRow>
          </template>

          <!-- Virtualized Rendering Mode -->
          <template v-else-if="enableVirtualization">
            <!-- Top padding row to maintain scroll bar proportion -->
            <tr
              v-if="virtualRows.length > 0 && virtualRows[0]!.start > 0"
              :style="{ height: `${virtualRows[0]!.start}px` }"
              aria-hidden="true"
            />

            <!-- Rendered Virtual Rows -->
            <TableRow
              v-for="virtualRow in virtualRows"
              :key="tableRows[virtualRow.index]!.id"
              :data-index="virtualRow.index"
              :data-state="tableRows[virtualRow.index]!.getIsSelected() ? 'selected' : undefined"
              :ref="measureRowElement"
              class="h-10 hover:bg-muted/50 cursor-pointer transition-colors border-b border-border/50"
              @click="emit('row-click', tableRows[virtualRow.index]!.original)"
            >
              <TableCell
                v-for="cell in tableRows[virtualRow.index]!.getVisibleCells()"
                :key="cell.id"
                class="px-3 py-2.5 text-sm"
              >
                <slot
                  :name="`cell-${cell.column.id}`"
                  :cell="cell"
                  :row="tableRows[virtualRow.index]!"
                  :value="cell.getValue()"
                >
                  <FlexRender
                    :render="cell.column.columnDef.cell"
                    :props="cell.getContext()"
                  />
                </slot>
              </TableCell>
            </TableRow>

            <!-- Bottom padding row to maintain scroll bar proportion -->
            <tr
              v-if="
                virtualRows.length > 0 &&
                totalVirtualHeight - virtualRows[virtualRows.length - 1]!.end > 0
              "
              :style="{
                height: `${totalVirtualHeight - virtualRows[virtualRows.length - 1]!.end}px`,
              }"
              aria-hidden="true"
            />
          </template>

          <!-- Non-Virtualized Standard Mode -->
          <template v-else>
            <TableRow
              v-for="row in tableRows"
              :key="row.id"
              :data-state="row.getIsSelected() ? 'selected' : undefined"
              class="h-10 hover:bg-muted/50 cursor-pointer transition-colors border-b border-border/50"
              @click="emit('row-click', row.original)"
            >
              <TableCell
                v-for="cell in row.getVisibleCells()"
                :key="cell.id"
                class="px-3 py-2.5 text-sm"
              >
                <slot
                  :name="`cell-${cell.column.id}`"
                  :cell="cell"
                  :row="row"
                  :value="cell.getValue()"
                >
                  <FlexRender
                    :render="cell.column.columnDef.cell"
                    :props="cell.getContext()"
                  />
                </slot>
              </TableCell>
            </TableRow>
          </template>
        </TableBody>
      </Table>
    </div>

    <!-- Bottom Pagination Footer -->
    <TablePagination
      v-if="enablePagination && (isServerPaginated || effectivePageCount > 1 || selectedRowsCount > 0)"
      :page-index="pagination.pageIndex"
      :page-size="pagination.pageSize"
      :page-count="effectivePageCount"
      :total-rows="effectiveTotalRows"
      :selected-count="selectedRowsCount"
      :page-size-options="pageSizeOptions"
      :disabled="isLoading"
      @update:page-index="onPageChange"
      @update:page-size="onPageSizeChange"
    />
  </div>
</template>
