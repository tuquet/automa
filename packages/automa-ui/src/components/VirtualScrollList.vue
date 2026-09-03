<script setup lang="ts" generic="T">
import { useVirtualizer } from '@tanstack/vue-virtual'
import { computed, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    items: T[]
    estimateSize?: number
    overscan?: number
    getItemKey?: (item: T, index: number) => string | number
  }>(),
  {
    estimateSize: 40,
    overscan: 5,
    getItemKey: undefined,
  },
)

const parentRef = ref<HTMLElement | null>(null)

const rowVirtualizer = useVirtualizer(
  computed(() => ({
    count: props.items.length,
    getScrollElement: () => parentRef.value,
    estimateSize: () => props.estimateSize,
    overscan: props.overscan,
  })),
)

const virtualItems = computed(() => rowVirtualizer.value.getVirtualItems())
const totalSize = computed(() => rowVirtualizer.value.getTotalSize())

defineExpose({
  scrollToIndex: (index: number, options?: { align?: 'start' | 'center' | 'end' | 'auto' }) => {
    rowVirtualizer.value.scrollToIndex(index, options)
  },
  scrollToOffset: (offset: number) => {
    rowVirtualizer.value.scrollToOffset(offset)
  },
})
</script>

<template>
  <div
    ref="parentRef"
    class="automa-virtual-list-container relative h-full w-full overflow-y-auto"
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
        :key="props.getItemKey ? (props.getItemKey(props.items[virtualRow.index]!, virtualRow.index) as PropertyKey) : (virtualRow.key as PropertyKey)"
        :ref="(el) => rowVirtualizer.measureElement(el as HTMLElement)"
        :data-index="virtualRow.index"
        :style="{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          transform: `translateY(${virtualRow.start}px)`,
        }"
      >
        <slot
          :item="props.items[virtualRow.index]!"
          :index="virtualRow.index"
          :is-scrolling="rowVirtualizer.isScrolling"
        />
      </div>
    </div>
  </div>
</template>
