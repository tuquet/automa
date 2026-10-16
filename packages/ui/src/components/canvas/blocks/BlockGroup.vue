<script setup lang="ts">
import { computed } from 'vue';
import { getBlockMeta } from '../../../utils/block-registry.js';
import BlockBaseShell from './BlockBaseShell.vue';
import CanvasHandle from './CanvasHandle.vue';

interface GroupSubBlock {
  id: string;
  itemId: string;
  data: Record<string, unknown>;
}

const props = defineProps<{
  id: string;
  label: string;
  data: Record<string, unknown>;
  selected?: boolean;
  active?: boolean;
  isPackageCanvas?: boolean;
}>();

const emit = defineEmits<{
  (e: 'edit', subItem?: GroupSubBlock): void;
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

const subBlocks = computed<GroupSubBlock[]>(() => {
  const arr = props.data?.blocks;
  return Array.isArray(arr) ? (arr as GroupSubBlock[]) : [];
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
        <span class="truncate text-xs text-muted-foreground">
          {{ (props.data?.name as string) || `${subBlocks.length} grouped block(s)` }}
        </span>
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

      <div v-if="subBlocks.length > 0" class="max-h-32 space-y-1 overflow-y-auto pt-1">
        <div
          v-for="sub in subBlocks"
          :key="sub.itemId"
          class="flex cursor-pointer items-center justify-between rounded-md border border-border/60 bg-muted/40 px-2 py-1 text-xs hover:bg-accent"
          @click.stop="emit('edit', sub)"
        >
          <span class="truncate font-medium text-foreground">
            {{ getBlockMeta(sub.id).name }}
          </span>
          <span class="truncate text-xs text-muted-foreground">
            {{ (sub.data?.description as string) || sub.id }}
          </span>
        </div>
      </div>
    </div>
  </BlockBaseShell>
</template>
