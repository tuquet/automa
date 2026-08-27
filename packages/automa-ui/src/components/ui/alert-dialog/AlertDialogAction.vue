<script setup lang="ts">
import { reactiveOmit } from '@vueuse/core'
import type { AlertDialogActionProps } from 'radix-vue'
import { AlertDialogAction } from 'radix-vue'
import type { HTMLAttributes } from 'vue'
import { cn } from '../../../lib/utils'
import { buttonVariants } from '../button'

const props = defineProps<AlertDialogActionProps & { class?: HTMLAttributes['class'] }>()

const delegatedProps = reactiveOmit(props, 'class')
</script>

<template>
  <AlertDialogAction v-bind="delegatedProps" :class="cn(buttonVariants(), props.class)">
    <slot />
  </AlertDialogAction>
</template>
