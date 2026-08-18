import os
import re

def rewrite_storage_tables():
    path = 'automa-ext/src/components/newtab/storage/StorageTables.vue'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    script_content = '''<script setup>
import { reactive, ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import dayjs from 'dayjs';
import { useDialog } from '@/composable/dialog';
import { useWorkflowStore } from '@/stores/workflow';
import StorageEditTable from './StorageEditTable.vue';

const { t } = useI18n();
const dialog = useDialog();
const workflowStore = useWorkflowStore();

const state = reactive({
  query: '',
  showAddTable: false,
});

const tableHeaders = [
  {
    value: 'name',
    filterable: true,
    text: t('common.name'),
    attrs: {
      class: 'w-4/12',
      style: 'min-width: 120px',
    },
  },
  {
    align: 'center',
    value: 'createdAt',
    text: t('storage.table.createdAt'),
    attrs: {
      style: 'min-width: 200px',
    },
  },
  {
    align: 'center',
    value: 'modifiedAt',
    text: t('storage.table.modifiedAt'),
    attrs: {
      style: 'min-width: 200px',
    },
  },
  {
    value: 'rowsCount',
    align: 'center',
    text: t('storage.table.rowsCount'),
  },
  {
    value: 'actions',
    align: 'right',
    text: '',
    sortable: false,
  },
];
const items = ref([]);

async function fetchTables() {
  try {
    const res = await fetch('http://localhost:8765/api/vault/tables');
    if (res.ok) {
      items.value = await res.json();
    }
  } catch (error) {
    console.error(error);
  }
}

onMounted(() => {
  fetchTables();
});

function formatDate(date) {
  return dayjs(date).format('DD MMM YYYY, hh:mm:ss A');
}
async function saveTable({ columns, name }) {
  try {
    const columnsIndex = columns.reduce(
      (acc, column) => {
        acc[column.id] = {
          index: 0,
          type: column.type,
          name: column.name,
        };

        return acc;
      },
      { column: { index: 0, type: 'any', name: 'column' } }
    );

    const res = await fetch('http://localhost:8765/api/vault/tables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rowsCount: 0,
        name,
        createdAt: Date.now(),
        modifiedAt: Date.now(),
        columns,
        columnsIndex,
      }),
    });

    if (res.ok) {
      state.showAddTable = false;
      await fetchTables();
    }
  } catch (error) {
    console.error(error);
  }
}
function deleteTable(table) {
  dialog.confirm({
    title: t('storage.table.delete'),
    okVariant: 'danger',
    body: t('message.delete', { name: table.name }),
    onConfirm: async () => {
      try {
        const res = await fetch(http://localhost:8765/api/vault/tables/, {
          method: 'DELETE',
        });
        if (res.ok) {
          await workflowStore.update({
            id: (workflow) => workflow.connectedTable === table.id,
            data: { connectedTable: null },
          });
          await fetchTables();
        }
      } catch (error) {
        console.error(error);
      }
    },
  });
}
</script>'''
    
    content = re.sub(r'<script setup>.*?</script>', script_content, content, flags=re.DOTALL)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

rewrite_storage_tables()
