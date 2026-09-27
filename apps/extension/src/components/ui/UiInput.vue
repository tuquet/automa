<template>
  <div :class="{ 'w-full': block, 'inline-block': !block }" class="input-ui">
    <label
      v-if="label || $slots.label"
      :for="componentId"
      class="mb-1.5 ml-0.5 block text-xs font-medium text-foreground"
    >
      <slot name="label">{{ label }}</slot>
    </label>
    <div class="relative flex w-full items-center">
      <slot name="prepend">
        <v-remixicon
          v-if="prependIcon"
          size="16"
          class="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
          :name="prependIcon"
        ></v-remixicon>
      </slot>
      <input
        v-bind="{
          readonly: disabled || readonly || null,
          placeholder,
          type,
          autocomplete,
          autofocus,
          min,
          max,
          list,
          step,
        }"
        :id="componentId"
        v-autofocus="autofocus"
        v-imask="mask"
        :class="[
          statusColors[status],
          inputClass,
          prependIcon || $slots.prepend ? 'pl-9 pr-3' : 'px-3',
          {
            'opacity-50 pointer-events-none': disabled,
            'appearance-none': list,
          },
        ]"
        :value="modelValue"
        class="flex h-8 w-full rounded-md border border-input bg-background py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 transition-colors shadow-2xs"
        @keydown="$emit('keydown', $event)"
        @keyup="$emit('keyup', $event)"
        @blur="$emit('blur', $event)"
        @focus="$emit('focus', $event)"
        @input="emitValue"
      />
      <slot name="append" />
    </div>
  </div>
</template>
<script setup>
/* eslint-disable vue/require-prop-types */
import { IMaskDirective as vImask } from 'vue-imask';
import { useComponentId } from '@/composable/componentId';

defineOptions({ name: 'UiInput' });

const props = defineProps({
  block: Boolean,
  modelModifiers: {
    default: () => ({}),
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  autofocus: {
    type: Boolean,
    default: false,
  },
  modelValue: {
    type: [String, Number, Object],
    default: '',
  },
  inputClass: {
    type: String,
    default: '',
  },
  prependIcon: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
  list: {
    type: String,
    default: null,
  },
  type: {
    type: String,
    default: 'text',
  },
  placeholder: {
    type: String,
    default: '',
  },
  max: {
    type: [String, Number],
    default: null,
  },
  min: {
    type: [String, Number],
    default: null,
  },
  autocomplete: {
    type: String,
    default: null,
  },
  step: {
    type: String,
    default: null,
  },
  mask: {
    type: [Array, Object],
    default: null,
  },
  status: {
    type: String,
    default: '',
  },
  unmaskValue: Boolean,
});
const emit = defineEmits([
  'update:modelValue',
  'change',
  'keydown',
  'blur',
  'keyup',
  'focus',
]);

const componentId = useComponentId('ui-input');

const statusColors = {
  error: 'border-destructive focus-visible:ring-destructive',
};

function emitValue(event) {
  let { value } = event.target;

  if (props.mask && props.unmaskValue) {
    const { maskRef } = event.target;
    if (maskRef && maskRef.unmaskedValue) value = maskRef.unmaskedValue;
  }

  if (props.modelModifiers.lowercase) {
    value = value.toLocaleLowerCase();
  } else if (props.modelModifiers.number) {
    value = +value;
  }

  emit('update:modelValue', value);
  emit('change', value);
}
</script>
<style>
.input-ui input[type='color'] {
  padding-top: 0;
  padding-bottom: 0;
}
</style>
