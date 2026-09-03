<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next'
import type { SelectTriggerProps } from 'radix-vue'
import { SelectIcon, SelectTrigger, useForwardProps } from 'radix-vue'
import type { HTMLAttributes } from 'vue'
import { cn } from '../../../lib/utils'

const props = defineProps<SelectTriggerProps & { class?: HTMLAttributes['class'] }>()

const forwardedProps = useForwardProps(props)
</script>

<template>
  <SelectTrigger
    v-bind="forwardedProps"
    :class="
      cn(
        'flex h-7 w-full items-center justify-between rounded-md border border-input bg-background px-2 py-1 text-xs text-foreground ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer transition-colors hover:bg-accent/40',
        props.class,
      )
    "
  >
    <slot />
    <SelectIcon as-child>
      <ChevronDown class="size-3.5 opacity-50 ml-1 shrink-0" />
    </SelectIcon>
  </SelectTrigger>
</template>
