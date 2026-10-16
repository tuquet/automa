<script setup lang="ts">
import type { PackageIO } from '@automa/types';
import { ExternalLink, Package, Pencil, RefreshCw, Settings2, Trash2 } from '@lucide/vue';
import { Badge, Button } from '@tuquet/vue-ui';
import { computed } from 'vue';
import CanvasHandle from './CanvasHandle.vue';

const props = defineProps<{
  id: string;
  label: string;
  data: Record<string, unknown>;
  selected?: boolean;
  active?: boolean;
  hasPackageUpdate?: boolean;
}>();

const emit = defineEmits<{
  (e: 'edit'): void;
  (e: 'settings'): void;
  (e: 'delete'): void;
  (e: 'sync-package'): void;
  (e: 'open-package', pkgId: string): void;
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

const pkgName = computed(
  () =>
    (props.data?.name as string) ||
    (props.data?.packageName as string) ||
    'Unnamed Package',
);

const pkgDescription = computed(
  () => (props.data?.description as string) || 'Encapsulated workflow package',
);

const packageId = computed(
  () => (props.data?.id as string) || (props.data?.packageId as string) || '',
);

const inputs = computed<PackageIO[]>(() => {
  const arr = props.data?.inputs;
  if (Array.isArray(arr) && arr.length > 0) {
    return arr as PackageIO[];
  }
  return [
    {
      id: '1',
      name: 'Input',
      blockId: '',
      handleId: `${props.id}-input-1`,
    },
  ];
});

const outputs = computed<PackageIO[]>(() => {
  const arr = props.data?.outputs;
  if (Array.isArray(arr) && arr.length > 0) {
    return arr as PackageIO[];
  }
  return [
    {
      id: '1',
      name: 'Output',
      blockId: '',
      handleId: `${props.id}-output-1`,
    },
  ];
});
</script>

<template>
  <div
    class="group/node relative w-64 select-none rounded-xl border bg-card text-card-foreground shadow-sm transition-all"
    :class="[
      props.selected
        ? 'border-primary ring-2 ring-primary/30'
        : 'border-border hover:border-primary/50',
      props.active ? 'ring-2 ring-primary animate-pulse' : '',
    ]"
    @dblclick.stop="emit('edit')"
  >
    <!-- Hover Floating Action Toolbar -->
    <div
      class="absolute -top-9 right-0 z-20 hidden items-center gap-1 rounded-lg border border-border bg-popover p-1 shadow-md group-hover/node:flex"
      :class="{ '!flex': props.selected || props.hasPackageUpdate }"
    >
      <Button
        v-if="props.hasPackageUpdate"
        variant="ghost"
        size="sm"
        class="h-7 px-2 text-xs text-primary hover:bg-primary/10"
        title="Sync with latest package definition"
        @click.stop="emit('sync-package')"
      >
        <RefreshCw class="mr-1 size-3.5" />
        Sync
      </Button>
      <Button
        v-if="packageId"
        variant="ghost"
        size="sm"
        class="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
        title="Open in Package Canvas"
        @click.stop="emit('open-package', packageId)"
      >
        <ExternalLink class="size-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        class="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
        title="Inspect Package Block"
        @click.stop="emit('edit')"
      >
        <Pencil class="size-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        class="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
        title="Block Error Settings"
        @click.stop="emit('settings')"
      >
        <Settings2 class="size-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        class="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
        title="Delete Package Block"
        @click.stop="emit('delete')"
      >
        <Trash2 class="size-3.5" />
      </Button>
    </div>

    <!-- Header -->
    <div class="flex items-center justify-between gap-2 border-b border-border/60 bg-accent/40 px-3 py-2.5 rounded-t-xl">
      <div class="flex min-w-0 items-center gap-2.5">
        <div class="flex size-8 shrink-0 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
          <Package class="size-4" />
        </div>
        <div class="min-w-0">
          <div class="truncate text-sm font-semibold text-foreground">
            {{ pkgName }}
          </div>
          <div class="truncate text-xs text-muted-foreground">
            {{ pkgDescription }}
          </div>
        </div>
      </div>
      <Badge variant="outline" class="shrink-0 text-xs">
        Package
      </Badge>
    </div>

    <!-- Two-Column Dynamic Inputs & Outputs (Official Automa BlockPackage.vue layout) -->
    <div class="grid grid-cols-2 gap-2 px-3 py-2.5 text-xs">
      <!-- Left Column: Inputs -->
      <div class="space-y-1.5">
        <div class="text-xs font-medium text-muted-foreground">Inputs</div>
        <div
          v-for="input in inputs"
          :key="input.id"
          class="flex items-center gap-2 py-0.5"
        >
          <CanvasHandle
            :id="`${props.id}-input-${input.id}`"
            :node-id="props.id"
            type="target"
            position="left"
            variant="io"
            :title="input.name || input.id"
            @start-connect="emit('start-connect', $event)"
            @end-connect="emit('end-connect', $event)"
            @handle-contextmenu="emit('handle-contextmenu', $event)"
          />
          <span class="truncate text-xs text-foreground">
            {{ input.name || input.id }}
          </span>
        </div>
      </div>

      <!-- Right Column: Outputs -->
      <div class="space-y-1.5 text-right">
        <div class="text-xs font-medium text-muted-foreground">Outputs</div>
        <div
          v-for="output in outputs"
          :key="output.id"
          class="flex items-center justify-end gap-2 py-0.5"
        >
          <span class="truncate text-xs text-foreground">
            {{ output.name || output.id }}
          </span>
          <CanvasHandle
            :id="`${props.id}-output-${output.id}`"
            :node-id="props.id"
            type="source"
            position="right"
            variant="io"
            :title="output.name || output.id"
            @start-connect="emit('start-connect', $event)"
            @end-connect="emit('end-connect', $event)"
            @handle-contextmenu="emit('handle-contextmenu', $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
