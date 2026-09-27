<template>
  <div
    class="ui-switch relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors shadow-2xs"
    :class="[
      modelValue ? 'bg-primary' : 'bg-muted',
      { 'pointer-events-none opacity-50': disabled },
    ]"
  >
    <input
      :checked="modelValue"
      type="checkbox"
      class="absolute left-0 top-0 z-50 h-full w-full cursor-pointer opacity-0"
      v-bind="{ disabled, readonly: disabled || null }"
      @input="emitEvent"
    />
    <div
      class="ui-switch__ball pointer-events-none block h-4 w-4 rounded-full bg-background shadow-md ring-0 transition-transform duration-200"
      :class="modelValue ? 'translate-x-4' : 'translate-x-0'"
    >
      <slot v-if="$slots.ball" name="ball"></slot>
    </div>
  </div>
</template>
<script>
export default {
  name: 'UiSwitch',
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    disabled: Boolean,
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit }) {
    return {
      emitEvent: () => {
        const newValue = !props.modelValue;

        emit('change', newValue);
        emit('update:modelValue', newValue);
      },
    };
  },
};
</script>
<style scoped>
.ui-switch:active {
  transform: scale(0.96);
}
</style>
