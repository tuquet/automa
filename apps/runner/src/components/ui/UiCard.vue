<template>
  <component
    :is="tag"
    v-bind="$attrs"
    class="ui-card rounded-lg border border-border bg-card text-card-foreground shadow-2xs"
    :class="[
      padding,
      { 'hover:shadow-md hover:-translate-y-0.5 transition-all': hover },
    ]"
  >
    <slot></slot>
  </component>
</template>
<script>
export default {
  name: 'UiCard',
  props: {
    hover: {
      type: Boolean,
      default: false,
    },
    padding: {
      type: String,
      default: 'p-4',
    },
    tag: {
      type: String,
      default: 'div',
    },
  },
};
</script>
