<script setup lang="ts">
import { reactiveOmit } from '@vueuse/core'
import { X } from 'lucide-vue-next'
import type { DialogContentEmits, DialogContentProps } from 'radix-vue'
import {
  DialogClose,
  DialogContent,
  DialogOverlay,
  DialogPortal,
  useForwardPropsEmits,
} from 'radix-vue'
import { type HTMLAttributes, ref } from 'vue'
import { type DraggableTarget, useDraggableDialog } from '../../../hooks/useDraggableDialog'
import { cn } from '../../../lib/utils'

const props = withDefaults(
  defineProps<
    DialogContentProps & {
      class?: HTMLAttributes['class']
      draggable?: boolean
    }
  >(),
  {
    draggable: true,
  },
)
const emits = defineEmits<DialogContentEmits>()

const delegatedProps = reactiveOmit(props, 'class', 'draggable')

const forwarded = useForwardPropsEmits(delegatedProps, emits)

const contentRef = ref<DraggableTarget>(null)
const { deltaX, deltaY, isDragging, onPointerDown, onDoubleClick } = useDraggableDialog(
  contentRef,
  {
    enabled: () => props.draggable,
  },
)
</script>

<template>
  <DialogPortal>
    <DialogOverlay
      class="fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
    />
    <DialogContent
      ref="contentRef"
      v-bind="forwarded"
      :style="
        props.draggable
          ? {
              transform: `translate(calc(-50% + ${deltaX}px), calc(-50% + ${deltaY}px))`,
              transition: isDragging ? 'none' : undefined,
            }
          : undefined
      "
      :class="
        cn(
          'fixed left-1/2 top-1/2 z-50 flex flex-col w-full max-w-lg -translate-x-1/2 -translate-y-1/2 gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
          isDragging && 'select-none',
          props.class,
        )
      "
      @pointerdown="onPointerDown"
      @dblclick="onDoubleClick"
    >
      <slot />

      <DialogClose
        class="absolute right-4 top-4 inline-flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground opacity-70 transition-all hover:opacity-100 hover:bg-accent hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
        aria-label="Close"
        title="Close"
      >
        <X class="w-4 h-4" />
        <span class="sr-only">Close</span>
      </DialogClose>
    </DialogContent>
  </DialogPortal>
</template>
