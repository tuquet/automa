<template>
  <div class="ui-tab-panels">
    <slot></slot>
  </div>
</template>
<script setup>
import { toRefs, provide } from 'vue';

defineOptions({ name: 'UiTabPanels' });

/* eslint-disable-next-line */
const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: '',
  },
  cache: {
    type: Boolean,
    default: false,
  },
});

provide('ui-tab-panels', toRefs(props));
</script>
