<template>
  <div class="ui-table">
    <table
      class="h-full w-full [&_thead]:bg-muted [&_thead]:text-muted-foreground [&_thead_th]:font-semibold [&_thead_th:first-child]:rounded-l-lg [&_thead_th:last-child]:rounded-r-lg [&_tbody>tr+tr]:border-t [&_tbody>tr+tr]:border-border"
    >
      <thead>
        <tr>
          <th
            v-for="header in table.headers"
            :key="header.value"
            :align="header.align"
            class="relative"
            v-bind="header.attrs"
          >
            <span
              :class="{ 'cursor-pointer': header.sortable }"
              class="inline-block"
              @click="updateSort(header)"
            >
              {{ header.text }}
            </span>
            <span
              v-if="header.sortable"
              class="sort-icon ml-1 cursor-pointer"
              @click="updateSort(header)"
            >
              <v-remixicon
                v-if="sortState.id === header.value"
                :rotate="sortState.order === 'asc' ? 90 : -90"
                class="transition-transform"
                size="20"
                name="riArrowLeftLine"
              />
              <v-remixicon v-else name="riArrowUpDownLine" size="20" />
            </span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in filteredItems" :key="item[itemKey]">
          <slot name="item-prepend" :item="item" />
          <td
            v-for="header in headers"
            v-bind="header.rowAttrs"
            :key="header.value"
            :align="header.align"
            v-on="header.rowEvents || {}"
          >
            <slot :name="`item-${header.value}`" :item="item">
              {{ item[header.value] }}
            </slot>
          </td>
          <slot name="item-append" :item="item" />
        </tr>
      </tbody>
    </table>
    <div
      v-if="withPagination && filteredItems && filteredItems.length >= 10"
      class="mt-4 flex items-center justify-between"
    >
      <div class="text-xs text-muted-foreground flex items-center gap-1.5">
        <span>{{ t('components.pagination.text1') }}</span>
        <select
          v-model="pagination.perPage"
          class="h-7 appearance-none rounded-md border border-input bg-background px-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors shadow-2xs cursor-pointer"
        >
          <option
            v-for="num in [10, 15, 25, 50, 100, 150]"
            :key="num"
            :value="num"
          >
            {{ num }}
          </option>
        </select>
        <span>
          {{
            t('components.pagination.text2', {
              count: filteredItems.length,
            })
          }}
        </span>
      </div>
      <ui-pagination
        v-model="pagination.currentPage"
        :per-page="pagination.perPage"
        :records="items.length"
      />
    </div>
  </div>
</template>
<script setup>
import { reactive, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { isObject, arraySorter } from '@/utils/helper';

defineOptions({ name: 'UiTable' });

const props = defineProps({
  headers: {
    type: Array,
    default: () => [],
  },
  items: {
    type: Array,
    default: () => [],
  },
  itemKey: {
    type: String,
    default: '',
    required: true,
  },
  search: {
    type: String,
    default: '',
  },
  customFilter: {
    type: Function,
    default: null,
  },
  withPagination: {
    type: Boolean,
    default: false,
  },
});

const { t } = useI18n();

const table = reactive({
  headers: [],
  filterKeys: [],
});
const sortState = reactive({
  id: '',
  order: 'asc',
});
const pagination = reactive({
  perPage: 10,
  currentPage: 1,
});

const sortedItems = computed(() => {
  const sortedRows = sortState.id
    ? arraySorter({
        data: props.items,
        key: sortState.id,
        order: sortState.order,
      })
    : props.items;
  if (!props.withPagination) return sortedRows;

  return sortedRows.slice(
    (pagination.currentPage - 1) * pagination.perPage,
    pagination.currentPage * pagination.perPage
  );
});
const filteredItems = computed(() => {
  if (!props.search) return sortedItems.value;

  const filterFunc =
    props.customFilter ||
    ((search, item) => {
      return table.filterKeys.some((key) => {
        const value = item[key];
        if (typeof value === 'string')
          return value.toLocaleLowerCase().includes(search);

        return value === search;
      });
    });

  const search = props.search.toLocaleLowerCase();
  return sortedItems.value.filter((item, index) =>
    filterFunc(search, item, index)
  );
});

function updateSort({ sortable, value }) {
  if (!sortable) return;

  if (sortState.id !== value) {
    sortState.id = value;
    sortState.order = 'asc';
    return;
  }

  if (sortState.order === 'asc') {
    sortState.order = 'desc';
  } else {
    sortState.id = '';
  }
}

watch(
  () => props.headers,
  (newHeaders) => {
    const filterKeys = new Set();

    table.headers = newHeaders.map((header) => {
      const headerObj = {
        attrs: {},
        rowAttrs: {},
        align: 'left',
        text: header,
        value: header,
        sortable: true,
        filterable: false,
      };

      if (isObject(header)) Object.assign(headerObj, header);
      if (headerObj.filterable) filterKeys.add(headerObj.value);

      return headerObj;
    });

    table.filterKeys = Array.from(filterKeys);
  },
  { immediate: true }
);
</script>
<style>
.sort-icon svg {
  @apply text-muted-foreground inline-block;
}
</style>
