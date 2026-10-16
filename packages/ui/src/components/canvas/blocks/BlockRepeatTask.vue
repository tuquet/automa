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

function onRepeatInput(val: string | number) {
  const num = Number(val);
  emit('update', { ...props.data, repeatFor: Number.isNaN(num) ? val : num });
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
        <div class="flex flex-1 items-center gap-1.5">
          <Input
            type="number"
            class="h-8 text-xs"
            :model-value="String(props.data?.repeatFor ?? 1)"
            @update:model-value="onRepeatInput"
            @mousedown.stop
          />
          <span class="text-xs text-muted-foreground">times</span>
        </div>
        <CanvasHandle
          :id="`${props.id}-output-1`"
          :node-id="props.id"
          type="source"
          position="right"
          title="Continue after repeats"
          @start-connect="emit('start-connect', $event)"
          @end-connect="emit('end-connect', $event)"
          @handle-contextmenu="emit('handle-contextmenu', $event)"
        />
      </div>

      <div class="flex items-center justify-end gap-2 border-t border-border/50 pt-1.5">
        <span class="text-xs font-medium text-primary">Repeat from</span>
        <CanvasHandle
          :id="`${props.id}-output-repeat`"
          :node-id="props.id"
          type="source"
          position="right"
          variant="io"
          title="Repeat Loop Target"
          @start-connect="emit('start-connect', $event)"
          @end-connect="emit('end-connect', $event)"
          @handle-contextmenu="emit('handle-contextmenu', $event)"
        />
      </div>
    </div>
  </BlockBaseShell>
</template>
