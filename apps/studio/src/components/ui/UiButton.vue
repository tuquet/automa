<template>
  <Button
    :as="tag"
    :variant="resolvedVariant"
    :size="resolvedSize"
    :disabled="disabled || loading"
    :class="[
      circle ? '!rounded-full' : '',
      block ? 'w-full' : '',
      color ? color : '',
      'relative select-none',
    ]"
    v-bind="$attrs"
  >
    <span
      class="flex h-full items-center justify-center gap-1.5"
      :class="{ 'opacity-20': loading }"
    >
      <slot></slot>
    </span>
    <div
      v-if="loading"
      class="absolute inset-0 flex items-center justify-center"
    >
      <ui-spinner class="size-3.5"></ui-spinner>
    </div>
  </Button>
</template>

<script setup>
import { computed } from 'vue';
import { Button } from '@automa/ui';
import UiSpinner from './UiSpinner.vue';

defineOptions({ name: 'UiButton' });

const props = defineProps({
  icon: Boolean,
  disabled: Boolean,
  loading: Boolean,
  circle: Boolean,
  block: Boolean,
  size: {
    type: String,
    default: '',
  },
  color: {
    type: String,
    default: '',
  },
  tag: {
    type: String,
    default: 'button',
  },
  btnType: {
    type: String,
    default: 'fill',
  },
  variant: {
    type: String,
    default: 'default',
  },
});

const resolvedSize = computed(() => {
  if (props.icon) return 'icon-sm';
  if (props.size) return props.size;
  return 'sm';
});

const resolvedVariant = computed(() => {
  if (props.btnType === 'transparent') {
    return 'ghost';
  }
  if (props.variant === 'danger') {
    return 'destructive';
  }
  if (props.variant === 'primary') {
    return 'default';
  }
  if (props.variant === 'secondary') {
    return 'secondary';
  }
  if (props.variant === 'ghost') {
    return 'ghost';
  }
  if (props.variant === 'outline') {
    return 'outline';
  }
  if (props.variant === 'accent') {
    return 'default';
  }
  return 'secondary';
});
</script>
