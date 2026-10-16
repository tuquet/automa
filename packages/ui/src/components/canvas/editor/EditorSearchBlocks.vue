<script setup lang="ts">
import type { WorkflowNode } from '@automa/types';
import { Search, X } from '@lucide/vue';
import { Button, Input } from '@tuquet/vue-ui';
import { computed, ref } from 'vue';
import { getBlockMeta } from '../../../utils/block-registry.js';

const props = defineProps<{
  nodes: WorkflowNode[];
}>();

const emit = defineEmits<{
  (e: 'focus-node', nodeId: string): void;
}>();

const isOpen = ref(false);
const query = ref('');

const filteredNodes = computed(() => {
  const q = query.value.trim().toLowerCase();
  if (!q) return props.nodes.slice(0, 15);
  return props.nodes.filter((n) => {
    const meta = getBlockMeta(n.label);
    const desc = String(n.data?.description || n.data?.name || '').toLowerCase();
    return (
      n.id.toLowerCase().includes(q) ||
      n.label.toLowerCase().includes(q) ||
      meta.name.toLowerCase().includes(q) ||
      desc.includes(q)
    );
  });
});

function selectNode(nodeId: string) {
  emit('focus-node', nodeId);
  isOpen.value = false;
}
</script>

<template>
  <div class="relative">
    <Button
      variant="outline"
      size="sm"
      class="h-8 gap-1.5 bg-card text-xs shadow-sm"
      @click="isOpen = !isOpen"
    >
      <Search class="size-3.5 text-muted-foreground" />
      <span>Search Blocks ({{ props.nodes.length }})</span>
    </Button>

    <div
      v-if="isOpen"
      class="absolute bottom-10 left-0 z-30 w-72 rounded-xl border border-border bg-popover p-2.5 text-popover-foreground shadow-lg"
    >
      <div class="mb-2 flex items-center gap-1.5">
        <Input
          v-model="query"
          class="h-8 text-xs"
          placeholder="Search by block name, ID, or note..."
        />
        <Button
          variant="ghost"
          size="sm"
          class="h-8 w-8 shrink-0 p-0"
          @click="isOpen = false"
        >
          <X class="size-3.5" />
        </Button>
      </div>

      <div class="max-h-56 space-y-1 overflow-y-auto">
        <button
          v-for="node in filteredNodes"
          :key="node.id"
          type="button"
          class="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs hover:bg-accent"
          @click="selectNode(node.id)"
        >
          <div class="min-w-0">
            <div class="truncate font-medium text-foreground">
              {{ getBlockMeta(node.label).name }}
            </div>
            <div class="truncate text-xs text-muted-foreground">
              {{ (node.data?.description as string) || node.id }}
            </div>
          </div>
          <span class="ml-2 shrink-0 font-mono text-xs text-muted-foreground">
            {{ node.label }}
          </span>
        </button>

        <div
          v-if="filteredNodes.length === 0"
          class="py-4 text-center text-xs text-muted-foreground"
        >
          No matching blocks on canvas
        </div>
      </div>
    </div>
  </div>
</template>
