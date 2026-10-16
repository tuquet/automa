<script setup lang="ts">
import type { WorkflowSettings } from '@automa/types';
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
  settings: WorkflowSettings;
}>();

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void;
  (e: 'save', settings: WorkflowSettings): void;
}>();

const form = reactive({
  debugMode: false,
  restartOnError: false,
  notification: true,
  blockDelay: 0,
  onError: 'error' as string,
});

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      form.debugMode = Boolean(props.settings?.debugMode);
      form.restartOnError = Boolean(props.settings?.restartOnError);
      form.notification = Boolean(props.settings?.notification ?? true);
      form.blockDelay = Number(props.settings?.blockDelay ?? 0);
      form.onError = String(props.settings?.onError ?? 'error');
    }
  },
);

function handleSave() {
  emit('save', {
    ...props.settings,
    debugMode: form.debugMode,
    restartOnError: form.restartOnError,
    notification: form.notification,
    blockDelay: form.blockDelay,
    onError: form.onError,
  });
  emit('update:open', false);
}
</script>

<template>
  <Dialog :open="props.open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader class="text-left">
        <DialogTitle>Workflow Runtime Settings</DialogTitle>
      </DialogHeader>

      <div class="space-y-4 py-2">
        <div class="space-y-1.5">
          <label class="text-xs font-medium text-foreground">
            Step Delay Between Blocks (ms)
          </label>
          <Input
            type="number"
            class="h-9 text-xs"
            :model-value="String(form.blockDelay)"
            @update:model-value="form.blockDelay = Number($event)"
          />
        </div>

        <div class="flex items-center justify-between rounded-xl border border-border p-3">
          <div>
            <div class="text-sm font-medium text-foreground">Stealth Debug Mode</div>
            <div class="text-xs text-muted-foreground">
              Emit verbose step diagnostics over CDP
            </div>
          </div>
          <Switch
            :checked="form.debugMode"
            @update:checked="form.debugMode = $event"
          />
        </div>

        <div class="flex items-center justify-between rounded-xl border border-border p-3">
          <div>
            <div class="text-sm font-medium text-foreground">Restart on Error</div>
            <div class="text-xs text-muted-foreground">
              Automatically restart workflow if an unhandled error occurs
            </div>
          </div>
          <Switch
            :checked="form.restartOnError"
            @update:checked="form.restartOnError = $event"
          />
        </div>

        <div class="flex items-center justify-end gap-2 pt-2">
          <Button variant="outline" class="h-9" @click="emit('update:open', false)">
            Cancel
          </Button>
          <Button class="h-9" @click="handleSave">Save Settings</Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
