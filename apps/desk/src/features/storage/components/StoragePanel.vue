<script setup lang="ts">
import {
  AutomaButton,
  Button,
  type ColumnDef,
  RemoteVirtualSelect,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  useStorageStore,
  VirtualDataTable,
} from '@automa/ui'
import { Check, Copy, Database, KeyRound, Table as TableIcon, Trash2 } from 'lucide-vue-next'
import { computed, h, onMounted, ref, watch } from 'vue'
import {
  deleteStorageCredential,
  deleteStorageVariable,
  getStorageCredentials,
  getStorageTableRows,
  getStorageTables,
  getStorageVariables,
} from '../../../infrastructure/api/client'

defineOptions({
  name: 'StoragePanel',
})

const props = withDefaults(
  defineProps<{
    showHeader?: boolean
    pageSize?: number
  }>(),
  {
    showHeader: true,
    pageSize: 15,
  },
)

const activeTab = ref('tables')
const storageStore = useStorageStore()

const selectedTableId = ref<string>('')
const tableRows = ref<Record<string, unknown>[]>([])
const isLoadingRows = ref(false)
const copiedKey = ref<string | null>(null)

async function copyToClipboard(text: string, keyId: string) {
  try {
    await navigator.clipboard.writeText(text)
    copiedKey.value = keyId
    setTimeout(() => {
      if (copiedKey.value === keyId) copiedKey.value = null
    }, 2000)
  } catch (err) {
    console.error('Failed to copy to clipboard:', err)
  }
}

async function loadData() {
  storageStore.isLoading = true
  try {
    const [tRes, vRes, cRes] = await Promise.all([
      getStorageTables(),
      getStorageVariables(),
      getStorageCredentials(),
    ])
    if (tRes.data) {
      storageStore.setTables(tRes.data)
      if (!selectedTableId.value && tRes.data.length > 0 && tRes.data[0]?.id) {
        selectedTableId.value = tRes.data[0].id
      }
    }
    if (vRes.data) storageStore.setVariables(vRes.data)
    if (cRes.data) storageStore.setCredentials(cRes.data)
  } catch (err) {
    console.error('Storage read error:', err)
  } finally {
    storageStore.isLoading = false
  }
}

const activeTable = computed(
  () =>
    storageStore.tables.find((t) => t.id === selectedTableId.value) ||
    storageStore.tables[0] ||
    null,
)

watch(
  activeTable,
  async (tbl) => {
    if (tbl?.id) {
      isLoadingRows.value = true
      try {
        const res = await getStorageTableRows({ path: { id: tbl.id } })
        tableRows.value = Array.isArray(res.data) ? res.data : []
      } catch {
        tableRows.value = []
      } finally {
        isLoadingRows.value = false
      }
    } else {
      tableRows.value = []
    }
  },
  { immediate: true },
)

async function handleDeleteVariable(id: string) {
  try {
    await deleteStorageVariable({ path: { id } })
    storageStore.removeVariable(id)
  } catch (err) {
    console.error('Delete variable error:', err)
    await loadData()
  }
}

async function handleDeleteCredential(id: string) {
  try {
    await deleteStorageCredential({ path: { id } })
    storageStore.removeCredential(id)
  } catch (err) {
    console.error('Delete credential error:', err)
    await loadData()
  }
}

type VariableItem = (typeof storageStore.variables)[number]
type CredentialItem = (typeof storageStore.credentials)[number]

const virtualTableColumns = computed<ColumnDef<Record<string, unknown>>[]>(() => {
  const tableCols = activeTable.value?.columns
  const colsCount = tableCols && typeof tableCols === 'object' ? Object.keys(tableCols).length : 0
  if (!tableRows.value.length && !colsCount) {
    return [
      {
        id: 'empty',
        header: 'Columns',
        cell: () => h('span', { class: 'text-muted-foreground text-xs' }, 'No data columns'),
      },
    ]
  }

  const cols = new Set<string>()
  if (Array.isArray(tableCols)) {
    for (const c of tableCols) {
      if (typeof c === 'string') cols.add(c)
      else if (c && typeof c === 'object' && 'name' in c)
        cols.add(String((c as { name: string }).name))
    }
  } else if (tableCols && typeof tableCols === 'object') {
    for (const k of Object.keys(tableCols)) {
      cols.add(k)
    }
  }

  for (const r of tableRows.value) {
    for (const k of Object.keys(r)) {
      cols.add(k)
    }
  }

  return Array.from(cols).map((colName) => ({
    id: colName,
    header: colName,
    accessorFn: (row: Record<string, unknown>) => row[colName],
    cell: ({ row }) => {
      const val = row.original[colName]
      const formatted = typeof val === 'object' ? JSON.stringify(val) : String(val ?? '')
      return h(
        'span',
        { class: 'font-mono text-xs text-foreground truncate max-w-[200px] block' },
        formatted,
      )
    },
  }))
})

