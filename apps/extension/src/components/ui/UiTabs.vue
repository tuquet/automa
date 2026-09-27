<template>
  <div
    :class="[
      tabTypes[type] || tabTypes['default'],
      { [color]: type === 'fill' },
    ]"
    aria-role="tablist"
    class="ui-tabs relative flex items-center space-x-1 text-muted-foreground"
    @mouseleave="showHoverIndicator = false"
  >
    <div
      v-show="showHoverIndicator"
      ref="hoverIndicator"
      class="ui-tabs__indicator bg-accent/50 absolute left-0 z-0 rounded-md"
      style="top: 50%; transform: translate(0, -50%)"
    ></div>
    <slot></slot>
  </div>
</template>
<script setup>
import { provide, toRefs, ref } from 'vue';

defineOptions({ name: 'UiTabs' });

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: '',
  },
  type: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'fill'].includes(value),
  },
  color: {
    type: String,
    default: 'bg-muted',
  },
  small: Boolean,
  fill: Boolean,
});
const emit = defineEmits(['update:modelValue', 'change']);

const tabTypes = {
  default: 'border-b border-border',
  fill: 'p-1 rounded-md border border-border bg-muted',
};

const hoverIndicator = ref(null);
const showHoverIndicator = ref(false);

function updateActive(id) {
  emit('change', id);
  emit('update:modelValue', id);
}
function hoverHandler({ target }) {
  const isFill = props.type === 'fill';

  if (target.classList.contains('is-active') && isFill) {
    showHoverIndicator.value = false;

    return;
  }

  const { height, width } = target.getBoundingClientRect();
  const elHeight = isFill ? height - 4 : height - 11;

  showHoverIndicator.value = true;
  hoverIndicator.value.style.width = `${width}px`;
  hoverIndicator.value.style.height = `${elHeight}px`;
  hoverIndicator.value.style.display = 'inline-block';
  hoverIndicator.value.style.transform = `translate(${target.offsetLeft}px, -50%)`;
}

provide('ui-tabs', {
  updateActive,
  hoverHandler,
  ...toRefs(props),
});
</script>
<style>
.ui-tabs__indicator {
  min-height: 24px;
  min-width: 50px;
  transition-duration: 200ms;
  transition-property: transform, width;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
