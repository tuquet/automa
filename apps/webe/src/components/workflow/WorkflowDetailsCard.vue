<template>
  <div class="flex flex-col h-full overflow-hidden">
    <div
      data-testid="workflow-details-card"
      class="mb-2 mt-2 flex items-center px-3 text-xs"
    >
      <ui-popover class="mr-2 h-7 shrink-0">
        <template #trigger>
          <span
            data-testid="workflow-icon-btn"
            :title="t('workflow.sidebar.workflowIcon')"
            class="inline-flex items-center justify-center h-7 w-7 rounded-md bg-muted text-foreground cursor-pointer hover:bg-accent transition"
          >
            <ui-img
              v-if="workflow.icon && workflow.icon.startsWith('http')"
              :src="workflow.icon"
              class="h-5 w-5 rounded object-cover"
            />
            <v-remixicon
              v-else
              :name="workflow.icon || 'riGlobalLine'"
              size="18"
            />
          </span>
        </template>
        <div class="w-64 text-xs">
          <p class="mb-2 font-medium text-foreground">
            {{ t('workflow.sidebar.workflowIcon') }}
          </p>
          <div class="mb-3 grid grid-cols-5 gap-1.5">
            <button
              v-for="icon in icons"
              :key="icon"
              v-close-popover
              type="button"
              :title="icon"
              :class="{
                'ring-2 ring-primary bg-primary/10 text-primary font-semibold':
                  (workflow.icon || 'riGlobalLine') === icon,
                'hover:bg-accent text-foreground':
                  (workflow.icon || 'riGlobalLine') !== icon,
              }"
              class="inline-flex items-center justify-center h-8 w-8 cursor-pointer rounded-md text-center transition"
              @click="$emit('update', { icon })"
            >
              <v-remixicon :name="icon" size="18" />
            </button>
          </div>
          <ui-input
            :model-value="
              workflow.icon && workflow.icon.startsWith('http')
                ? workflow.icon
                : ''
            "
            type="url"
            placeholder="http://example.com/img.png"
            label="Icon URL"
            @change="updateWorkflowIcon"
          />
        </div>
      </ui-popover>
      <div class="flex-1 overflow-hidden min-w-0">
        <p
          data-testid="workflow-name-display"
          class="text-overflow text-sm font-semibold leading-tight text-foreground"
        >
          {{ workflow.name }}
        </p>
        <p
          v-if="workflow.description"
          data-testid="workflow-description-display"
          class="cursor-pointer text-xs text-muted-foreground leading-tight mt-0.5"
          :class="descriptionCollapsed ? 'line-clamp' : 'whitespace-pre-wrap'"
          @click="descriptionCollapsed = !descriptionCollapsed"
        >
          {{ workflow.description }}
        </p>
      </div>
    </div>
    <ui-input
      id="search-input"
      v-model="query"
      data-testid="workflow-search-input"
      :placeholder="`${t('common.search')}...`"
      prepend-icon="riSearch2Line"
      class="mt-1 mb-2 w-full px-3 text-xs"
    />
    <div
      data-testid="workflow-blocks-scroll-area"
      class="scroll relative flex-1 overflow-auto bg-scroll px-3 text-xs"
    >
      <workflow-block-list
        v-if="pinnedBlocksList.length > 0"
        :model-value="true"
        :blocks="pinnedBlocksList"
        :category="pinnedCategory"
        :pinned="pinnedBlocks"
        @pin="pinBlock"
      />
      <workflow-block-list
        v-for="(items, catId) in blocks"
        :key="catId"
        :model-value="true"
        :blocks="items"
        :category="categories[catId] || { name: catId, color: 'bg-accent' }"
        :pinned="pinnedBlocks"
        @pin="pinBlock"
      />
    </div>
  </div>
</template>
<script setup>
import { computed, ref, onMounted, watch, toRaw } from 'vue';
import { useI18n } from 'vue-i18n';
import browser from 'webextension-polyfill';
import { useShortcut } from '@/composable/shortcut';
import { categories } from '@/utils/shared';
import { getBlocks } from '@/utils/getSharedData';
import WorkflowBlockList from './WorkflowBlockList.vue';

defineOptions({ name: 'WorkflowDetailsCard' });

defineProps({
  workflow: {
    type: Object,
    default: () => ({}),
  },
  dataChanged: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits(['update']);

const { t, te } = useI18n();
useShortcut('action:search', () => {
  const searchInput = document.querySelector('#search-input input');

  searchInput?.focus();
});

const pinnedCategory = {
  name: 'Pinned blocks',
  color: 'bg-accent',
};
const icons = [
  'riGlobalLine',
  'mdiPackageVariantClosed',
  'riFileTextLine',
  'riEqualizerLine',
  'riTimerLine',
  'riCalendarLine',
  'riFlashlightLine',
  'riLightbulbFlashLine',
  'riDatabase2Line',
  'riWindowLine',
  'riCursorLine',
  'riDownloadLine',
  'riCommandLine',
  'riCodeSSlashLine',
  'riShieldKeyholeLine',
];

const copyBlocks = getBlocks();
delete copyBlocks['block-package'];

const blocksArr = Object.entries(copyBlocks).map(([key, block]) => {
  const localeKey = `workflow.blocks.${key}.name`;

  return {
    ...block,
    id: key,
    name: te(localeKey) ? t(localeKey) : block.name,
  };
});

const descriptionCollapsed = ref(true);

const query = ref('');
const pinnedBlocks = ref([]);

const blocks = computed(() =>
  blocksArr.reduce((arr, block) => {
    if (
      block.name.toLocaleLowerCase().includes(query.value.toLocaleLowerCase())
    ) {
      (arr[block.category] = arr[block.category] || []).push(block);
    }

    return arr;
  }, {})
);
const pinnedBlocksList = computed(() =>
  pinnedBlocks.value
    .map((id) => {
      const namePath = `workflow.blocks.${id}.name`;

      return {
        ...copyBlocks[id],
        id,
        name: te(namePath) ? t(namePath) : copyBlocks[id].name,
      };
    })
    .filter(({ name }) =>
      name.toLocaleLowerCase().includes(query.value.toLocaleLowerCase())
    )
);

function updateWorkflowIcon(value) {
  if (!value.startsWith('http')) return;

  const iconUrl = value.slice(0, 1024);

  emit('update', { icon: iconUrl });
}
function pinBlock({ id }) {
  const index = pinnedBlocks.value.indexOf(id);

  if (index !== -1) pinnedBlocks.value.splice(index, 1);
  else pinnedBlocks.value.push(id);
}

watch(
  pinnedBlocks,
  () => {
    browser.storage.local.set({
      pinnedBlocks: toRaw(pinnedBlocks.value),
    });
  },
  { deep: true }
);

onMounted(() => {
  browser.storage.local.get('pinnedBlocks').then((item) => {
    pinnedBlocks.value = item.pinnedBlocks || [];
  });
});
</script>
