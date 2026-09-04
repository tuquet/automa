<script setup lang="ts">
import { reactiveOmit } from '@vueuse/core'
import type { TabsTriggerProps } from 'radix-vue'
import { TabsTrigger, useForwardProps } from 'radix-vue'
import type { HTMLAttributes } from 'vue'
import { cn } from '../../../lib/utils'

const props = defineProps<TabsTriggerProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')

const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <TabsTrigger
    v-bind="forwardedProps"
    :class="cn(
      'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1 text-xs font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-xs [&_svg]:size-3.5 [&_svg]:shrink-0',
      props.class,
    )"
  >
    <slot />
  </TabsTrigger>
</template>
