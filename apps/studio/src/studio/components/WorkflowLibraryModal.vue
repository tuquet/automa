<template>
  <div
    class="workflow-library-modal flex flex-col h-[520px] text-xs text-foreground"
  >
    <!-- Top Action & Nav Bar -->
    <div
      class="flex items-center justify-between gap-2 pb-2.5 border-b border-border"
    >
      <!-- Single Tier Tabs: Workflows, Packages, Campaigns -->
      <div class="flex items-center gap-1">
        <button
          type="button"
          class="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer"
          :class="
            activeTab === 'workflows'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted'
          "
          data-testid="tab-explorer-workflows"
          @click="activeTab = 'workflows'"
        >
          <FileCode class="size-3.5" />
          <span>Workflows</span>
          <span
            class="text-xs px-1 rounded font-mono"
            :class="
              activeTab === 'workflows'
                ? 'bg-primary-foreground/20 text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            "
          >
            {{ workflowsCount }}
          </span>
        </button>

        <button
          type="button"
          class="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer"
          :class="
            activeTab === 'packages'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted'
          "
          data-testid="tab-explorer-packages"
          @click="activeTab = 'packages'"
        >
          <Package class="size-3.5" />
          <span>Packages</span>
          <span
            class="text-xs px-1 rounded font-mono"
            :class="
              activeTab === 'packages'
                ? 'bg-primary-foreground/20 text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            "
          >
            {{ packagesCount }}
          </span>
        </button>

        <button
          type="button"
          class="flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer"
          :class="
            activeTab === 'campaigns'
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted'
          "
          data-testid="tab-explorer-campaigns"
          @click="activeTab = 'campaigns'"
        >
          <Users class="size-3.5" />
          <span>Campaigns</span>
          <span
            class="text-xs px-1 rounded font-mono"
            :class="
              activeTab === 'campaigns'
                ? 'bg-primary-foreground/20 text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            "
          >
            {{ campaigns.length }}
          </span>
        </button>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="flex-1 overflow-hidden py-2">
      <!-- Workflows / Packages Tab (Virtualized Table with single-tier tabs disabled) -->
      <div v-if="activeTab !== 'campaigns'" class="h-full w-full">
        <WorkflowDataTable
          :items="workflowItems"
          :filter-mode="activeTab"
          :show-type-tabs="false"
          :enable-virtualization="true"
          :page-size="15"
          @open-workflow="onSelectWorkflow"
          @select-workflow="onSelectWorkflow"
        />
      </div>

      <!-- Campaigns Tab -->
      <div v-else class="h-full overflow-y-auto space-y-2">
        <div
          v-if="campaigns.length === 0"
          class="py-12 text-center text-muted-foreground"
        >
          <Users class="size-6 inline-block mb-2 text-muted-foreground/60" />
          <p class="font-medium">No campaigns</p>
        </div>
        <div
          v-for="c in campaigns"
          :key="c.id || c.path"
          class="p-2.5 rounded-lg border border-border bg-card hover:border-emerald-500/50 hover:shadow-2xs transition flex items-center justify-between group"
        >
          <div class="flex items-center gap-2.5 min-w-0 pr-2">
            <div
              class="size-7 rounded-md bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0"
            >
              <Users class="size-4" />
            </div>
            <div class="flex flex-col min-w-0">
              <span class="font-medium text-xs text-foreground truncate">{{
                c.name || c.id
              }}</span>
              <span class="text-xs text-muted-foreground font-mono truncate">{{
                c.id || c.relative_path
              }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { WorkflowDataTable } from '@automa/ui';
import { FileCode, Package, Users } from 'lucide-vue-next';
import {
  fetchStorageWorkflows,
  fetchStorageCampaigns,
} from '../services/storage.service';

defineOptions({
  name: 'WorkflowLibraryModal',
});

const emit = defineEmits(['select', 'close']);

const workflows = ref([]);
const campaigns = ref([]);
const isLoading = ref(false);
const activeTab = ref('workflows');

async function loadLibrary() {
  isLoading.value = true;
  try {
    const [wfList, campList] = await Promise.all([
      fetchStorageWorkflows(),
      fetchStorageCampaigns(),
    ]);
    workflows.value = Array.isArray(wfList) ? wfList : [];
    campaigns.value = Array.isArray(campList) ? campList : [];
  } catch (_) {
    workflows.value = [];
    campaigns.value = [];
  } finally {
    isLoading.value = false;
  }
}

const workflowItems = computed(() => {
  return workflows.value.map((w) => ({
    id: w.id || w.path || w.name,
    name: w.name,
    path: w.path || w.id,
    relative_path: w.relative_path || w.name,
    data: w.data || w.content || {},
  }));
});

function isPackageItem(item) {
  const data = item.data || {};
  const settings = data.settings || {};
  return Boolean(
    settings.asBlock === true ||
      item.name?.toLowerCase().includes('.package') ||
      Array.isArray(data.inputs) ||
      Array.isArray(data.outputs)
  );
}

const workflowsCount = computed(
  () => workflowItems.value.filter((w) => !isPackageItem(w)).length
);
const packagesCount = computed(
  () => workflowItems.value.filter((w) => isPackageItem(w)).length
);

function onSelectWorkflow(item) {
  emit('select', item);
}

onMounted(() => {
  loadLibrary();
});
</script>
