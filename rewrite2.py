import os
import re

def rewrite_tables():
    path = 'automa-ext/src/newtab/pages/storage/Tables.vue'
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    script_content = '''<script setup>
import { shallowRef, shallowReactive, toRaw, triggerRef, ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useWorkflowStore } from '@/stores/workflow';
import { useDialog } from '@/composable/dialog';
import { objectHasKey } from '@/utils/helper';
import { dataExportTypes } from '@/utils/shared';
import StorageEditTable from '@/components/newtab/storage/StorageEditTable.vue';
import dataExporter from '@/utils/dataExporter';

const { t } = useI18n();
const route = useRoute();
const dialog = useDialog();
const router = useRouter();
const workflowStore = useWorkflowStore();

const tableId = +route.params.id;

const tableDetail = ref(null);
const tableData = ref(null);

const table = shallowRef({
  body: [],
  header: [],
});
const state = shallowReactive({
  query: '',
});
const editState = shallowReactive({
  name: '',
  columns: [],
  show: false,
});

async function fetchTableData() {
  try {
    const resDetail = await fetch(http://localhost:8765/api/vault/tables/);
    if (resDetail.ok) tableDetail.value = await resDetail.json();
    
    const resData = await fetch(http://localhost:8765/api/vault/tables//data);
    if (resData.ok) tableData.value = await resData.json();
    
    updateTable();
  } catch (error) {
    console.error(error);
  }
}

function updateTable() {
  if (!tableDetail.value || !tableData.value) return;

  const dataTable = { header: [], body: [] };
  const headers = tableDetail.value.columns.map(({ name, type }) => ({
    text: name,
    value: name,
    filterable: ['string', 'any'].includes(type),
  }));

  dataTable.body = tableData.value.items.map((item, index) => ({
    ...item,
    id: index + 1,
  }));
  dataTable.header = additionalHeaders(headers);

  table.value = dataTable;
}

onMounted(() => {
  fetchTableData();
});

function editTable() {
  editState.name = tableDetail.value.name;
  editState.columns = tableDetail.value.columns;
  editState.show = true;
}
function additionalHeaders(headers) {
  headers.unshift({ value: 'id', text: '', sortable: false });
  headers.push({
    value: 'action',
    text: '',
    sortable: false,
    align: 'right',
    attrs: {
      width: '100px',
    },
  });

  return headers;
}
function exportData(type) {
  dataExporter(
    tableData.value.items,
    { name: tableDetail.value.name, type },
    true
  );
}
async function saveEditedTable({ columns, name, changes }) {
  const columnsChanges = Object.values(changes);

  try {
    const headers = [];
    const newTableData = [];
    const newColumnsIndex = {};
    const { columnsIndex } = tableData.value;

    columns.forEach(({ name: columnName, id, type }) => {
      const index = columnsIndex[id]?.index || 0;

      newColumnsIndex[id] = {
        type,
        index,
        name: columnName,
      };
      headers.push({
        text: columnName,
        value: columnName,
        filterable: ['string', 'any'].includes(type),
      });
    });

    if (columnsIndex.column) {
      newColumnsIndex.column = toRaw(columnsIndex.column);
    }

    const newDataBody = table.value.body.map((item, index) => {
      columnsChanges.forEach(
        ({ type, oldValue, newValue, name: columnName }) => {
          if (type === 'rename' && objectHasKey(item, oldValue)) {
            item[newValue] = item[oldValue];
            delete item[oldValue];
          } else if (type === 'delete') {
            delete item[columnName];
          }
        }
      );

      delete item.id;
      newTableData.push({ ...item });
      item.id = index + 1;
      return item;
    });

    await fetch(http://localhost:8765/api/vault/tables/, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        columns,
        items: newTableData,
        columnsIndex: newColumnsIndex
      })
    });

    editState.show = false;
    await fetchTableData();
  } catch (error) {
    console.error(error);
  }
}
async function deleteRow(item) {
  const rowIndex = table.value.body.findIndex(({ id }) => id === item.id);
  if (rowIndex === -1) return;

  const cache = {};
  const { columnsIndex } = tableData.value;
  const columns = Object.values(tableDetail.value.columns);

  Object.keys(item).forEach((key) => {
    if (key === 'id') return;

    const column =
      cache[key] || columns.find((currColumn) => currColumn.name === key);
    if (!column) return;

    const columnIndex = columnsIndex[column.id];
    if (columnIndex && columnIndex.index >= item.id - 1) {
      columnIndex.index -= 1;
    }

    cache[key] = column;
  });

  tableData.value.items.splice(rowIndex, 1);

  await fetch(http://localhost:8765/api/vault/tables//data, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      items: toRaw(tableData.value.items),
      columnsIndex: toRaw(columnsIndex),
      rowsCount: tableDetail.value.rowsCount - 1
    })
  });
  
  await fetchTableData();
}
function clearData() {
  dialog.confirm({
    title: 'Clear data',
    okVariant: 'danger',
    body: 'Are you sure want to clear the table data?',
    onConfirm: async () => {
      const columnsIndex = tableDetail.value.columns.reduce(
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
      
      await fetch(http://localhost:8765/api/vault/tables//data, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [],
          columnsIndex,
          rowsCount: 0
        })
      });
      await fetchTableData();
    },
  });
}
function deleteTable() {
  dialog.confirm({
    title: t('storage.table.delete'),
    okVariant: 'danger',
    body: t('message.delete', { name: tableDetail.value?.name }),
    onConfirm: async () => {
      try {
        await fetch(http://localhost:8765/api/vault/tables/, {
          method: 'DELETE',
        });

        await workflowStore.update({
          id: (workflow) => workflow.connectedTable === tableId,
          data: { connectedTable: null },
        });

        router.replace('/storage');
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

rewrite_tables()
