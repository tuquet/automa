<script setup lang="ts">
import { Textarea } from '@tuquet/vue-ui';
import BlockBaseShell from './BlockBaseShell.vue';

const props = defineProps<{
  id: string;
  label: string;
  data: Record<string, unknown>;
  selected?: boolean;
  active?: boolean;
  isPackageCanvas?: boolean;
}>();

const emit = defineEmits<{
  (e: 'edit'): void;
  (e: 'settings'): void;
  (e: 'delete'): void;
  (e: 'run-from-block'): void;
  (e: 'update', data: Record<string, unknown>): void;
}>();

function onNoteChange(val: string | number) {
  emit('update', { ...props.data, note: String(val) });
}
</script>

<template>
  <BlockBaseShell
    :id="props.id"
    :label="props.label"
    :data="props.data"
    :selected="props.selected"
    :active="props.active"
    :is-package-canvas="props.isPackageCanvas"
    @edit="emit('edit')"
    @settings="emit('settings')"
    @delete="emit('delete')"
    @run-from-block="emit('run-from-block')"
  >
    <Textarea
      class="min-h-16 resize-y bg-muted/40 text-xs text-foreground"
      placeholder="Write note or workflow documentation..."
      :model-value="String(props.data?.note ?? props.data?.description ?? '')"
      @update:model-value="onNoteChange"
      @mousedown.stop
    />
  </BlockBaseShell>
</template>
