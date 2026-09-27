<template>
  <component
    :is="tag"
    class="ui-list-item flex w-full items-center rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring select-none text-xs cursor-pointer"
    role="listitem"
    :class="[
      active ? color : 'hover:bg-accent hover:text-accent-foreground',
      small ? 'py-1 px-2' : 'py-1.5 px-3',
      { 'pointer-events-none opacity-50': disabled },
    ]"
  >
    <slot></slot>
  </component>
</template>
<script>
export default {
  name: 'UiListItem',
  props: {
    active: Boolean,
    disabled: Boolean,
    small: Boolean,
    tag: {
      type: String,
      default: 'div',
    },
    color: {
      type: String,
      default: 'bg-accent text-accent-foreground font-medium',
    },
  },
};
</script>
