<script setup lang="ts">
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Textarea,
} from '@tuquet/vue-ui';
import { ref, watch } from 'vue';

const props = defineProps<{
  open: boolean;
  variables: Record<string, unknown>;
}>();

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void;
  (e: 'save', variables: Record<string, unknown>): void;
}>();

const rawJson = ref('{}');
const errorMsg = ref('');

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      rawJson.value = JSON.stringify(props.variables || {}, null, 2);
      errorMsg.value = '';
    }
  },
);

function handleSave() {
  try {
    const parsed = JSON.parse(rawJson.value) as Record<string, unknown>;
    errorMsg.value = '';
    emit('save', parsed);
    emit('update:open', false);
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : 'Invalid JSON';
  }
}
</script>

<template>
  <Dialog :open="props.open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader class="text-left">
        <DialogTitle>Workflow Variables & Global Data (JSON)</DialogTitle>
      </DialogHeader>

      <div class="space-y-3 py-2">
        <p class="text-xs text-muted-foreground">
          Define default workflow variables accessible via
          <code class="font-mono text-foreground">&#123;&#123;variables.key&#125;&#125;</code>.
        </p>

        <Textarea
          v-model="rawJson"
          class="min-h-64 font-mono text-xs"
        />

        <p v-if="errorMsg" class="text-xs text-destructive">
          {{ errorMsg }}
        </p>

        <div class="flex items-center justify-end gap-2 pt-2">
          <Button variant="outline" class="h-9" @click="emit('update:open', false)">
            Cancel
          </Button>
          <Button class="h-9" @click="handleSave">Save Variables</Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
