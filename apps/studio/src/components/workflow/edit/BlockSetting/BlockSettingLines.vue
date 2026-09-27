<template>
  <div class="block-lines max-w-xl">
    <ui-select
      v-model="state.activeEdge"
      :placeholder="t('workflow.blocks.base.settings.line.select')"
      class="w-full"
    >
      <option v-for="edge in state.edges" :key="edge.id" :value="edge.id">
        {{ edge.name }}
      </option>
    </ui-select>
    <div v-if="activeEdge" class="mt-4">
      <ui-input
        :model-value="activeEdge.label"
        :label="t('workflow.blocks.base.settings.line.label')"
        placeholder="A label"
        class="w-full"
        @change="updateActiveEdge('label', $event)"
      />
      <div class="mt-4 flex items-center">
        <label class="mr-4 block flex items-center">
          <ui-switch
            :model-value="activeEdge.animated"
            @change="updateActiveEdge('animated', $event)"
          />
          <span class="ml-2">
            {{ t('workflow.blocks.base.settings.line.animated') }}
          </span>
        </label>
        <div class="w-32" />
        <label class="flex items-center">
          <input
            :value="activeEdge.style?.stroke ?? null"
            type="color"
            name="color"
            data-testid="input-edge-stroke-color"
            class="h-8 w-8 cursor-pointer rounded-md border border-input bg-background p-0.5 shadow-2xs focus:outline-none focus:ring-1 focus:ring-ring"
            @input="updateActiveEdge('style', { stroke: $event.target.value })"
          />
          <span class="ml-2">
            {{ t('workflow.blocks.base.settings.line.lineColor') }}
          </span>
        </label>
      </div>
    </div>
  </div>
</template>
<script setup>
import { inject, onMounted, reactive, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { debounce } from '@/utils/helper';

const props = defineProps({
  blockId: {
    type: String,
    default: '',
  },
});

const { t } = useI18n();

const editor = inject('workflow-editor', null);
const state = reactive({
  retrieved: false,
  edges: {},
  activeEdge: '',
});

const activeEdge = computed(() => state.edges[state.activeEdge]);

const updateActiveEdge = debounce((name, value) => {
  const editorInst = editor?.value || editor;
  if (!editorInst) return;

  const edgeGetter = editorInst.getEdge?.value || editorInst.getEdge;
  const edge =
    typeof edgeGetter === 'function'
      ? edgeGetter(state.activeEdge)
      : editorInst.findEdge?.(state.activeEdge);
  if (!edge) return;

  edge[name] = value;
  if (state.edges[state.activeEdge]) {
    state.edges[state.activeEdge][name] = value;
  }
}, 250);

onMounted(() => {
  const editorInst = editor?.value || editor;
  if (!editorInst) return;

  const rawEdges =
    editorInst.getEdges?.value ||
    (typeof editorInst.getEdges === 'function'
      ? editorInst.getEdges()
      : editorInst.edges?.value) ||
    [];
  state.edges = rawEdges.reduce(
    (acc, { id, source, targetNode, label, animated, labelStyle, style }) => {
      if (source !== props.blockId) return acc;

      const targetLabel = targetNode?.label || 'unknown';
      let name = t('workflow.blocks.base.settings.line.to', {
        name: t(`workflow.blocks.${targetLabel}.name`, targetLabel),
      });
      if (targetNode?.data?.description) {
        name += ` (${targetNode.data.description.slice(0, 32)})`;
      }

      acc[id] = {
        name,
        id,
        label: `${label || ''}`,
        animated: animated ?? false,
        labelStyle: labelStyle || '',
      };

      if (style) acc[id].style = style;

      return acc;
    },
    {}
  );
});
</script>
