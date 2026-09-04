<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '../../../lib/utils'

const props = defineProps<{
  class?: HTMLAttributes['class']
}>()
</script>

<template>
  <div
    data-dialog-handle
    :class="cn('flex flex-col gap-y-1.5 text-left cursor-grab active:cursor-grabbing select-none', props.class)"
  >
    <slot />
  </div>
</template>
