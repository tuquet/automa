<script setup lang="ts">
import type { WorkflowTableColumn } from '@automa/types';
import { Plus, Trash2 } from '@lucide/vue';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
} from '@tuquet/vue-ui';
import { ref, watch } from 'vue';
import { generateCanvasId } from '../../../utils/canvas-helpers.js';

const props = defineProps<{
  open: boolean;
  columns: WorkflowTableColumn[];
}>();

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void;
  (e: 'save', columns: WorkflowTableColumn[]): void;
}>();

const localColumns = ref<WorkflowTableColumn[]>([]);
const newColName = ref('');
const newColType = ref('string');

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      localColumns.value = structuredClone(props.columns || []);
      newColName.value = '';
    }
  },
);

function addColumn() {
  const name = newColName.value.trim();
  if (!name) return;
  localColumns.value.push({
    id: generateCanvasId('col'),
    name,
    type: newColType.value,
  });
  newColName.value = '';
}

function removeColumn(idx: number) {
  localColumns.value.splice(idx, 1);
}

function saveTable() {
  emit('save', localColumns.value);
  emit('update:open', false);
}
</script>

<template>
  <Dialog :open="props.open" @update:open="emit('update:open', $event)">
    <DialogContent class="sm:max-w-lg">
      <DialogHeader class="text-left">
        <DialogTitle>Workflow Data Table Columns</DialogTitle>
      </DialogHeader>

      <div class="space-y-4 py-2">
        <div class="flex items-center gap-2">
          <Input
            v-model="newColName"
            class="h-9 flex-1 text-xs"
            placeholder="Column name (e.g., productTitle, price)"
            @keydown.enter.prevent="addColumn"
          />
          <Button class="h-9 gap-1.5 text-xs" @click="addColumn">
            <Plus class="size-3.5" />
            Add Column
          </Button>
        </div>

        <div class="max-h-64 space-y-1.5 overflow-y-auto">
          <div
            v-for="(col, idx) in localColumns"
            :key="col.id"
            class="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2"
          >
            <div class="min-w-0 flex-1">
              <Input
                v-model="col.name"
                class="h-8 text-xs font-medium"
              />
            </div>
            <span class="font-mono text-xs text-muted-foreground">
              {{ col.type }}
            </span>
            <Button
              variant="ghost"
              size="sm"
              class="h-8 w-8 p-0 text-destructive"
              @click="removeColumn(idx)"
            >
              <Trash2 class="size-3.5" />
            </Button>
          </div>

          <div
            v-if="localColumns.length === 0"
            class="rounded-xl border border-dashed border-border p-6 text-center text-xs text-muted-foreground"
          >
            No table columns defined yet.
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 pt-2">
          <Button variant="outline" class="h-9" @click="emit('update:open', false)">
            Cancel
          </Button>
          <Button class="h-9" @click="saveTable">Save Columns</Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
