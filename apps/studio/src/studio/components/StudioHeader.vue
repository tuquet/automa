<template>
  <header
    data-testid="studio-header"
    class="h-11 border-b border-border bg-card px-2.5 sm:px-4 flex items-center justify-between z-30 shrink-0 select-none relative text-foreground"
  >
    <!-- Left Section: Sidebar Toggle, New Workflow & Workflow Switcher / Actions -->
    <div class="flex items-center gap-1 sm:gap-1.5 shrink min-w-0">
      <Button
        variant="ghost"
        size="icon-sm"
        data-testid="btn-toggle-sidebar"
        :title="showSidebar ? 'Hide Sidebar' : 'Show Sidebar'"
        class="shrink-0"
        @click="$emit('toggleSidebar')"
      >
        <PanelLeft v-if="!showSidebar" class="size-3.5" />
        <PanelLeftClose v-else class="size-3.5" />
      </Button>

      <!-- Quick New Blank Workflow Button (Icon-only, compact) -->
      <AutomaButton
        id="btn.workflow.create"
        icon-only
        size="icon-sm"
        variant="ghost"
        class="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
        @click="$emit('newWorkflow')"
      />

      <!-- Workflow Switcher: Shadcn Popover Combobox Dropdown Button -->
      <Popover v-model:open="isDropdownOpen">
        <PopoverTrigger as-child>
          <button
            id="btn.workflow.select_dropdown"
            type="button"
            role="combobox"
            :aria-expanded="isDropdownOpen"
            data-testid="btn-selected-workflow"
            class="px-2 sm:px-2.5 py-1 text-xs font-medium rounded-lg border border-border bg-muted/70 hover:bg-accent transition flex items-center gap-1.5 truncate max-w-[130px] sm:max-w-[170px] md:max-w-[220px] text-foreground shadow-2xs cursor-pointer shrink"
            :title="`Current Workflow: ${currentWorkflowName} ${
              currentFilePath ? `(${currentFilePath})` : ''
            } - Click to switch`"
          >
            <GitBranch class="size-3.5 text-primary shrink-0" />
            <span class="truncate font-semibold text-xs">{{
              currentWorkflowName
            }}</span>

            <!-- Unsaved changes minimal dot indicator -->
            <span
              v-if="isDirty"
              class="size-1.5 rounded-full bg-amber-500 shrink-0"
              title="Unsaved changes"
            />

            <ChevronsUpDown
              class="size-3 text-muted-foreground shrink-0 transition-transform duration-150 ml-0.5 opacity-60"
            />
          </button>
        </PopoverTrigger>

        <!-- Dropdown Popover Content (Portaled, Collision-Aware) -->
        <PopoverContent
          align="start"
          :side-offset="6"
          class="w-72 sm:w-80 p-2 bg-card border-border shadow-2xl z-50 text-xs text-foreground"
          data-testid="dropdown-workflows-menu"
        >
          <!-- Search Filter -->
          <div class="px-1.5 pb-2 border-b border-border">
            <div class="relative flex items-center">
              <Search
                class="size-3.5 absolute left-2.5 text-muted-foreground"
              />
              <input
                ref="searchInputRef"
                v-model="searchQuery"
                data-testid="input-workflow-search"
                type="text"
                placeholder="Search workflows..."
                class="w-full pl-7 pr-2.5 py-1 text-xs rounded-md border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring text-foreground"
              />
            </div>
          </div>

          <!-- Workflows List -->
          <div class="max-h-60 overflow-y-auto py-1 px-0.5 space-y-0.5 scroll">
            <div
              v-if="filteredWorkflows.length === 0"
              class="py-6 text-center text-muted-foreground text-xs"
            >
              No workflows found
            </div>

            <div
              v-for="wf in filteredWorkflows"
              :key="wf.path || wf.id || wf.name"
              class="group flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-muted/80 transition cursor-pointer"
              :class="{
                'bg-primary/10 text-primary font-semibold':
                  wf.name === currentWorkflowName ||
                  wf.path === currentFilePath ||
                  (wf.id && wf.id === currentWorkflowId),
              }"
              @click="onSelectWorkflow(wf)"
            >
              <div class="flex items-center gap-2 min-w-0 flex-1 pr-2">
                <GitBranch
                  class="size-3.5 shrink-0"
                  :class="
                    wf.name === currentWorkflowName ||
                    wf.path === currentFilePath ||
                    (wf.id && wf.id === currentWorkflowId)
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  "
                />
                <div class="flex flex-col min-w-0">
                  <span class="truncate font-medium text-xs">{{
                    wf.name
                  }}</span>
                  <span
                    v-if="wf.id && wf.id !== wf.name"
                    class="text-xs text-muted-foreground font-mono truncate"
                  >
                    {{ wf.id }}
                  </span>
                </div>
              </div>

              <div class="flex items-center gap-1 shrink-0">
                <Check
                  v-if="
                    wf.name === currentWorkflowName ||
                    wf.path === currentFilePath ||
                    (wf.id && wf.id === currentWorkflowId)
                  "
                  class="size-3.5 text-primary shrink-0 mr-0.5"
                />

                <!-- Per-item Quick Delete action on hover/focus -->
                <button
                  type="button"
                  :data-testid="`btn-delete-workflow-${wf.id || wf.name}`"
                  class="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition cursor-pointer"
                  title="Delete this workflow from SQLite"
                  @click.stop="promptDeleteWorkflow(wf)"
                >
                  <Trash2 class="size-3" />
                </button>
              </div>
            </div>
          </div>

          <!-- Bottom Dropdown Quick Action -->
          <div class="pt-1.5 mt-1 border-t border-border px-1">
            <button
              type="button"
              data-testid="btn-dropdown-create-workflow"
              class="w-full text-left px-2 py-1.5 rounded-md flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
              @click="handleCreateFromDropdown"
            >
              <Plus class="size-3.5 text-primary" />
              <span>New Blank Workflow</span>
            </button>
          </div>
        </PopoverContent>
      </Popover>

      <!-- More Actions Dropdown Menu: Shadcn DropdownMenu Primitive -->
      <DropdownMenu v-model:open="isMoreMenuOpen">
        <DropdownMenuTrigger as-child>
          <Button
            variant="ghost"
            size="sm"
            data-testid="btn-workflow-more-actions"
            title="Workflow Actions (Import, Export, Delete)"
            class="h-7 px-2 text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <span>Actions</span>
            <ChevronDown class="size-3 opacity-60" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          :side-offset="6"
          class="w-48 bg-card border-border shadow-2xl z-50 text-xs"
          data-testid="menu-workflow-actions"
        >
          <DropdownMenuItem
            data-testid="btn-import-workflow"
            class="text-xs cursor-pointer flex items-center gap-2 px-2.5 py-1.5"
            @select="onMoreAction('importWorkflow')"
          >
            <Upload class="size-3.5 text-muted-foreground" />
            <span>Import JSON...</span>
          </DropdownMenuItem>

          <DropdownMenuItem
            data-testid="btn-export-workflow"
            class="text-xs cursor-pointer flex items-center gap-2 px-2.5 py-1.5"
            @select="onMoreAction('exportJson')"
          >
            <Download class="size-3.5 text-muted-foreground" />
            <span>Export JSON</span>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            data-testid="btn-delete-workflow"
            class="text-xs text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer flex items-center gap-2 px-2.5 py-1.5"
            @select="onMoreAction('deleteWorkflow')"
          >
            <Trash2 class="size-3.5" />
            <span>Delete Workflow</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <!-- Center Section: Fluid Spacer (Eliminates horizontal cramping) -->
    <div class="flex-1 min-w-2" />

    <!-- Right Section: Utilities, Status & Execution -->
    <div class="flex items-center gap-1 sm:gap-1.5 shrink-0">
      <!-- Secondary Utilities (Desktop >= lg: Individual buttons) -->
      <div class="hidden lg:flex items-center gap-1 shrink-0">
        <!-- Live Lint Button (Icon-only) -->
        <Button
          v-if="automaCoreStatus === 'online'"
          variant="ghost"
          size="icon-sm"
          data-testid="btn-lint-workflow"
          class="h-7 w-7 relative"
          :class="
            lintIssuesCount > 0
              ? 'text-amber-500 hover:bg-amber-500/10'
              : 'text-emerald-500 hover:bg-emerald-500/10'
          "
          :title="
            lintIssuesCount > 0
              ? `Lint: ${lintIssuesCount} issue(s) detected`
              : 'Lint: All schema checks passed'
          "
          @click="$emit('triggerLint')"
        >
          <AlertCircle v-if="lintIssuesCount > 0" class="size-3.5" />
          <Check v-else class="size-3.5" />
          <Badge
            v-if="lintIssuesCount > 0"
            variant="destructive"
            class="absolute -top-1 -right-1 px-1 py-0 text-xs h-3.5 min-w-3.5 flex items-center justify-center font-mono"
          >
            {{ lintIssuesCount }}
          </Badge>
        </Button>

        <!-- Unified Storage Hub (Icon-only) -->
        <Button
          v-if="automaCoreStatus === 'online'"
          variant="ghost"
          size="icon-sm"
          data-testid="btn-storage-data"
          title="Storage Hub (Tables, Variables, Credentials)"
          class="h-7 w-7 text-muted-foreground hover:text-foreground"
          @click="$emit('openModal', 'storage')"
        >
          <Database class="size-3.5 text-primary" />
        </Button>

        <!-- Settings Drawer Trigger (Desktop >= lg) -->
        <Button
          variant="ghost"
          size="icon-sm"
          data-testid="btn-settings"
          title="Workflow Settings"
          class="h-7 w-7 text-muted-foreground hover:text-foreground"
          @click="$emit('openModal', 'settings')"
        >
          <Settings class="size-3.5" />
        </Button>

        <!-- Logs Modal (Icon-only with badge) -->
        <Button
          v-if="automaCoreStatus === 'online'"
          variant="ghost"
          size="icon-sm"
          data-testid="btn-view-job-logs"
          title="Execution Logs"
          class="h-7 w-7 relative text-muted-foreground hover:text-foreground"
          @click="$emit('openModal', 'logs')"
        >
          <FileText class="size-3.5 shrink-0" />
          <Badge
            v-if="logsCount > 0"
            variant="secondary"
            data-testid="logs-count-badge"
            class="absolute -top-1 -right-1 px-1 py-0 text-xs h-3.5 min-w-3.5 flex items-center justify-center font-mono"
          >
            {{ logsCount }}
          </Badge>
        </Button>

        <!-- Dark Mode Toggle (Desktop >= lg) -->
        <Button
          variant="ghost"
          size="icon-sm"
          data-testid="btn-toggle-darkmode"
          :title="isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
          class="h-7 w-7 text-muted-foreground hover:text-foreground"
          @click="toggleDark"
        >
          <Sun v-if="isDark" class="size-3.5 text-amber-400" />
          <Moon v-else class="size-3.5 text-indigo-400" />
        </Button>
      </div>

      <!-- Secondary Utilities (Mobile/Compact < lg: Consolidated Shadcn Popover with Drilldown Settings) -->
      <div class="lg:hidden flex items-center shrink-0">
        <Popover v-model:open="isUtilitiesOpen">
          <PopoverTrigger as-child>
            <Button
              variant="ghost"
              size="icon-sm"
              data-testid="btn-utilities-popover"
              class="h-7 w-7 relative text-muted-foreground hover:text-foreground"
              title="Tools & Diagnostics"
            >
              <SlidersHorizontal class="size-3.5" />
              <Badge
                v-if="lintIssuesCount > 0 || logsCount > 0"
                variant="secondary"
                class="absolute -top-1 -right-1 px-1 py-0 text-xs h-3.5 min-w-3.5 flex items-center justify-center font-mono"
              >
                {{ lintIssuesCount || logsCount }}
              </Badge>
            </Button>
          </PopoverTrigger>

          <PopoverContent
            align="end"
            :side-offset="6"
            class="w-72 p-2.5 bg-card border-border shadow-2xl z-50 text-xs text-foreground"
            data-testid="popover-utilities-menu"
          >
            <!-- Utilities Menu -->
            <div class="space-y-0.5">
              <div
                class="px-2 py-1 font-semibold text-muted-foreground uppercase tracking-wider text-xs border-b border-border/60 mb-1"
              >
                Utilities
              </div>

              <!-- Lint Item -->
              <button
                v-if="automaCoreStatus === 'online'"
                type="button"
                data-testid="btn-popover-lint"
                class="w-full text-left px-2 py-1.5 rounded-md flex items-center justify-between hover:bg-muted transition cursor-pointer text-foreground"
                @click="$emit('triggerLint')"
              >
                <div class="flex items-center gap-2">
                  <AlertCircle
                    v-if="lintIssuesCount > 0"
                    class="size-3.5 text-amber-500"
                  />
                  <Check v-else class="size-3.5 text-emerald-500" />
                  <span>Lint & Schema</span>
                </div>
                <Badge
                  v-if="lintIssuesCount > 0"
                  variant="destructive"
                  class="text-xs h-4 px-1"
                >
                  {{ lintIssuesCount }}
                </Badge>
              </button>

              <!-- Storage Item -->
              <button
                v-if="automaCoreStatus === 'online'"
                type="button"
                data-testid="btn-popover-storage"
                class="w-full text-left px-2 py-1.5 rounded-md flex items-center gap-2 hover:bg-muted transition cursor-pointer text-foreground"
                @click="onUtilityStorageClick"
              >
                <Database class="size-3.5 text-primary" />
                <span>Storage Hub</span>
              </button>

              <!-- Settings Item: Directly opens Workflow Settings Drawer -->
              <button
                type="button"
                data-testid="btn-popover-settings"
                class="w-full text-left px-2 py-1.5 rounded-md flex items-center justify-between hover:bg-muted transition cursor-pointer text-foreground"
                @click="onUtilitySettingsClick"
              >
                <div class="flex items-center gap-2">
                  <Settings class="size-3.5 text-muted-foreground" />
                  <span>Workflow Settings</span>
                </div>
              </button>

              <!-- Logs Item -->
              <button
                v-if="automaCoreStatus === 'online'"
                type="button"
                data-testid="btn-popover-logs"
                class="w-full text-left px-2 py-1.5 rounded-md flex items-center justify-between hover:bg-muted transition cursor-pointer text-foreground"
                @click="onUtilityLogsClick"
              >
                <div class="flex items-center gap-2">
                  <FileText class="size-3.5 text-muted-foreground" />
                  <span>Job Logs</span>
                </div>
                <Badge
                  v-if="logsCount > 0"
                  variant="secondary"
                  class="text-xs h-4 px-1"
                >
                  {{ logsCount }}
                </Badge>
              </button>

              <!-- Dark Mode Item -->
              <button
                type="button"
                data-testid="btn-popover-darkmode"
                class="w-full text-left px-2 py-1.5 rounded-md flex items-center justify-between hover:bg-muted transition cursor-pointer text-foreground"
                @click="toggleDark"
              >
                <div class="flex items-center gap-2">
                  <Sun v-if="isDark" class="size-3.5 text-amber-400" />
                  <Moon v-else class="size-3.5 text-indigo-400" />
                  <span>{{ isDark ? 'Light Mode' : 'Dark Mode' }}</span>
                </div>
                <span class="text-xs text-muted-foreground font-mono">
                  {{ isDark ? 'Dark' : 'Light' }}
                </span>
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <!-- Slot for Studio Core Status Indicator -->
      <slot name="status" />

      <!-- Subtle separator -->
      <div class="h-4 w-px bg-border mx-0.5 sm:mx-1 shrink-0" />

      <!-- Save Button (Always visible, shrink-0) -->
      <AutomaButton
        id="btn.workflow.save"
        size="sm"
        :variant="isDirty ? 'default' : 'outline'"
        class="h-7 px-2.5 text-xs font-medium shrink-0"
        @click="$emit('saveWorkflow')"
      />

      <!-- Live Execution Controls / Run Button (Always visible, shrink-0) -->
      <div class="flex items-center gap-1 shrink-0">
        <!-- If Job is currently running, show Pause/Resume and Stop buttons -->
        <template v-if="isJobRunning">
          <Button
            variant="outline"
            size="sm"
            class="h-7 px-2.5 text-xs border-amber-500/40 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 shrink-0"
            :data-testid="
              isJobPaused ? 'btn-resume-workflow' : 'btn-pause-workflow'
            "
            :title="
              isJobPaused ? 'Resume Job (WebSocket)' : 'Pause Job (WebSocket)'
            "
            @click="isJobPaused ? $emit('resumeJob') : $emit('pauseJob')"
          >
            <Play v-if="isJobPaused" class="size-3 mr-1" />
            <Pause v-else class="size-3 mr-1" />
            <span>{{ isJobPaused ? 'Resume' : 'Pause' }}</span>
          </Button>

          <Button
            variant="destructive"
            size="sm"
            class="h-7 px-2.5 text-xs shrink-0"
            data-testid="btn-stop-workflow"
            title="Stop Job"
            @click="$emit('stopJob')"
          >
            <Square class="size-3 mr-1" />
            <span>Stop</span>
          </Button>
        </template>

        <!-- Standard Run Button -->
        <AutomaButton
          v-else
          id="btn.workflow.run"
          size="sm"
          variant="default"
          :disabled="automaCoreStatus !== 'online'"
          :tooltip="
            automaCoreStatus !== 'online'
              ? 'Automa Core is offline. Start the daemon to run workflows.'
              : 'Run active workflow (F5)'
          "
          class="h-7 px-2.5 text-xs font-medium bg-primary text-primary-foreground shadow-2xs hover:bg-primary/90 shrink-0"
          @click="$emit('runWorkflow')"
        />
      </div>
    </div>

    <!-- Confirmation Modal for Workflow Deletion -->
    <ConfirmationModal
      :is-open="confirmDeleteOpen"
      title="Delete Workflow"
      :message="`Are you sure you want to delete '${
        workflowToDelete?.name || currentWorkflowName
      }'? This action cannot be undone and will permanently remove it from SQLite.`"
      confirm-text="Delete"
      cancel-text="Cancel"
      variant="destructive"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
      @update:is-open="confirmDeleteOpen = $event"
    />
  </header>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue';
