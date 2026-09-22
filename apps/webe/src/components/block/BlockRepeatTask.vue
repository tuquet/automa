<template>
  <block-base
    :id="componentId"
    :data="data"
    :block-id="id"
    :block-data="block"
    class="repeat-task w-64"
    @delete="$emit('delete', id)"
    @update="$emit('update', $event)"
    @settings="$emit('settings', $event)"
  >
    <Handle :id="`${id}-input-1`" type="target" :position="Position.Left" />
    <div class="mb-2 flex items-center">
      <div
        :class="
          data.disableBlock
            ? 'bg-muted text-muted-foreground'
            : block.category.color
        "
        class="mr-4 inline-block rounded-lg p-2 text-sm dark:text-black"
      >
        <v-remixicon name="riRepeat2Line" size="20" class="mr-1 inline-block" />
        <span>{{ t('workflow.blocks.repeat-task.name') }}</span>
      </div>
    </div>
    <div
      class="relative flex items-center rounded-md border border-input bg-background text-xs shadow-2xs"
    >
      <input
        :value="data.repeatFor"
        placeholder="0"
        class="h-8 w-full bg-transparent px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors"
        style="padding-right: 57px; width: 95%"
        @keydown.stop
        @input="handleInput"
      />
      <span class="absolute right-3 text-xs text-muted-foreground">
        {{ t('workflow.blocks.repeat-task.times') }}
      </span>
    </div>
    <p class="text-right text-xs text-muted-foreground mt-1">
      {{ t('workflow.blocks.repeat-task.repeatFrom') }}
    </p>
    <Handle :id="`${id}-output-1`" type="source" :position="Position.Right" />
    <Handle
      :id="`${id}-output-2`"
      type="source"
      :position="Position.Right"
      style="top: auto; bottom: 12px"
    />
  </block-base>
</template>
<script setup>
import { useI18n } from 'vue-i18n';
import { Handle, Position } from '@vue-flow/core';
import { useComponentId } from '@/composable/componentId';
import { useEditorBlock } from '@/composable/editorBlock';
import BlockBase from './BlockBase.vue';

const { t } = useI18n();
const props = defineProps({
  id: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['delete', 'update', 'settings']);

const block = useEditorBlock(props.label);
const componentId = useComponentId('block-delay');

function handleInput({ target }) {
  emit('update', { repeatFor: target.value });
}
</script>
<style>
.drawflow .repeat-task .outputs {
  top: 74px;
  transform: none;
}
.drawflow .repeat-task .output {
  margin-bottom: 22px;
}
</style>
