<template>
  <Dialog :open="modelValue" @update:open="onUpdateOpen">
    <DialogContent
      :class="[
        'p-5 text-foreground max-h-[85vh] overflow-y-auto border border-border bg-card shadow-xl rounded-xl flex flex-col',
        contentClass || 'max-w-lg',
      ]"
    >
      <DialogHeader
        v-if="!customContent && (title || $slots.header)"
        class="border-b border-border/80 pb-3 mb-3"
      >
        <DialogTitle
          class="text-base font-semibold flex items-center justify-between text-foreground"
        >
          <slot name="header">{{ title }}</slot>
          <slot name="header-append" />
        </DialogTitle>
        <DialogDescription
          v-if="description || $slots.description"
          class="text-xs text-muted-foreground mt-1"
        >
          <slot name="description">{{ description }}</slot>
        </DialogDescription>
        <DialogDescription v-else class="sr-only">
          {{ title || 'Dialog' }}
        </DialogDescription>
      </DialogHeader>

      <slot v-if="customContent" :close="closeModal"></slot>
      <div v-else :class="padding || ''">
        <slot :close="closeModal"></slot>
      </div>
      <div
        v-if="$slots.footer"
        class="border-t border-border/80 pt-3 mt-4 flex items-center justify-end gap-2"
      >
        <slot name="footer" :close="closeModal"></slot>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@automa/ui';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  contentClass: {
    type: String,
    default: 'max-w-lg',
  },
  title: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
  padding: {
    type: String,
    default: '',
  },
  customContent: Boolean,
  persist: Boolean,
  blur: Boolean,
  disabledTeleport: Boolean,
});

const emit = defineEmits(['close', 'update:modelValue']);

function closeModal() {
  if (props.persist) return;
  emit('close', false);
  emit('update:modelValue', false);
}

function onUpdateOpen(isOpen) {
  if (!isOpen && props.persist) return;
  emit('update:modelValue', isOpen);
  if (!isOpen) emit('close', false);
}
</script>
