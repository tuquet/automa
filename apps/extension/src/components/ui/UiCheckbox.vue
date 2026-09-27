<template>
  <label
    class="checkbox-ui items-center cursor-pointer select-none"
    :class="[block ? 'flex' : 'inline-flex']"
  >
    <div
      :class="{
        'pointer-events-none opacity-50': disabled,
      }"
      class="relative inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm"
    >
      <input
        :class="{ indeterminate }"
        type="checkbox"
        class="checkbox-ui__input opacity-0 absolute inset-0 w-full h-full cursor-pointer z-10"
        :value="modelValue"
        v-bind="{ checked: modelValue, disabled }"
        @change="changeHandler"
      />
      <div
        class="checkbox-ui__mark absolute inset-0 rounded-sm border border-input bg-background flex items-center justify-center transition-colors shadow-2xs"
      >
        <v-remixicon
          :name="indeterminate ? 'riSubtractLine' : 'riCheckLine'"
          size="12"
          class="text-primary-foreground"
        ></v-remixicon>
      </div>
    </div>
    <span
      v-if="$slots.default"
      class="ml-2 inline-block text-xs font-medium leading-none text-foreground select-none"
    >
      <slot></slot>
    </span>
  </label>
</template>
<script>
export default {
  name: 'UiCheckbox',
  props: {
    modelValue: {
      type: Boolean,
      default: false,
    },
    indeterminate: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: null,
    },
    block: {
      type: Boolean,
      default: null,
    },
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit }) {
    function changeHandler({ target: { checked } }) {
      emit('update:modelValue', checked);
      emit('change', checked);
    }

    return {
      changeHandler,
    };
  },
};
</script>
<style scoped>
.checkbox-ui:hover .checkbox-ui__mark {
  border-color: var(--ring, #3b82f6);
}
.checkbox-ui__input:checked ~ .checkbox-ui__mark,
.checkbox-ui__input.indeterminate ~ .checkbox-ui__mark {
  background-color: var(--primary);
  border-color: var(--primary);
  color: var(--primary-foreground);
}
.checkbox-ui__input:checked ~ .checkbox-ui__mark .v-remixicon,
.checkbox-ui__input.indeterminate ~ .checkbox-ui__mark .v-remixicon {
  transform: scale(1);
  opacity: 1;
}
.checkbox-ui__mark {
  width: 100%;
  height: 100%;
  transition: background-color 150ms ease, border-color 150ms ease,
    box-shadow 150ms ease;
  display: flex;
  align-items: center;
  justify-content: center;
}
.checkbox-ui__mark .v-remixicon {
  transform: scale(0.4);
  opacity: 0;
  transition: transform 150ms cubic-bezier(0.4, 0, 0.2, 1), opacity 150ms ease;
  color: currentColor;
}
</style>
