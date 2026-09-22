<template>
  <Dialog :open="modelValue" @update:open="$emit('update:modelValue', $event)">
    <DialogContent
      class="max-w-4xl max-h-[88vh] flex flex-col p-5 gap-3 text-foreground"
    >
      <DialogHeader class="pb-1 border-b border-border">
        <div class="flex items-center justify-between">
          <DialogTitle class="text-sm font-semibold flex items-center gap-2">
            <Database class="size-4 text-primary" />
            <span>Storage</span>
          </DialogTitle>

          <!-- Top Tabs Navigation -->
          <div
            class="flex items-center gap-1 bg-muted p-0.5 rounded-lg border border-border"
          >
            <button
              type="button"
              class="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer"
              :class="
                activeTab === 'tables'
                  ? 'bg-background text-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              "
              data-testid="tab-storage-tables"
              @click="activeTab = 'tables'"
            >
              <Table class="size-3.5" />
              <span>Tables</span>
            </button>

            <button
              type="button"
              class="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer"
              :class="
                activeTab === 'variables'
                  ? 'bg-background text-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              "
              data-testid="tab-storage-variables"
              @click="activeTab = 'variables'"
            >
              <FileCode class="size-3.5" />
              <span>Variables</span>
            </button>

            <button
              type="button"
              class="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all cursor-pointer"
              :class="
                activeTab === 'secrets'
                  ? 'bg-background text-foreground shadow-2xs font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              "
              data-testid="tab-storage-secrets"
              @click="activeTab = 'secrets'"
            >
              <KeyRound class="size-3.5" />
              <span>Secrets</span>
            </button>
          </div>
        </div>
      </DialogHeader>

      <!-- Main Body Container -->
      <div class="flex-1 overflow-hidden min-h-[460px] text-xs">
        <!-- Tab 1: SQLite Storage Tables -->
        <div v-if="activeTab === 'tables'" class="h-full flex flex-col">
          <storage-tables-tab />
        </div>

        <!-- Tab 2: Workflow & Global Variables -->
        <div
          v-else-if="activeTab === 'variables'"
          class="h-full overflow-y-auto pr-1"
        >
          <workflow-global-data
            :workflow="workflow"
            @update="$emit('update:workflow', $event)"
          />
        </div>

        <!-- Tab 3: Vault Secrets & Encryption -->
        <div v-else-if="activeTab === 'secrets'" class="h-full flex flex-col">
          <storage-secrets-tab />
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>

<script setup>
import { ref, watch } from 'vue';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@automa/ui';
import { Database, FileCode, KeyRound, Table } from 'lucide-vue-next';
import WorkflowGlobalData from '@/components/newtab/workflow/WorkflowGlobalData.vue';
import StorageTablesTab from './StorageTablesTab.vue';
import StorageSecretsTab from './StorageSecretsTab.vue';

defineOptions({
  name: 'UnifiedStorageModal',
});

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  workflow: {
    type: Object,
    default: () => ({}),
  },
  initialTab: {
    type: String,
    default: 'tables',
  },
});

defineEmits(['update:modelValue', 'update:workflow']);

const activeTab = ref(props.initialTab || 'tables');

watch(
  () => props.initialTab,
  (newTab) => {
    if (newTab) activeTab.value = newTab;
  }
);
</script>
