<template>
  <ui-expand
    :data-testid="`block-category-${category?.name || 'blocks'}`"
    hide-header-icon
    header-class="flex items-center py-2 focus:ring-0 w-full text-left text-xs font-semibold text-foreground group select-none"
  >
    <template #header="{ show }">
      <span
        :class="category?.color || 'bg-primary'"
        class="h-2 w-2 rounded-full mr-2 shrink-0 ring-2 ring-border/50"
      ></span>
      <p
        class="flex-1 capitalize text-xs font-semibold text-foreground tracking-tight"
      >
        {{ category?.name || 'Blocks' }}
      </p>
      <span class="mr-2 text-xs text-muted-foreground font-mono">
        {{ blocks.length }}
      </span>
      <v-remixicon
        :name="show ? 'ChevronDown' : 'ChevronRight'"
        size="16"
        class="text-muted-foreground transition-transform"
      />
    </template>
    <div class="mb-3 grid grid-cols-2 gap-2">
      <div
        v-for="block in blocks"
        :key="block.id"
        :data-testid="`block-item-${block.id}`"
        :title="getBlockTitle(block)"
        draggable="true"
        class="group relative flex flex-col justify-between p-2.5 rounded-lg border border-border/60 bg-card hover:bg-accent/40 hover:border-border hover:shadow-xs transition-all duration-150 cursor-grab active:cursor-grabbing select-none"
        @dragstart="$event.dataTransfer.setData('block', JSON.stringify(block))"
      >
        <!-- Hover Action Toolbar (Hidden by default, shown on hover via opacity) -->
        <div
          class="opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none group-hover:pointer-events-auto absolute right-1.5 top-1.5 z-10 flex items-center gap-0.5 bg-card/90 backdrop-blur-xs rounded-md border border-border/50 p-0.5 shadow-2xs"
        >
          <a
            :data-testid="`btn-docs-block-${block.id}`"
            :href="`https://docs.extension.automa.site/blocks/${block.id}.html`"
            :title="t('common.docs')"
            target="_blank"
            rel="noopener"
            class="inline-flex items-center justify-center p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition"
          >
            <v-remixicon name="Info" size="13" />
          </a>
          <button
            type="button"
            :data-testid="`btn-pin-block-${block.id}`"
            :title="`${pinned.includes(block.id) ? 'Unpin' : 'Pin'} block`"
            class="inline-flex items-center justify-center p-1 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition cursor-pointer"
            @click.stop="$emit('pin', block)"
          >
            <v-remixicon
              size="13"
              name="Pin"
              :class="
                pinned.includes(block.id) ? 'text-primary fill-primary' : ''
              "
            />
          </button>
        </div>

        <!-- Block Icon Container -->
        <div class="mb-2 flex items-center justify-between">
          <div
            class="inline-flex items-center justify-center size-7 rounded-md bg-muted/60 text-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors shrink-0"
          >
            <img
              v-if="block.icon.startsWith('http')"
              :src="block.icon"
              alt=""
              width="16"
              height="16"
              class="h-4 w-4 object-contain dark:invert"
            />
            <v-remixicon
              v-else
              :path="getIconPath(block.icon)"
              :name="block.icon"
              size="16"
            />
          </div>
          <!-- Optional Tag Badge (hidden when actions hover) -->
          <div
            v-if="block.tag"
            class="group-hover:hidden inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold bg-primary/10 text-primary border border-primary/20"
          >
            {{ block.tag }}
          </div>
        </div>

        <!-- Block Label -->
        <p
          class="truncate capitalize text-xs font-medium text-foreground tracking-tight group-hover:text-primary transition-colors"
        >
          {{ block.name }}
        </p>
      </div>
    </div>
  </ui-expand>
</template>
<script setup>
import { getBlocks } from '@/utils/getSharedData';
import { useI18n } from 'vue-i18n';

defineProps({
  category: {
    type: Object,
    default: () => ({}),
  },
  blocks: {
    type: Array,
    default: () => [],
  },
  pinned: {
    type: Array,
    default: () => [],
  },
});
defineEmits(['pin']);

const { t, te } = useI18n();
const blocksDetail = getBlocks();

function getBlockTitle({ description, id, name }) {
  const blockPath = `workflow.blocks.${id}`;
  if (!te(blockPath)) return blocksDetail[id].name;

  const descPath = `${blockPath}.${description ? 'description' : 'name'}`;
  let blockDescription = te(descPath) ? t(descPath) : name;

  if (description) {
    blockDescription = `[${t(`${blockPath}.name`)}]\n${blockDescription}`;
  }

  return blockDescription;
}
function getIconPath(path) {
  if (path && path.startsWith('path')) {
    const { 1: iconPath } = path.split(':');
    return iconPath;
  }

  return '';
}
</script>
