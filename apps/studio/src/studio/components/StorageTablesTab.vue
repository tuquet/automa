<template>
  <div class="flex flex-col h-full text-xs text-foreground">
    <!-- Top Navigation & Actions -->
    <div
      class="flex items-center justify-between border-b border-border pb-3 shrink-0"
    >
      <div class="flex items-center gap-2">
        <!-- Select Active Table Dropdown -->
        <div
          v-if="tables.length > 0"
          class="flex items-center gap-1.5 min-w-[180px]"
        >
          <RemoteVirtualSelect
            id="select.storage.table"
            v-model="activeTableId"
            :custom-options="tableOptions"
            class="h-8 w-full"
            @change="onTableSelect"
          />
        </div>

        <Button
          variant="default"
          size="sm"
          data-testid="btn-add-table"
          @click="showCreateTableForm = !showCreateTableForm"
        >
          <Plus class="size-3.5 mr-1" />
          <span>New</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          data-testid="btn-refresh-tables"
          @click="loadTables"
        >
          <RefreshCw
            class="size-3.5 mr-1"
            :class="{ 'animate-spin': isLoading }"
          />
          <span>Refresh</span>
        </Button>
      </div>

      <div v-if="activeTable" class="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          data-testid="btn-delete-table"
          class="text-destructive hover:bg-destructive/10"
          title="Delete Table"
          @click="onDeleteTable(activeTable.id)"
        >
          <Trash2 class="size-3.5 mr-1" />
          <span class="hidden sm:inline">Delete</span>
        </Button>
      </div>
    </div>

    <!-- Create Table Form (Collapsible) -->
    <div
      v-if="showCreateTableForm"
      class="my-3 p-3 rounded-lg bg-muted border border-border space-y-3 shrink-0"
    >
      <h4
        class="font-semibold text-xs text-foreground flex items-center gap-1.5"
      >
        <Table class="size-3.5 text-primary" />
        <span>New Table</span>
      </h4>

      <div class="space-y-2">
        <div>
          <label class="block text-xs font-medium text-muted-foreground mb-1">
            Name
          </label>
          <Input
            v-model="newTable.name"
            type="text"
            data-testid="input-table-name"
            placeholder="Table name..."
            class="h-8 text-xs"
          />
        </div>

        <div>
          <label class="block text-xs font-medium text-muted-foreground mb-1">
            Columns
          </label>
          <Input
            v-model="newTable.columnsStr"
            type="text"
            data-testid="input-table-columns"
            placeholder="col1, col2, col3..."
            class="h-8 text-xs"
          />
        </div>
      </div>

      <div class="flex items-center justify-end gap-2 pt-1">
        <Button
          variant="outline"
          size="xs"
          data-testid="btn-cancel-create-table"
          @click="showCreateTableForm = false"
        >
          Cancel
        </Button>
        <Button
          variant="default"
          size="xs"
          data-testid="btn-submit-create-table"
          :disabled="!newTable.name || isSubmitting"
          @click="onCreateTable"
        >
          Create
        </Button>
      </div>
    </div>

    <!-- Table Content Grid Area -->
    <div
      class="flex-1 overflow-auto mt-3 border border-border rounded-lg min-h-[300px]"
    >
      <div v-if="isLoading" class="py-16 text-center text-muted-foreground">
        <Loader2 class="size-5 animate-spin inline-block mb-1 text-primary" />
        <p>Loading tables...</p>
      </div>

      <div
        v-else-if="tables.length === 0"
        class="py-16 text-center text-muted-foreground"
      >
        <Table class="size-8 inline-block mb-1 text-muted-foreground/50" />
        <p class="font-medium text-sm text-foreground">No tables</p>
      </div>

      <div v-else-if="activeTable" class="h-full w-full">
        <VirtualDataTable
          :data="tableRows"
          :columns="virtualColumns"
          :enable-virtualization="true"
          :enable-search="true"
          :page-size="20"
          search-placeholder="Search..."
          empty-text="No rows"
          empty-description=""
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import {
  Button,
  Input,
  RemoteVirtualSelect,
  VirtualDataTable,
} from '@automa/ui';
import { Loader2, Plus, RefreshCw, Table, Trash2 } from 'lucide-vue-next';
import { useToast } from 'vue-toastification';
import {
  fetchStorageTables,
  createStorageTable,
  deleteStorageTable,
  fetchStorageTableRows,
} from '../services/storage.service';

defineOptions({
  name: 'StorageTablesTab',
});

const toast = useToast();

const tables = ref([]);
const activeTableId = ref('');
const tableRows = ref([]);
const isLoading = ref(false);
const isSubmitting = ref(false);
const showCreateTableForm = ref(false);

const newTable = reactive({
  name: '',
  columnsStr: 'email, status',
});

const tableOptions = computed(() =>
  tables.value.map((t) => ({
    value: t.id,
    label: t.name,
    description: `${(t.columns || []).length} cols`,
  }))
);

const activeTable = computed(() => {
  return tables.value.find((t) => t.id === activeTableId.value);
});

const virtualColumns = computed(() => {
  if (!activeTable.value || !activeTable.value.columns) return [];
  const cols = [
    {
      id: 'index',
      header: '#',
      size: 45,
      cell: ({ row }) => row.index + 1,
      enableSorting: false,
    },
  ];
  for (const col of activeTable.value.columns) {
    const colKey = typeof col === 'object' ? col.name : col;
    cols.push({
      id: colKey,
      header: colKey,
      accessorFn: (row) => row[colKey] ?? '-',
      cell: ({ row }) => {
        const val = row.original[colKey];
        if (val === null || val === undefined) return '-';
        if (typeof val === 'object') return JSON.stringify(val);
        return String(val);
      },
    });
  }
  return cols;
});

async function loadRows(tableId) {
  try {
    tableRows.value = await fetchStorageTableRows(tableId);
  } catch (_) {
    tableRows.value = [];
  }
}

async function loadTables() {
  isLoading.value = true;
  try {
    tables.value = await fetchStorageTables();
    if (tables.value.length > 0 && !activeTableId.value) {
      activeTableId.value = tables.value[0].id;
    }
    if (activeTableId.value) {
      await loadRows(activeTableId.value);
    }
  } catch (err) {
    toast.error(`Failed to load tables: ${err.message}`);
  } finally {
    isLoading.value = false;
  }
}

async function onTableSelect() {
  if (activeTableId.value) {
    await loadRows(activeTableId.value);
  }
}

async function onCreateTable() {
  if (!newTable.name) return;
  isSubmitting.value = true;
  try {
    const cols = newTable.columnsStr
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);
    const created = await createStorageTable({
      name: newTable.name,
      columns: cols,
    });
    toast.success('Table created successfully!');
    newTable.name = '';
    showCreateTableForm.value = false;
    await loadTables();
    activeTableId.value = created.id;
    await loadRows(created.id);
  } catch (err) {
    toast.error(`Create table failed: ${err.message}`);
  } finally {
    isSubmitting.value = false;
  }
}

async function onDeleteTable(id) {
  try {
    await deleteStorageTable(id);
    toast.success('Table deleted.');
    activeTableId.value = '';
    await loadTables();
  } catch (err) {
    toast.error(`Delete failed: ${err.message}`);
  }
}

onMounted(() => {
  loadTables();
});
</script>
