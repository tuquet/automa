<script setup lang="ts">
import {
  ArrowLeftFromLine,
  ArrowRightFromLine,
  Copy,
  FolderKanban,
  FolderOutput,
  PackagePlus,
  Play,
  Trash2,
} from '@lucide/vue';

const props = defineProps<{
  visible: boolean;
  x: number;
  y: number;
  isPackageCanvas?: boolean;
  selectedCount: number;
  canUngroup?: boolean;
  targetNodeId?: string | null;
  targetHandle?: {
    nodeId: string;
    handleId: string;
    type: 'source' | 'target';
  } | null;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'duplicate'): void;
  (e: 'copy'): void;
  (e: 'paste'): void;
  (e: 'group'): void;
  (e: 'ungroup'): void;
  (e: 'save-as-package'): void;
  (e: 'execute-from-block', nodeId: string): void;
  (e: 'delete-selected'): void;
  (
    e: 'set-package-io',
    payload: {
      ioType: 'inputs' | 'outputs';
      nodeId: string;
      handleId: string;
    },
  ): void;
}>();
</script>

<template>
  <div
    v-if="props.visible"
    class="fixed inset-0 z-50"
    @click="emit('close')"
    @contextmenu.prevent="emit('close')"
  >
    <div
      class="fixed z-50 w-56 rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-lg"
      :style="{ left: `${props.x}px`, top: `${props.y}px` }"
      @click.stop
    >
      <!-- Package Handle I/O Mapping (Official Automa EditorLocalCtxMenu.vue) -->
      <template v-if="props.isPackageCanvas && props.targetHandle">
        <button
          v-if="props.targetHandle.type === 'target'"
          type="button"
          class="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-primary hover:bg-accent"
          @click="
            emit('set-package-io', {
              ioType: 'inputs',
              nodeId: props.targetHandle.nodeId,
              handleId: props.targetHandle.handleId,
            });
            emit('close');
          "
        >
          <ArrowRightFromLine class="size-3.5" />
          <span>Set as package input</span>
        </button>

        <button
          v-if="props.targetHandle.type === 'source'"
          type="button"
          class="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-primary hover:bg-accent"
          @click="
            emit('set-package-io', {
              ioType: 'outputs',
              nodeId: props.targetHandle.nodeId,
              handleId: props.targetHandle.handleId,
            });
            emit('close');
          "
        >
          <ArrowLeftFromLine class="size-3.5" />
          <span>Set as package output</span>
        </button>

        <div class="my-1 border-t border-border" />
      </template>

      <!-- Standard Node & Selection Actions -->
      <button
        v-if="props.selectedCount > 0"
        type="button"
        class="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs text-foreground hover:bg-accent"
        @click="
          emit('duplicate');
          emit('close');
        "
      >
        <span class="flex items-center gap-2">
          <Copy class="size-3.5 text-muted-foreground" />
          Duplicate ({{ props.selectedCount }})
        </span>
        <span class="text-xs text-muted-foreground">Ctrl+D</span>
      </button>

      <button
        v-if="!props.isPackageCanvas && props.selectedCount > 0"
        type="button"
        class="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs font-medium text-primary hover:bg-accent"
        @click="
          emit('save-as-package');
          emit('close');
        "
      >
        <PackagePlus class="size-3.5" />
        <span>Save to Package...</span>
      </button>

      <button
        v-if="props.selectedCount > 1"
        type="button"
        class="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-foreground hover:bg-accent"
        @click="
          emit('group');
          emit('close');
        "
      >
        <FolderKanban class="size-3.5 text-muted-foreground" />
        <span>Group Selected Blocks</span>
      </button>

      <button
        v-if="props.canUngroup"
        type="button"
        class="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-foreground hover:bg-accent"
        @click="
          emit('ungroup');
          emit('close');
        "
      >
        <FolderOutput class="size-3.5 text-muted-foreground" />
        <span>Ungroup Blocks</span>
      </button>

      <button
        v-if="!props.isPackageCanvas && props.targetNodeId"
        type="button"
        class="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs text-foreground hover:bg-accent"
        @click="
          emit('execute-from-block', props.targetNodeId);
          emit('close');
        "
      >
        <Play class="size-3.5 text-primary" />
        <span>Execute from this block</span>
      </button>

      <template v-if="props.selectedCount > 0">
        <div class="my-1 border-t border-border" />
        <button
          type="button"
          class="flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs text-destructive hover:bg-destructive/10"
          @click="
            emit('delete-selected');
            emit('close');
          "
        >
          <span class="flex items-center gap-2">
            <Trash2 class="size-3.5" />
            Delete Selected
          </span>
          <span class="text-xs">Del</span>
        </button>
      </template>
    </div>
  </div>
</template>
