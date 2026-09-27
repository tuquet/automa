<template>
  <label
    class="radio-ui inline-flex items-center cursor-pointer select-none text-xs"
  >
    <div
      class="relative inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
    >
      <input
        type="radio"
        class="radio-ui__input absolute inset-0 opacity-0 cursor-pointer z-10"
        :value="value"
        v-bind="{ checked: isChecked }"
        @change="changeHandler"
      />
      <div
        class="radio-ui__mark absolute inset-0 rounded-full border border-input bg-background flex items-center justify-center transition-colors shadow-2xs"
        :class="{ 'border-primary': isChecked }"
      >
        <span v-if="isChecked" class="h-2 w-2 rounded-full bg-primary"></span>
      </div>
    </div>
    <span
      v-if="$slots.default"
      class="ml-2 inline-block font-medium text-foreground"
    >
      <slot></slot>
    </span>
  </label>
</template>
<script>
import { computed } from 'vue';

export default {
  name: 'UiRadio',
  props: {
    modelValue: {
      type: String,
      default: '',
    },
    value: {
      type: String,
      default: undefined,
    },
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit }) {
    const isChecked = computed(() => props.value === props.modelValue);

    function changeHandler({ target: { value } }) {
      emit('update:modelValue', value);
      emit('change', value);
    }

    return {
      isChecked,
      changeHandler,
    };
  },
};
</script>
<style scoped>
.radio-ui:hover .radio-ui__mark {
  border-color: var(--ring, #3b82f6);
}
</style>
