<script setup lang="ts">
import type { ButtonHTMLAttributes, HTMLAttributes } from 'vue'
import { cn } from '../../../lib/utils'
import type { ButtonVariants } from '.'
import { buttonVariants } from '.'

interface Props {
  as?: string
  type?: ButtonHTMLAttributes['type']
  variant?: ButtonVariants['variant']
  size?: ButtonVariants['size']
  class?: HTMLAttributes['class']
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  as: 'button',
  type: 'button',
  variant: 'default',
  size: 'default',
  disabled: false,
  class: undefined,
})
</script>

<template>
  <component
    :is="as"
    :type="as === 'button' ? type : undefined"
    :disabled="disabled"
    :class="cn(buttonVariants({ variant, size }), props.class)"
  >
    <slot />
  </component>
</template>
