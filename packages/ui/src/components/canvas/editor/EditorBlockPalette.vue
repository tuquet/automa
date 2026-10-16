<script setup lang="ts">
import type { AutomaPackage } from '@automa/types';
import { ExternalLink, GripVertical, Package, Plus, Search } from '@lucide/vue';
import { Badge, Button, Input, Tabs, TabsContent, TabsList, TabsTrigger } from '@tuquet/vue-ui';
import { computed, ref } from 'vue';
import {
  type AutomaBlockMeta,
  BLOCK_CATEGORIES,
  type BlockCategoryKey,
  getBlocksByCategory,
} from '../../../utils/block-registry.js';

const props = withDefaults(
  defineProps<{
    isPackageCanvas?: boolean;
    packages?: AutomaPackage[];
  }>(),
  {
    isPackageCanvas: false,
    packages: () => [],
  },
);

const emit = defineEmits<{
  (e: 'add-block', meta: AutomaBlockMeta): void;
  (e: 'add-package', pkg: AutomaPackage): void;
  (e: 'open-package', pkgId: string): void;
  (e: 'create-package'): void;
}>();

const activeTab = ref<'blocks' | 'packages'>('blocks');
const searchQuery = ref('');
const pkgSearchQuery = ref('');

const categorizedBlocks = computed(() =>
  getBlocksByCategory({
    isPackage: props.isPackageCanvas,
    search: searchQuery.value,
  }),
);

const categoryOrder: BlockCategoryKey[] = [
  'general',
  'browser',
  'interaction',
  'conditions',
  'data',
  'onlineServices',
];

const filteredPackages = computed(() => {
  const q = pkgSearchQuery.value.trim().toLowerCase();
  if (!q) return props.packages;
  return props.packages.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      (p.description || '').toLowerCase().includes(q),
  );
});

function onBlockDragStart(event: DragEvent, block: AutomaBlockMeta) {
  if (!event.dataTransfer) return;
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData(
    'block',
    JSON.stringify({
      id: block.id,
      component: block.component,
      data: block.defaultData,
    }),
  );
}

function onPackageDragStart(event: DragEvent, pkg: AutomaPackage) {
  if (!event.dataTransfer) return;
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('savedBlocks', JSON.stringify(pkg));
}
</script>

<template>
  <aside class="flex h-full w-72 shrink-0 flex-col border-r border-border bg-card">
    <Tabs v-model="activeTab" class="flex h-full flex-col">
      <div class="border-b border-border p-3">
        <TabsList v-if="!props.isPackageCanvas" class="grid h-9 w-full grid-cols-2">
          <TabsTrigger value="blocks" class="text-xs">Blocks</TabsTrigger>
          <TabsTrigger value="packages" class="text-xs">
            Packages ({{ props.packages.length }})
          </TabsTrigger>
        </TabsList>
        <div v-else class="text-sm font-semibold text-foreground">
          Package Block Palette
        </div>
      </div>

      <!-- Tab 1: Standard Blocks -->
      <TabsContent value="blocks" class="mt-0 flex min-h-0 flex-1 flex-col">
        <div class="border-b border-border/60 p-3">
          <div class="relative">
            <Search class="pointer-events-none absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <Input
              v-model="searchQuery"
              class="h-8 pl-8 text-xs"
              placeholder="Filter blocks..."
            />
          </div>
        </div>

        <div class="flex-1 space-y-4 overflow-y-auto p-3">
          <template v-for="catKey in categoryOrder" :key="catKey">
            <div v-if="categorizedBlocks[catKey].length > 0" class="space-y-1.5">
              <div class="flex items-center justify-between px-1">
                <span class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {{ BLOCK_CATEGORIES[catKey].name }}
                </span>
                <span class="text-xs text-muted-foreground">
                  {{ categorizedBlocks[catKey].length }}
                </span>
              </div>

              <div class="grid grid-cols-1 gap-1.5">
                <div
                  v-for="block in categorizedBlocks[catKey]"
                  :key="block.id"
                  draggable="true"
                  class="group flex cursor-grab items-center justify-between rounded-lg border border-border/70 bg-background px-2.5 py-2 transition-colors hover:border-primary/50 hover:bg-accent/50 active:cursor-grabbing"
                  @dragstart="onBlockDragStart($event, block)"
                  @dblclick="emit('add-block', block)"
                >
                  <div class="flex min-w-0 items-center gap-2">
                    <GripVertical class="size-3.5 shrink-0 text-muted-foreground" />
                    <div class="min-w-0">
                      <div class="truncate text-xs font-medium text-foreground">
                        {{ block.name }}
                      </div>
                      <div class="truncate text-xs text-muted-foreground">
                        {{ block.description }}
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    class="h-7 w-7 shrink-0 p-0 opacity-0 group-hover:opacity-100"
                    title="Add block to canvas"
                    @click.stop="emit('add-block', block)"
                  >
                    <Plus class="size-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </template>
        </div>
      </TabsContent>

      <!-- Tab 2: Saved Packages (Official Automa EditorLocalSavedBlocks.vue) -->
      <TabsContent
        v-if="!props.isPackageCanvas"
        value="packages"
        class="mt-0 flex min-h-0 flex-1 flex-col"
      >
        <div class="flex items-center gap-1.5 border-b border-border/60 p-3">
          <div class="relative flex-1">
            <Search class="pointer-events-none absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
            <Input
              v-model="pkgSearchQuery"
              class="h-8 pl-8 text-xs"
              placeholder="Search packages..."
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            class="h-8 px-2 text-xs"
            title="Create New Package"
            @click="emit('create-package')"
          >
            <Plus class="size-3.5" />
          </Button>
        </div>

        <div class="flex-1 space-y-2 overflow-y-auto p-3">
          <div
            v-for="pkg in filteredPackages"
            :key="pkg.id"
            draggable="true"
            class="group flex cursor-grab flex-col gap-1.5 rounded-xl border border-border bg-background p-2.5 transition-colors hover:border-primary/50 hover:bg-accent/40 active:cursor-grabbing"
            @dragstart="onPackageDragStart($event, pkg)"
            @dblclick="emit('add-package', pkg)"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="flex min-w-0 items-center gap-2">
                <Package class="size-4 shrink-0 text-primary" />
                <span class="truncate text-xs font-semibold text-foreground">
                  {{ pkg.name }}
                </span>
              </div>
              <Badge variant="outline" class="shrink-0 text-xs">
                {{ pkg.settings?.asBlock !== false ? 'asBlock' : 'Inline' }}
              </Badge>
            </div>

            <p class="line-clamp-2 text-xs text-muted-foreground">
              {{ pkg.description || `${pkg.data?.nodes?.length || 0} blocks` }}
            </p>

            <div class="flex items-center justify-between pt-1 text-xs text-muted-foreground">
              <span>
                {{ pkg.inputs?.length || 0 }} in / {{ pkg.outputs?.length || 0 }} out
              </span>
              <div class="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  class="h-7 w-7 p-0"
                  title="Edit Package in Package Canvas"
                  @click.stop="emit('open-package', pkg.id)"
                >
                  <ExternalLink class="size-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  class="h-7 w-7 p-0"
                  title="Insert Package into Workflow"
                  @click.stop="emit('add-package', pkg)"
                >
                  <Plus class="size-3.5" />
                </Button>
              </div>
            </div>
          </div>

          <div
            v-if="filteredPackages.length === 0"
            class="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground"
          >
            No packages found. Select blocks on the canvas and right-click
            <span class="font-medium text-foreground">"Save to Package"</span>.
          </div>
        </div>
      </TabsContent>
    </Tabs>
  </aside>
</template>
