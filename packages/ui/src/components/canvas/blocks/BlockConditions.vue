<script setup lang="ts">
import { computed } from 'vue';
import BlockBaseShell from './BlockBaseShell.vue';
import CanvasHandle from './CanvasHandle.vue';

interface ConditionBranch {
  id: string;
  name?: string;
  type?: string;
  value?: unknown;
  compareValue?: unknown;
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

const conditions = computed<ConditionBranch[]>(() => {
  const list = props.data?.conditions;
  if (Array.isArray(list) && list.length > 0) {
    return list as ConditionBranch[];
  }
  return [{ id: '1', name: 'Branch 1' }];
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
    <div class="space-y-1.5">
      <div class="flex items-center justify-between gap-2 pb-1">
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
          {{ (props.data?.description as string) || `${conditions.length} condition(s)` }}
        </span>
        <span class="w-1" />
      </div>

      <div
        v-for="(cond, idx) in conditions"
        :key="cond.id || idx"
        class="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-2 py-1"
      >
        <span class="truncate text-xs font-medium text-foreground">
          {{ cond.name || `Path ${idx + 1}` }}
        </span>
        <CanvasHandle
          :id="`${props.id}-output-${cond.id || idx + 1}`"
          :node-id="props.id"
          type="source"
          position="right"
          :title="cond.name || `Condition ${idx + 1}`"
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
