<template>
  <div class="global-data flex flex-col space-y-3">
    <div class="flex items-center justify-between border-b border-border pb-2">
      <div class="flex space-x-2">
        <button
          class="px-3 py-1.5 text-xs font-semibold rounded-lg transition"
          :class="
            activeTab === 'local'
              ? 'bg-accent text-accent-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          "
          @click="activeTab = 'local'"
        >
          Local JSON Data
        </button>
        <button
          class="px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center space-x-1"
          :class="
            activeTab === 'storage'
              ? 'bg-accent text-accent-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
          "
          @click="loadStorageVariables"
        >
          <span>Storage Variables</span>
          <span
            v-if="storageVars.length > 0"
            class="px-1.5 py-0.5 rounded-full text-xs bg-foreground/10"
          >
            {{ storageVars.length }}
          </span>
        </button>
      </div>
      <p
        v-if="activeTab === 'local'"
        class="text-xs text-muted-foreground"
        title="Characters limit"
      >
        {{ globalData.length }}/{{ maxLength.toLocaleString() }}
      </p>
    </div>

    <!-- Tab 1: Local Workflow JSON Data -->
    <div v-if="activeTab === 'local'">
      <shared-codemirror
        v-model="globalData"
        style="height: calc(100vh - 14rem); min-height: 300px"
        lang="json"
      />
    </div>

    <!-- Tab 2: Storage Shared Variables & Credentials List -->
    <div
      v-else
      class="space-y-3 overflow-y-auto"
      style="max-height: calc(100vh - 14rem); min-height: 300px"
    >
      <div class="p-3 rounded-lg bg-muted/50 border border-border text-xs">
        <p class="text-foreground font-medium mb-1">
          💡 Click any token below to copy expression to clipboard:
        </p>
        <p class="text-xs text-muted-foreground">
          Variables are securely stored in SQLite Storage and accessible across
          all workflows in campaign.
        </p>
      </div>

      <div
        v-if="isLoadingStorage"
        class="py-8 text-center text-xs text-muted-foreground"
      >
        Loading Storage variables...
      </div>

      <div
        v-else-if="storageVars.length === 0"
        class="py-8 text-center text-xs text-muted-foreground"
      >
        No variables stored in SQLite Storage yet. (Add variables via
        automa-vscode or daemon API).
      </div>

      <div v-else class="grid grid-cols-1 gap-2">
        <div
          v-for="v in storageVars"
          :key="v.id || v.name"
          class="p-2.5 rounded-lg border border-border bg-card text-card-foreground flex items-center justify-between hover:border-accent transition group"
        >
          <div class="flex flex-col min-w-0 pr-2">
            <span class="font-mono font-semibold text-xs text-accent truncate">
              &#123;&#123;variables.{{ v.name }}&#125;&#125;
            </span>
            <span class="text-xs text-muted-foreground truncate mt-0.5">
              Value: {{ String(v.value).slice(0, 40)
              }}{{ String(v.value).length > 40 ? '...' : '' }}
            </span>
          </div>

          <button
            class="px-2.5 py-1 text-xs font-medium rounded bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground transition shrink-0"
            title="Copy variable token to clipboard"
            @click="copyToken(`{{variables.${v.name}}}`)"
          >
            Copy Token
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, watch, defineAsyncComponent, onMounted } from 'vue';
import { debounce } from '@/utils/helper';
import { fetchStorageVariables } from '@/studio/services/storage.service';
import { useToast } from 'vue-toastification';

const SharedCodemirror = defineAsyncComponent(() =>
  import('@/components/newtab/shared/SharedCodemirror.vue')
);

const props = defineProps({
  workflow: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update']);

const toast = useToast();
const maxLength = 1e4;
const globalData = ref(
  `${props.workflow.globalData || '{\n\t"key": "value"\n}'}`
);
const activeTab = ref('local');
const storageVars = ref([]);
const isLoadingStorage = ref(false);

async function loadStorageVariables() {
  activeTab.value = 'storage';
  isLoadingStorage.value = true;
  try {
    const list = await fetchStorageVariables();
    storageVars.value = Array.isArray(list) ? list : [];
  } catch (_) {
    storageVars.value = [];
  } finally {
    isLoadingStorage.value = false;
  }
}

function copyToken(token) {
  navigator.clipboard.writeText(token);
  toast.success(`Copied "${token}" to clipboard!`);
}

watch(
  globalData,
  debounce((value) => {
    let newValue = value;

    if (value.length > maxLength) {
      newValue = value.slice(0, maxLength);
      globalData.value = newValue;
    }

    emit('update', { globalData: newValue });
  }, 250)
);

onMounted(() => {
  fetchStorageVariables().then((list) => {
    if (Array.isArray(list)) storageVars.value = list;
  });
});
</script>
