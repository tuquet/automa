<script setup lang="ts">
import {
  Box,
  Clock,
  Code2,
  Cookie,
  Database,
  ExternalLink,
  FolderKanban,
  FormInput,
  GitBranch,
  GitFork,
  Globe,
  Keyboard,
  ListOrdered,
  MousePointerClick,
  Package,
  Pencil,
  Play,
  RefreshCw,
  Repeat,
  ScrollText,
  SearchCheck,
  Settings2,
  StickyNote,
  Terminal,
  Trash2,
  Type,
} from '@lucide/vue';
import { Badge, Button } from '@tuquet/vue-ui';
import { computed, type Component } from 'vue';
import { BLOCK_CATEGORIES, getBlockMeta } from '../../../utils/block-registry.js';

const props = withDefaults(
  defineProps<{
    id: string;
    label: string;
    data: Record<string, unknown>;
    selected?: boolean;
    active?: boolean;
    isPackageCanvas?: boolean;
    hideDefaultActions?: boolean;
  }>(),
  {
    selected: false,
    active: false,
    isPackageCanvas: false,
    hideDefaultActions: false,
  },
);

const emit = defineEmits<{
  (e: 'edit'): void;
  (e: 'settings'): void;
  (e: 'delete'): void;
  (e: 'run-from-block'): void;
}>();

const ICON_MAP: Record<string, Component> = {
  Play,
  Clock,
  GitBranch,
  Globe,
  FolderKanban,
  StickyNote,
  ExternalLink,
  Cookie,
  MousePointerClick,
  Type,
  Code2,
  FormInput,
  Terminal,
  Keyboard,
  GitFork,
  SearchCheck,
  Repeat,
  ListOrdered,
  RefreshCw,
  Database,
  ScrollText,
  Package,
  Box,
};

const meta = computed(() => getBlockMeta(props.label));
const categoryMeta = computed(() => BLOCK_CATEGORIES[meta.value.category]);
const iconComponent = computed(
  () => ICON_MAP[meta.value.icon] ?? Box,
);
const isDisabled = computed(() => Boolean(props.data?.disableBlock));
</script>

<template>
  <div
    class="group/node relative w-60 select-none rounded-xl border bg-card text-card-foreground shadow-sm transition-all"
    :class="[
      props.selected
        ? 'border-primary ring-2 ring-primary/30'
        : 'border-border hover:border-primary/50',
      props.active ? 'ring-2 ring-primary animate-pulse' : '',
      isDisabled ? 'opacity-60' : '',
    ]"
    @dblclick.stop="emit('edit')"
  >
    <!-- Hover Floating Action Toolbar -->
    <div
      v-if="!props.hideDefaultActions"
      class="absolute -top-9 right-0 z-20 hidden items-center gap-1 rounded-lg border border-border bg-popover p-1 shadow-md group-hover/node:flex"
      :class="{ '!flex': props.selected }"
    >
      <Button
        variant="ghost"
        size="sm"
        class="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
        title="Edit Block"
        @click.stop="emit('edit')"
      >
        <Pencil class="size-3.5" />
      </Button>
      <Button
        v-if="props.label !== 'trigger'"
        variant="ghost"
        size="sm"
        class="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
        title="Block Error & Retry Settings"
        @click.stop="emit('settings')"
      >
        <Settings2 class="size-3.5" />
      </Button>
      <Button
        v-if="props.label !== 'trigger' && !props.isPackageCanvas"
        variant="ghost"
        size="sm"
        class="h-7 w-7 p-0 text-muted-foreground hover:text-primary"
        title="Execute from this block"
        @click.stop="emit('run-from-block')"
      >
        <Play class="size-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        class="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
        title="Delete Block"
        @click.stop="emit('delete')"
      >
        <Trash2 class="size-3.5" />
      </Button>
    </div>

    <!-- Header -->
    <div class="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2.5">
      <div class="flex min-w-0 items-center gap-2.5">
        <div
          class="flex size-8 shrink-0 items-center justify-center rounded-lg border"
          :class="categoryMeta.badgeClass"
        >
          <component :is="iconComponent" class="size-4" />
        </div>
        <div class="min-w-0">
          <div class="truncate text-sm font-semibold text-foreground">
            {{ (props.data?.name as string) || meta.name }}
          </div>
          <div class="truncate text-xs text-muted-foreground">
            {{ props.label }}
          </div>
        </div>
      </div>
      <Badge v-if="isDisabled" variant="outline" class="shrink-0 text-xs">
        Disabled
      </Badge>
      <slot name="header-extra" />
    </div>

    <!-- Body + Handles -->
    <div class="relative px-3 py-2.5 text-xs text-muted-foreground">
      <slot />
    </div>
  </div>
</template>
