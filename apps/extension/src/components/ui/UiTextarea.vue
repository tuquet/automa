<template>
  <div
    :class="{ 'w-full': block, 'inline-block': !block }"
    class="ui-textarea-wrapper"
  >
    <label
      v-if="label || $slots.label"
      :for="textareaId"
      class="mb-1.5 ml-0.5 block text-xs font-medium text-foreground"
    >
      <slot name="label">{{ label }}</slot>
    </label>
    <textarea
      v-bind="{ placeholder, maxlength: max }"
      :id="textareaId"
      ref="textarea"
      :value="modelValue"
      class="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 transition-colors shadow-2xs resize-y"
      @input="emitValue"
      @keyup="$emit('keyup', $event)"
      @keydown="$emit('keydown', $event)"
      @focus="$emit('focus', $event)"
      @blur="$emit('blur', $event)"
    ></textarea>
  </div>
</template>
<script>
import { ref, onMounted } from 'vue';
import { useComponentId } from '@/composable/componentId';

export default {
  name: 'UiTextarea',
  props: {
    modelValue: {
      type: String,
      default: '',
    },
    label: {
      type: String,
      default: '',
    },
    placeholder: {
      type: String,
      default: '',
    },
    autoresize: {
      type: Boolean,
      default: false,
    },
    max: {
      type: [Number, String],
      default: null,
    },
    block: Boolean,
  },
  emits: ['update:modelValue', 'change', 'focus', 'blur', 'keyup', 'keydown'],
  setup(props, { emit }) {
    const textareaId = useComponentId('textarea');
    const textarea = ref(null);

    function calcHeight() {
      if (!props.autoresize) return;

      textarea.value.style.height = 'auto';
      textarea.value.style.height = `${textarea.value.scrollHeight}px`;
    }
    function emitValue(event) {
      let { value } = event.target;
      const maxLength = Math.abs(props.max) || Infinity;

      if (value.length > maxLength) {
        value = value.slice(0, maxLength);
      }

      emit('update:modelValue', value);
      emit('change', value);
      // calcHeight();
    }

    onMounted(calcHeight);

    return {
      textarea,
      emitValue,
      textareaId,
    };
  },
};
</script>