import {
  AutomaButton,
  Button,
  Badge,
  ConfirmationModal,
  Popover,
  PopoverTrigger,
  PopoverContent,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@automa/ui';
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronsUpDown,
  Database,
  Download,
  FileText,
  GitBranch,
  Moon,
  PanelLeft,
  PanelLeftClose,
  Pause,
  Play,
  Plus,
  Search,
  Settings,
  SlidersHorizontal,
  Square,
  Sun,
  Trash2,
  Upload,
} from 'lucide-vue-next';
import { useStudioTheme } from '../composables/useStudioTheme';

defineOptions({
  name: 'StudioHeader',
});

const props = defineProps({
  showSidebar: {
    type: Boolean,
    default: true,
  },
  automaCoreStatus: {
    type: String,
    default: 'offline',
  },
  currentWorkflowId: {
    type: String,
    default: '',
  },
  currentWorkflowName: {
    type: String,
    default: 'Untitled Workflow',
  },
  currentFilePath: {
    type: String,
    default: '',
  },
  availableWorkflows: {
    type: Array,
    default: () => [],
  },
  lintIssuesCount: {
    type: Number,
    default: 0,
  },
  logsCount: {
    type: Number,
    default: 0,
  },
  isDirty: {
    type: Boolean,
    default: false,
  },
  isJobRunning: {
    type: Boolean,
    default: false,
  },
  isJobPaused: {
    type: Boolean,
    default: false,
  },
  workflowSettings: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits([
  'toggleSidebar',
  'openStorageExplorer',
  'openFilePicker',
  'importWorkflow',
  'newWorkflow',
  'deleteWorkflow',
  'selectWorkflow',
  'triggerLint',
  'openModal',
  'saveWorkflow',
  'exportJson',
  'runWorkflow',
  'killAllBrowsers',
  'pauseJob',
  'resumeJob',
  'stopJob',
  'updateWorkflowSettings',
]);

const isDropdownOpen = ref(false);
const isMoreMenuOpen = ref(false);
const isUtilitiesOpen = ref(false);

const { isDark, toggleDark } = useStudioTheme();

function onUtilitySettingsClick() {
  isUtilitiesOpen.value = false;
  nextTick(() => {
    emit('openModal', 'settings');
  });
}

function onUtilityStorageClick() {
  isUtilitiesOpen.value = false;
  emit('openModal', 'storage');
}

function onUtilityLogsClick() {
  isUtilitiesOpen.value = false;
  emit('openModal', 'logs');
}

const searchQuery = ref('');
const searchInputRef = ref(null);

const confirmDeleteOpen = ref(false);
const workflowToDelete = ref(null);

const filteredWorkflows = computed(() => {
  const list = props.availableWorkflows || [];
  if (!searchQuery.value) return list;
  const q = searchQuery.value.toLowerCase();
  return list.filter(
    (wf) =>
      wf.name?.toLowerCase().includes(q) ||
      wf.path?.toLowerCase().includes(q) ||
      wf.id?.toLowerCase().includes(q)
  );
});

function onSelectWorkflow(wf) {
  isDropdownOpen.value = false;
  emit('selectWorkflow', wf.path || wf);
}

function handleCreateFromDropdown() {
  isDropdownOpen.value = false;
  emit('newWorkflow');
}

function promptDeleteWorkflow(wf) {
  workflowToDelete.value = wf;
  confirmDeleteOpen.value = true;
  isDropdownOpen.value = false;
  isMoreMenuOpen.value = false;
}

function promptDeleteCurrentWorkflow() {
  workflowToDelete.value = {
    id: props.currentWorkflowId || props.currentFilePath,
    name: props.currentWorkflowName,
  };
  confirmDeleteOpen.value = true;
  isMoreMenuOpen.value = false;
}

function onMoreAction(action) {
  isMoreMenuOpen.value = false;
  switch (action) {
    case 'importWorkflow':
      emit('importWorkflow');
      break;
    case 'exportJson':
      emit('exportJson');
      break;
    case 'deleteWorkflow':
      promptDeleteCurrentWorkflow();
      break;
    default:
      break;
  }
}

function confirmDelete() {
  if (!workflowToDelete.value) return;
  const targetId =
    workflowToDelete.value.id ||
    workflowToDelete.value.path ||
    workflowToDelete.value.name;
  emit('deleteWorkflow', targetId);
  confirmDeleteOpen.value = false;
  workflowToDelete.value = null;
}

function cancelDelete() {
  confirmDeleteOpen.value = false;
  workflowToDelete.value = null;
}
</script>