const variableColumns = computed<ColumnDef<VariableItem, unknown>[]>(() => [
  {
    id: 'name',
    header: 'Variable Name',
    accessorFn: (row) => row.name,
    cell: ({ row }) =>
      h('div', { class: 'flex items-center gap-2 font-medium text-xs text-foreground' }, [
        h(KeyRound, { class: 'size-3.5 text-primary shrink-0' }),
        h('span', row.original.name || ''),
      ]),
  },
  {
    id: 'value',
    header: 'Value',
    accessorFn: (row) => row.value,
    cell: ({ row }) =>
      h(
        'span',
        { class: 'font-mono text-xs text-muted-foreground truncate max-w-[280px] block' },
        typeof row.original.value === 'object'
          ? JSON.stringify(row.original.value)
          : String(row.original.value ?? ''),
      ),
  },
  {
    id: 'actions',
    header: 'Actions',
    size: 90,
    accessorFn: () => null,
    cell: ({ row }) =>
      h('div', { class: 'flex items-center gap-1 justify-end' }, [
        h(
          Button,
          {
            variant: 'ghost',
            size: 'icon-sm',
            title: 'Copy variable token',
            onClick: () =>
              copyToClipboard(`{{variables.${row.original.name}}}`, row.original.id || ''),
          },
          () =>
            copiedKey.value === row.original.id
              ? h(Check, { class: 'size-3.5 text-success' })
              : h(Copy, { class: 'size-3.5 text-muted-foreground' }),
        ),
        h(
          Button,
          {
            variant: 'ghost',
            size: 'icon-sm',
            class: 'text-muted-foreground hover:text-destructive',
            title: 'Delete variable',
            onClick: () => row.original.id && handleDeleteVariable(row.original.id),
          },
          () => h(Trash2, { class: 'size-3.5' }),
        ),
      ]),
  },
])

const credentialColumns = computed<ColumnDef<CredentialItem, unknown>[]>(() => [
  {
    id: 'name',
    header: 'Credential Name',
    accessorFn: (row) => row.name,
    cell: ({ row }) =>
      h('div', { class: 'flex items-center gap-2 font-medium text-xs text-foreground' }, [
        h(Database, { class: 'size-3.5 text-amber-500 shrink-0' }),
        h('span', row.original.name || ''),
      ]),
  },
  {
    id: 'actions',
    header: 'Actions',
    size: 90,
    accessorFn: () => null,
    cell: ({ row }) =>
      h('div', { class: 'flex items-center gap-1 justify-end' }, [
        h(
          Button,
          {
            variant: 'ghost',
            size: 'icon-sm',
            title: 'Copy secret token',
            onClick: () =>
              copyToClipboard(`{{secrets.${row.original.name}}}`, row.original.id || ''),
          },
          () =>
            copiedKey.value === row.original.id
              ? h(Check, { class: 'size-3.5 text-success' })
              : h(Copy, { class: 'size-3.5 text-muted-foreground' }),
        ),
        h(
          Button,
          {
            variant: 'ghost',
            size: 'icon-sm',
            class: 'text-muted-foreground hover:text-destructive',
            title: 'Delete credential',
            onClick: () => row.original.id && handleDeleteCredential(row.original.id),
          },
          () => h(Trash2, { class: 'size-3.5' }),
        ),
      ]),
  },
])

onMounted(() => {
  loadData()
})

defineExpose({
  loadData,
})
</script>

<template>
  <div class="h-full w-full flex flex-col overflow-hidden">
    <!-- Header Bar -->
    <div v-if="showHeader" class="flex items-center justify-between pb-3 border-b border-border shrink-0">
      <div class="flex items-center gap-2.5">
        <div class="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
          <Database class="size-4.5" :stroke-width="2" />
        </div>
        <div>
          <h2 class="font-semibold text-xs tracking-tight text-foreground">Storage</h2>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <AutomaButton
          id="btn.storage.refresh"
          size="sm"
          variant="default"
          :loading="storageStore.isLoading"
          @click="loadData"
        />
      </div>
    </div>

    <!-- Storage Tabs -->
    <Tabs v-model="activeTab" class="flex-1 flex flex-col min-h-0 mt-2 overflow-hidden">
      <div class="flex items-center justify-between pb-2 shrink-0">
        <TabsList class="grid grid-cols-3 h-9 w-[360px]">
          <TabsTrigger value="tables" data-testid="tab-storage-tables" class="text-xs">
            <TableIcon class="size-3.5 shrink-0" />
            <span>Tables ({{ storageStore.tables.length }})</span>
          </TabsTrigger>
          <TabsTrigger value="variables" data-testid="tab-storage-variables" class="text-xs">
            <KeyRound class="size-3.5 shrink-0" />
            <span>Variables ({{ storageStore.variables.length }})</span>
          </TabsTrigger>
          <TabsTrigger value="credentials" data-testid="tab-storage-credentials" class="text-xs">
            <Database class="size-3.5 shrink-0" />
            <span>Secrets ({{ storageStore.credentials.length }})</span>
          </TabsTrigger>
        </TabsList>

        <!-- Table Selector when in Tables Tab -->
        <div v-if="activeTab === 'tables' && storageStore.tables.length > 0" class="flex items-center min-w-[160px]">
          <RemoteVirtualSelect
            id="select.storage.table"
            v-model="selectedTableId"
            class="h-7 w-full"
          />
        </div>
      </div>

      <!-- Tab 1: Tables -->
      <TabsContent value="tables" class="flex-1 min-h-0 overflow-hidden m-0">
        <VirtualDataTable
          :data="tableRows"
          :columns="virtualTableColumns"
          :enable-virtualization="true"
          :enable-search="true"
          :page-size="pageSize"
          empty-text="No records"
        />
      </TabsContent>

      <!-- Tab 2: Variables -->
      <TabsContent value="variables" class="flex-1 min-h-0 overflow-hidden m-0">
        <VirtualDataTable
          :data="storageStore.variables"
          :columns="variableColumns"
          :enable-virtualization="true"
          :enable-search="true"
          :page-size="pageSize"
          empty-text="No variables"
        />
      </TabsContent>

      <!-- Tab 3: Credentials -->
      <TabsContent value="credentials" class="flex-1 min-h-0 overflow-hidden m-0">
        <VirtualDataTable
          :data="storageStore.credentials"
          :columns="credentialColumns"
          :enable-virtualization="true"
          :enable-search="true"
          :page-size="pageSize"
          empty-text="No secrets"
        />
      </TabsContent>
    </Tabs>
  </div>
</template>
