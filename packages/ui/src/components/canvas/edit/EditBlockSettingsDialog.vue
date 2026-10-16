<script setup lang="ts">
import type { WorkflowNode } from '@automa/types';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Switch,
} from '@tuquet/vue-ui';
import { reactive, watch } from 'vue';

const props = defineProps<{
  open: boolean;
  node: WorkflowNode | null;
}>();

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void;
  (e: 'save', payload: { nodeId: string; data: Record<string, unknown> }): void;
}>();

const form = reactive({
  disableBlock: false,
  toDo: 'error' as 'error' | 'continue' | 'fallback',
  retry: false,
  retryTimes: 1,
  retryInterval: 1000,
});

watch(
  () => props.node,
  (node) => {
    if (!node) return;
    form.disableBlock = Boolean(node.data?.disableBlock);
    const onError = (node.data?.onError as Record<string, unknown>) || {};
    form.toDo =
      (onError.toDo as 'error' | 'continue' | 'fallback') || 'error';
    form.retry = Boolean(onError.retry);
    form.retryTimes = Number(onError.retryTimes ?? 1);
    form.retryInterval = Number(onError.retryInterval ?? 1000);
  },
  { immediate: true },
);

function saveSettings() {
  if (!props.node) return;
  emit('save', {
    nodeId: props.node.id,
    data: {
      ...props.node.data,
      disableBlock: form.disableBlock,
      onError: {
        toDo: form.toDo,
        retry: form.retry,
        retryTimes: form.retryTimes,
        retryInterval: form.retryInterval,
      },
    },
  });
  emit('update:open', false);
}
</script>

<template>
  <Dialog :open="props.open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader class="text-left">
        <DialogTitle>Block Execution & Error Policy</DialogTitle>
      </DialogHeader>

      <div class="space-y-4 py-2">
        <div class="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-3">
          <div>
            <div class="text-sm font-medium text-foreground">Disable Block</div>
            <div class="text-xs text-muted-foreground">
              Skip this block during workflow execution
            </div>
          </div>
          <Switch
            :checked="form.disableBlock"
            @update:checked="form.disableBlock = $event"
          />
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-medium text-foreground">
            On Error Policy (onError.toDo)
          </label>
          <div class="grid grid-cols-3 gap-2">
            <Button
              type="button"
              :variant="form.toDo === 'error' ? 'default' : 'outline'"
              class="h-8 text-xs"
              @click="form.toDo = 'error'"
            >
              Stop (Error)
            </Button>
            <Button
              type="button"
              :variant="form.toDo === 'continue' ? 'default' : 'outline'"
              class="h-8 text-xs"
              @click="form.toDo = 'continue'"
            >
              Continue
            </Button>
            <Button
              type="button"
              :variant="form.toDo === 'fallback' ? 'default' : 'outline'"
              class="h-8 text-xs"
              @click="form.toDo = 'fallback'"
            >
              Fallback Edge
            </Button>
          </div>
        </div>

        <div class="space-y-3 rounded-xl border border-border p-3">
          <div class="flex items-center justify-between">
            <span class="text-xs font-medium text-foreground">Retry on failure</span>
            <Switch
              :checked="form.retry"
              @update:checked="form.retry = $event"
            />
          </div>

          <div v-if="form.retry" class="grid grid-cols-2 gap-2">
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">Retry Count</label>
              <Input
                type="number"
                class="h-8 text-xs"
                :model-value="String(form.retryTimes)"
                @update:model-value="form.retryTimes = Number($event)"
              />
            </div>
            <div class="space-y-1">
              <label class="text-xs text-muted-foreground">Interval (ms)</label>
              <Input
                type="number"
                class="h-8 text-xs"
                :model-value="String(form.retryInterval)"
                @update:model-value="form.retryInterval = Number($event)"
              />
            </div>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2">
          <Button
            variant="outline"
            class="h-9"
            @click="emit('update:open', false)"
          >
            Cancel
          </Button>
          <Button class="h-9" @click="saveSettings">Save Policy</Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
