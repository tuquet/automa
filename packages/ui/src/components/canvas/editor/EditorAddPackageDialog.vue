<script setup lang="ts">
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Switch,
  Textarea,
} from '@tuquet/vue-ui';
import { ref, watch } from 'vue';

const props = defineProps<{
  open: boolean;
  selectedCount: number;
}>();

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void;
  (
    e: 'confirm',
    payload: { name: string; description: string; asBlock: boolean },
  ): void;
}>();

const name = ref('');
const description = ref('');
const asBlock = ref(true);

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      name.value = '';
      description.value = '';
      asBlock.value = true;
    }
  },
);

function submit() {
  if (!name.value.trim()) return;
  emit('confirm', {
    name: name.value.trim(),
    description: description.value.trim(),
    asBlock: asBlock.value,
  });
  emit('update:open', false);
}
</script>

<template>
  <Dialog :open="props.open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-md">
      <DialogHeader class="text-left">
        <DialogTitle>Save {{ props.selectedCount }} Block(s) to Package</DialogTitle>
      </DialogHeader>

      <div class="space-y-4 py-2">
        <div class="space-y-1.5">
          <label class="text-xs font-medium text-foreground">Package Name</label>
          <Input
            v-model="name"
            class="h-9 text-sm"
            placeholder="e.g., Login & Solve Turnstile"
          />
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-medium text-foreground">Description</label>
          <Textarea
            v-model="description"
            class="min-h-20 text-sm"
            placeholder="Describe what this reusable package does..."
          />
        </div>

        <div class="flex items-center justify-between rounded-xl border border-border bg-muted/30 p-3">
          <div class="space-y-0.5">
            <div class="text-sm font-medium text-foreground">
              Insert as Atomic Block (asBlock)
            </div>
            <div class="text-xs text-muted-foreground">
              When enabled, drops as an encapsulated BlockPackage node with custom I/O handles.
            </div>
          </div>
          <Switch :checked="asBlock" @update:checked="asBlock = $event" />
        </div>

        <div class="flex items-center justify-end gap-2 pt-2">
          <Button
            variant="outline"
            class="h-9"
            @click="emit('update:open', false)"
          >
            Cancel
          </Button>
          <Button
            class="h-9"
            :disabled="!name.trim()"
            @click="submit"
          >
            Save Package
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
