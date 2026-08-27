<script setup lang="ts">
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-vue-next'
import { Button } from '../../ui/button'

withDefaults(
  defineProps<{
    pageIndex: number
    pageSize: number
    pageCount: number
    totalRows: number
    selectedCount?: number
    pageSizeOptions?: number[]
    disabled?: boolean
  }>(),
  {
    selectedCount: 0,
    pageSizeOptions: () => [10, 20, 50, 100],
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:pageIndex': [page: number]
  'update:pageSize': [size: number]
}>()

function onPageSizeChange(value: unknown) {
  const size = Number(value)
  if (!Number.isNaN(size) && size > 0) {
    emit('update:pageSize', size)
    emit('update:pageIndex', 0)
  }
}
</script>

<template>
  <div
    class="flex flex-wrap items-center justify-between gap-2 px-2 py-2.5 border-t border-border bg-card/40 text-xs text-muted-foreground select-none"
    data-testid="table-pagination"
  >
    <!-- Left: Selected Count / Total Rows -->
    <div class="flex items-center gap-2">
      <span v-if="selectedCount > 0" class="font-medium text-foreground">
        {{ selectedCount }} of {{ totalRows }} row(s) selected
      </span>
      <span v-else>
        Total <strong class="text-foreground">{{ totalRows }}</strong> items
      </span>
    </div>

    <!-- Right: Page Size & Navigation Controls -->
    <div class="flex items-center gap-4 sm:gap-6">
      <!-- Rows per page selector -->
      <div class="flex items-center gap-2">
        <span class="hidden sm:inline text-muted-foreground">Rows per page</span>
        <select
          :value="String(pageSize)"
          :disabled="disabled"
          class="h-7 px-2 text-xs rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
          data-testid="select-page-size"
          @change="onPageSizeChange(($event.target as HTMLSelectElement).value)"
        >
          <option
            v-for="opt in pageSizeOptions"
            :key="opt"
            :value="String(opt)"
          >
            {{ opt }}
          </option>
        </select>
      </div>

      <!-- Page info indicator -->
      <div class="flex items-center justify-center font-medium min-w-[75px]">
        Page {{ pageIndex + 1 }} of {{ Math.max(1, pageCount) }}
      </div>

      <!-- Navigation buttons -->
      <div class="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-xs"
          :disabled="pageIndex <= 0 || disabled"
          data-testid="btn-pagination-first"
          title="Go to first page"
          @click="emit('update:pageIndex', 0)"
        >
          <ChevronsLeft class="size-3.5" />
        </Button>
        <Button
          variant="outline"
          size="icon-xs"
          :disabled="pageIndex <= 0 || disabled"
          data-testid="btn-pagination-prev"
          title="Go to previous page"
          @click="emit('update:pageIndex', pageIndex - 1)"
        >
          <ChevronLeft class="size-3.5" />
        </Button>
        <Button
          variant="outline"
          size="icon-xs"
          :disabled="pageIndex >= pageCount - 1 || disabled"
          data-testid="btn-pagination-next"
          title="Go to next page"
          @click="emit('update:pageIndex', pageIndex + 1)"
        >
          <ChevronRight class="size-3.5" />
        </Button>
        <Button
          variant="outline"
          size="icon-xs"
          :disabled="pageIndex >= pageCount - 1 || disabled"
          data-testid="btn-pagination-last"
          title="Go to last page"
          @click="emit('update:pageIndex', Math.max(0, pageCount - 1))"
        >
          <ChevronsRight class="size-3.5" />
        </Button>
      </div>
    </div>
  </div>
</template>
