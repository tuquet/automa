<script setup lang="ts">
import { Input } from '@tuquet/vue-ui';
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
  (e: 'update', data: Record<string, unknown>): void;
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

function onTimeInput(val: string | number) {
  const num = Number(val);
  emit('update', { ...props.data, time: Number.isNaN(num) ? val : num });
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

      <div class="flex flex-1 items-center gap-1.5">
        <Input
          type="number"
          class="h-8 text-xs"
          :model-value="String(props.data?.time ?? 1000)"
          placeholder="ms"
          @update:model-value="onTimeInput"
          @mousedown.stop
        />
        <span class="text-xs text-muted-foreground">ms</span>
      </div>

      <CanvasHandle
        :id="`${props.id}-output-1`"
        :node-id="props.id"
        type="source"
        position="right"
        title="Output"
        @start-connect="emit('start-connect', $event)"
        @end-connect="emit('end-connect', $event)"
        @handle-contextmenu="emit('handle-contextmenu', $event)"
      />
    </div>
  </BlockBaseShell>
</template>
