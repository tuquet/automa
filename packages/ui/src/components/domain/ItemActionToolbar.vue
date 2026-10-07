<script setup lang="ts">
import AutomaButton from './AutomaButton.vue'

defineOptions({
  name: 'ItemActionToolbar',
})

withDefaults(
  defineProps<{
    item?: unknown
    itemId?: string
    runButtonId?: string
    previewButtonId?: string
    sourceButtonId?: string
    deleteButtonId?: string
    disabled?: boolean
    isRunning?: boolean
    showPreview?: boolean
    showSource?: boolean
    showDelete?: boolean
  }>(),
  {
    runButtonId: 'btn.campaign.run',
    previewButtonId: 'btn.campaign.preview',
    sourceButtonId: 'btn.campaign.source',
    deleteButtonId: 'btn.campaign.delete',
    disabled: false,
    isRunning: false,
    showPreview: true,
    showSource: true,
    showDelete: true,
  },
)

const emit = defineEmits<{
  (e: 'run', item: unknown): void
  (e: 'preview', item: unknown): void
  (e: 'source', item: unknown): void
  (e: 'delete', item: unknown): void
}>()
</script>

<template>
  <div
    class="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity"
    data-testid="item-action-toolbar"
  >
    <!-- Run / Execute Button -->
    <AutomaButton
      :id="runButtonId"
      size="sm"
      variant="ghost"
      icon-only
      :disabled="disabled"
      :loading="isRunning"
      :context-payload="item"
      @click="emit('run', item)"
    />

    <!-- Preview / Visual Form Button -->
    <AutomaButton
      v-if="showPreview"
      :id="previewButtonId"
      size="sm"
      variant="ghost"
      icon-only
      :disabled="disabled"
      :context-payload="item"
      @click="emit('preview', item)"
    />

    <!-- Source / Raw JSON Button -->
    <AutomaButton
      v-if="showSource"
      :id="sourceButtonId"
      size="sm"
      variant="ghost"
      icon-only
      :disabled="disabled"
      :context-payload="item"
      @click="emit('source', item)"
    />

    <!-- Delete Button with Auto Confirmation -->
    <AutomaButton
      v-if="showDelete"
      :id="deleteButtonId"
      size="sm"
      variant="ghost"
      icon-only
      :disabled="disabled"
      :context-payload="item"
      @confirmed="emit('delete', item)"
    />
  </div>
</template>
