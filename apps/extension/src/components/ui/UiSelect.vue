<template>
  <div
    :class="{ 'w-full': block, 'inline-block': !block }"
    class="ui-select cursor-pointer"
  >
    <label
      v-if="label || $slots.label"
      :for="selectId"
      class="mb-1.5 ml-0.5 block text-xs font-medium text-foreground"
    >
      <slot name="label">
        {{ label }}
      </slot>
    </label>
    <div class="ui-select__content relative flex w-full items-center">
      <v-remixicon
        v-if="prependIcon"
        size="16"
        :name="prependIcon"
        class="absolute left-2.5 text-muted-foreground z-20"
      />
      <select
        :id="selectId"
        :disabled="disabled"
        :class="{
          'pl-8': prependIcon,
          'opacity-50 pointer-events-none': disabled,
        }"
        :value="modelValue"
        class="flex h-8 w-full appearance-none rounded-md border border-input bg-background px-3 py-1.5 pr-8 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 transition-colors shadow-2xs z-10 cursor-pointer"
        @change="emitValue"
      >
        <option v-if="placeholder" value="" disabled selected>
          {{ placeholder }}
        </option>
        <slot></slot>
      </select>
      <v-remixicon
        size="16"
        name="riArrowDownSLine"
        class="pointer-events-none absolute right-2.5 text-muted-foreground z-20"
      />
    </div>
  </div>
</template>
<script>
import { useComponentId } from '@/composable/componentId';

export default {
  name: 'UiSelect',
  props: {
    modelValue: {
      type: [String, Number],
      default: '',
    },
    label: {
      type: String,
      default: '',
    },
    prependIcon: {
      type: String,
      default: '',
    },
    placeholder: {
      type: String,
      default: '',
    },
    modelModifiers: {
      type: Object,
      default: () => ({}),
    },
    block: Boolean,
    disabled: Boolean,
    showDetail: Boolean,
  },
  emits: ['update:modelValue', 'change'],
  setup(props, { emit }) {
    const selectId = useComponentId('select');

    function emitValue(event) {
      let { value } = event.target;

      if (props.modelModifiers.number) {
        value = +value;
      }

      emit('update:modelValue', value);
      emit('change', value);
    }

    return {
      selectId,
      emitValue,
    };
  },
};
</script>
<style>
.ui-select__arrow {
  top: 50%;
  transform: translateY(-50%) rotate(90deg);
}
.ui-select option,
.ui-select optgroup {
  background-color: var(--card, #18181b);
  color: var(--card-foreground, #f4f4f5);
}
</style>
