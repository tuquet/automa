<template>
  <button
    :aria-selected="uiTabs.modelValue?.value === value"
    :class="[
      uiTabs.type?.value,
      {
        'pointer-events-none opacity-50': disabled,
        small: uiTabs.small?.value,
        'flex-1': uiTabs.fill?.value,
        'is-active': uiTabs.modelValue?.value === value,
      },
    ]"
    :tabIndex="uiTabs.modelValue?.value === value ? 0 : -1"
    aria-role="tab"
    class="ui-tab z-[1] transition-all focus:outline-none focus-visible:ring-1 focus-visible:ring-ring select-none text-xs font-medium cursor-pointer"
    @mouseenter="uiTabs.hoverHandler"
    @click="uiTabs.updateActive(value)"
  >
    <slot></slot>
  </button>
</template>
<script setup>
import { inject } from 'vue';

defineOptions({ name: 'UiTab' });

/* eslint-disable-next-line */
const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  value: {
    type: [String, Number],
    default: '',
  },
});

const uiTabs = inject('ui-tabs', {});
</script>
<style scoped>
.ui-tab {
  z-index: 1;
  padding: 0.5rem 0.75rem;
  border-bottom: 2px solid transparent;
  color: var(--muted-foreground);
}
.ui-tab:hover {
  color: var(--foreground);
}
.ui-tab.small {
  padding: 0.25rem 0.5rem;
}
.ui-tab.fill {
  border-radius: 0.25rem;
  border-bottom: 0;
  padding: 0.25rem 0.75rem;
}
.ui-tab.fill.small {
  padding: 0.25rem 0.5rem;
}
.ui-tab.is-active {
  border-bottom-color: var(--primary, #3b82f6);
  color: var(--foreground);
  font-weight: 600;
}
.ui-tab.is-active.fill {
  background-color: var(--card);
  color: var(--foreground);
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  font-weight: 500;
}
</style>
