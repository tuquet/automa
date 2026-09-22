<template>
  <div
    ref="root"
    class="ui-paginated-select relative"
    :class="{ 'pointer-events-none opacity-75': disabled }"
  >
    <label
      v-if="label"
      :for="componentId"
      class="mb-1.5 ml-0.5 block text-xs font-medium text-foreground cursor-pointer"
      @click="toggleDropdown"
    >
      {{ label }}
    </label>
    <div class="ui-select__content relative flex w-full items-center">
      <button
        :id="componentId"
        type="button"
        class="flex h-8 w-full appearance-none rounded-md border border-input bg-background px-3 py-1.5 pr-8 text-xs text-foreground text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 transition-colors shadow-2xs z-10 cursor-pointer"
        :class="{ 'text-muted-foreground': !selectedOptionLabel }"
        :disabled="disabled"
        @click="toggleDropdown"
      >
        {{ selectedOptionLabel || placeholder }}
      </button>
      <v-remixicon
        name="riArrowDownSLine"
        size="16"
        class="pointer-events-none absolute right-2.5 text-muted-foreground transition-transform z-20"
        :class="{ 'rotate-180': isOpen }"
      />
    </div>

    <div
      v-if="isOpen"
      class="absolute top-full z-50 mt-1 w-full rounded-md border border-border bg-popover text-popover-foreground shadow-md"
    >
      <div class="px-2 my-2 w-full">
        <ui-input
          v-model="searchKeyword"
          :placeholder="searchPlaceholder"
          prepend-icon="riSearch2Line"
          autofocus
          class="w-full"
        />
      </div>
      <ul
        ref="optionsListEl"
        class="max-h-60 overflow-y-auto p-1 space-y-1 text-xs"
        @scroll="handleScroll"
      >
        <li
          v-for="option in options"
          :key="option[optionValueKey]"
          class="cursor-pointer rounded-sm px-3 py-1.5 hover:bg-accent hover:text-accent-foreground transition-colors"
          :class="{
            'bg-accent font-semibold text-accent-foreground':
              modelValue === option[optionValueKey],
          }"
          @click="selectOption(option)"
        >
          {{ option[optionLabelKey] }}
        </li>
        <li
          v-if="isLoading"
          class="px-3 py-2 text-center text-muted-foreground"
        >
          Loading...
        </li>
        <li
          v-if="!haveMore && !isLoading && options.length > 0"
          class="px-3 py-2 text-center text-xs text-muted-foreground"
        >
          No more results
        </li>
        <li
          v-if="!isLoading && options.length === 0"
          class="px-3 py-2 text-center text-xs text-muted-foreground"
        >
          No results found
        </li>
      </ul>
      <div v-if="$slots.footer" class="border-t border-border p-2">
        <slot name="footer"></slot>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useComponentId } from '@/composable/componentId';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

defineOptions({ name: 'UiPaginatedSelect' });

const props = defineProps({
  modelValue: {
    type: [String, Number, null],
    default: null,
  },
  label: {
    type: String,
    default: '',
  },
  placeholder: {
    type: String,
    default: 'Select an option',
  },
  searchPlaceholder: {
    type: String,
    default: 'Search...',
  },
  disabled: Boolean,
  loadOptions: {
    type: Function,
    required: true,
  },
  optionValueKey: {
    type: String,
    required: true,
  },
  optionLabelKey: {
    type: String,
    required: true,
  },
  initialLabel: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue', 'change']);

const componentId = useComponentId('paginated-select');

const root = ref(null);
const isOpen = ref(false);
const options = ref([]);
const searchKeyword = ref('');
const isLoading = ref(false);
const page = ref(1);
const haveMore = ref(true);
const optionsListEl = ref(null);
const localInitialLabel = ref('');
const fetchRequestToken = ref(0);

const selectedOption = computed(() =>
  options.value.find((opt) => opt[props.optionValueKey] === props.modelValue)
);

const selectedOptionLabel = computed(
  () => selectedOption.value?.[props.optionLabelKey] || localInitialLabel.value
);

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

const fetchOptions = async (isNewSearch) => {
  // Prevent concurrent scroll requests, but allow new searches to override.
  if (isLoading.value && !isNewSearch) return;

  isLoading.value = true;
  if (isNewSearch) {
    page.value = 1;
    options.value = [];
    haveMore.value = true;
    // Each new search gets a unique token.
    // This invalidates ongoing requests from previous searches.
    fetchRequestToken.value += 1;
  }

  const currentRequestToken = fetchRequestToken.value;

  // Do not fetch if we know there are no more results
  if (!haveMore.value) {
    isLoading.value = false;
    return;
  }

  try {
    const { data, hasMore } = await props.loadOptions({
      query: searchKeyword.value,
      page: page.value,
    });

    // If the token has changed, a new search was initiated.
    // We must ignore the results of this outdated request.
    if (currentRequestToken !== fetchRequestToken.value) {
      return;
    }

    options.value.push(...data);
    haveMore.value = hasMore;
    if (haveMore.value) {
      page.value += 1;
    }
  } catch (error) {
    console.error('Failed to load options:', error);
    if (currentRequestToken === fetchRequestToken.value) {
      haveMore.value = false;
    }
  } finally {
    if (currentRequestToken === fetchRequestToken.value) {
      // Only stop the loading indicator if this is the currently active search.
      isLoading.value = false;
    }
  }
};

const debouncedFetch = debounce(() => fetchOptions(true), 300);

watch(searchKeyword, () => {
  debouncedFetch();
});

const toggleDropdown = () => {
  if (props.disabled) return;
  isOpen.value = !isOpen.value;
};

const closeDropdown = () => {
  isOpen.value = false;
};

const selectOption = (option) => {
  const value = option[props.optionValueKey];
  const label = option[props.optionLabelKey];
  localInitialLabel.value = label;
  emit('update:modelValue', value);
  emit('change', value, label);
  closeDropdown();
};

const handleScroll = (event) => {
  const el = event.target;
  const threshold = 50;
  if (el.scrollTop + el.clientHeight >= el.scrollHeight - threshold) {
    fetchOptions(false);
  }
};

const handleClickOutside = (event) => {
  if (root.value && !root.value.contains(event.target)) {
    closeDropdown();
  }
};

onMounted(() => {
  document.addEventListener('click', handleClickOutside, true);
  if (props.modelValue && props.initialLabel) {
    localInitialLabel.value = props.initialLabel;
  }
  fetchOptions(true);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside, true);
});
</script>
