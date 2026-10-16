<script setup lang="ts">
import { computed } from 'vue';
import { getBlockMeta } from '../../../utils/block-registry.js';
import BlockBaseShell from './BlockBaseShell.vue';
import CanvasHandle from './CanvasHandle.vue';

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
  (
    e: 'start-connect',
    payload: { nodeId: string; handleId: string; type: 'source' | 'target' },
  ): void;
  (
    e: 'end-connect',
    payload: { nodeId: string; handleId: string; type: 'source' | 'target' },
  ): void;
  (
    e: 'handle-contextmenu',
    payload: {
      event: MouseEvent;
      nodeId: string;
      handleId: string;
      type: 'source' | 'target';
    },
  ): void;
}>();

const meta = computed(() => getBlockMeta(props.label));
const summaryText = computed(() => {
  const d = props.data || {};
  return (
    (d.description as string) ||
    (d.url as string) ||
    (d.selector as string) ||
    meta.value.description
  );
});
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
    <div class="space-y-2">
      <div class="flex items-center justify-between gap-2">
        <CanvasHandle
          :id="`${props.id}-input-1`"
          :node-id="props.id"
          type="target"
          position="left"
          title="Input"
          @start-connect="emit('start-connect', $event)"
          @end-connect="emit('end-connect', $event)"
          @handle-contextmenu="emit('handle-contextmenu', $event)"
        />
        <p class="min-w-0 flex-1 truncate text-xs text-muted-foreground">
          {{ summaryText }}
        </p>
        <CanvasHandle
          :id="`${props.id}-output-1`"
          :node-id="props.id"
          type="source"
          position="right"
          title="Success Output"
          @start-connect="emit('start-connect', $event)"
          @end-connect="emit('end-connect', $event)"
          @handle-contextmenu="emit('handle-contextmenu', $event)"
        />
      </div>

      <div class="flex items-center justify-end gap-2 border-t border-border/50 pt-1.5">
        <span class="text-xs text-muted-foreground">Fallback</span>
        <CanvasHandle
          :id="`${props.id}-output-fallback`"
          :node-id="props.id"
          type="source"
          position="right"
          variant="fallback"
          title="Fallback Output"
          @start-connect="emit('start-connect', $event)"
          @end-connect="emit('end-connect', $event)"
          @handle-contextmenu="emit('handle-contextmenu', $event)"
        />
      </div>
    </div>
  </BlockBaseShell>
</template>
