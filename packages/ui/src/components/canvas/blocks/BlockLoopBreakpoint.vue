<script setup lang="ts">
import { Badge } from '@tuquet/vue-ui';
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
      <Badge variant="outline" class="truncate font-mono text-xs">
        loopId: {{ (props.data?.loopId as string) || 'default' }}
      </Badge>
      <CanvasHandle
        :id="`${props.id}-output-1`"
        :node-id="props.id"
        type="source"
        position="right"
        title="Next Iteration / Exit"
        @start-connect="emit('start-connect', $event)"
        @end-connect="emit('end-connect', $event)"
        @handle-contextmenu="emit('handle-contextmenu', $event)"
      />
    </div>
  </BlockBaseShell>
</template>
