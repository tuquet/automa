<script setup lang="ts">
import type { AppSettings } from '@automa/types/api'
import { getAppSettings, patchAppSettings } from '@automa/types/api'
import { Check, Cpu, Globe, LayoutGrid, RefreshCw, Save, Sliders } from 'lucide-vue-next'
import { computed, onMounted, reactive, ref } from 'vue'
import AutomaButton from './AutomaButton.vue'
import { Badge } from './ui/badge'
import { Input } from './ui/input'
import { Switch } from './ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

export interface SettingsFormProps {
  initialSettings?: AppSettings | null
  autoFetch?: boolean
  showHeader?: boolean
}

defineOptions({
  name: 'SettingsForm',
})

const props = withDefaults(defineProps<SettingsFormProps>(), {
  initialSettings: null,
  autoFetch: true,
  showHeader: true,
})

const emit = defineEmits<{
  (e: 'saved', settings: AppSettings): void
  (e: 'loaded', settings: AppSettings): void
  (e: 'error', message: string): void
}>()

const isLoading = ref(false)
const isSaving = ref(false)
const saveSuccess = ref(false)
const errorMessage = ref('')
const activeTab = ref('browser')

// Local editable state
interface EditableFormData {
  browser: {
    default_type: string
    headless: boolean
    executable_path: string
    default_user_agent: string
    default_profile_id: string
  }
  runner: {
    max_concurrent_jobs: number
    timeout_ms: number
    auto_clean_history_days: number
  }
  grid: {
    enabled: boolean
    matrix: {
      columns: number
      rows: number
    }
    behavior: {
      auto_recycle_slots: boolean
      enforce_cdp_bounds: boolean
      scale_factor: number
    }
    display: {
      margin: number
      monitor_index: number
      offset_x: number
      offset_y: number
      screen_height: number
      screen_width: number
    }
  }
}

const formData = reactive<EditableFormData>({
  browser: {
    default_type: 'chromium',
    headless: false,
    executable_path: '',
    default_user_agent: '',
    default_profile_id: '',
  },
  runner: {
    max_concurrent_jobs: 4,
    timeout_ms: 300000,
    auto_clean_history_days: 30,
  },
  grid: {
    enabled: true,
    matrix: {
      columns: 2,
      rows: 2,
    },
    behavior: {
      auto_recycle_slots: true,
      enforce_cdp_bounds: false,
      scale_factor: 1,
    },
    display: {
      margin: 10,
      monitor_index: 0,
      offset_x: 0,
      offset_y: 0,
      screen_height: 1080,
      screen_width: 1920,
    },
  },
})

// Original snapshot for dirty tracking
const originalSnapshot = ref<string>('')

const isDirty = computed(() => {
  if (!originalSnapshot.value) return false
  return JSON.stringify(formData) !== originalSnapshot.value
})

function applySettings(settings: AppSettings) {
  if (settings.browser) {
    formData.browser = {
      default_type: settings.browser.default_type || 'chromium',
      headless: Boolean(settings.browser.headless),
      executable_path: settings.browser.executable_path || '',
      default_user_agent: settings.browser.default_user_agent || '',
      default_profile_id: settings.browser.default_profile_id || '',
    }
  }
  if (settings.runner) {
    formData.runner = {
      max_concurrent_jobs: Number(settings.runner.max_concurrent_jobs) || 4,
      timeout_ms: Number(settings.runner.timeout_ms) || 300000,
      auto_clean_history_days: Number(settings.runner.auto_clean_history_days) || 30,
    }
  }
  if (settings.grid) {
    formData.grid = {
      enabled: Boolean(settings.grid.enabled),
      matrix: {
        columns: Number(settings.grid.matrix?.columns) || 2,
        rows: Number(settings.grid.matrix?.rows) || 2,
      },
      behavior: {
        auto_recycle_slots: Boolean(settings.grid.behavior?.auto_recycle_slots),
        enforce_cdp_bounds: Boolean(settings.grid.behavior?.enforce_cdp_bounds),
        scale_factor: Number(settings.grid.behavior?.scale_factor) || 1,
      },
      display: {
        margin: Number(settings.grid.display?.margin) || 10,
        monitor_index: Number(settings.grid.display?.monitor_index) || 0,
        offset_x: Number(settings.grid.display?.offset_x) || 0,
        offset_y: Number(settings.grid.display?.offset_y) || 0,
        screen_height: Number(settings.grid.display?.screen_height) || 1080,
        screen_width: Number(settings.grid.display?.screen_width) || 1920,
      },
    }
  }
  originalSnapshot.value = JSON.stringify(formData)
}

async function fetchSettings() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const res = await getAppSettings()
    if (res.data) {
      applySettings(res.data)
      emit('loaded', res.data)
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to fetch settings'
    errorMessage.value = msg
    emit('error', msg)
  } finally {
    isLoading.value = false
  }
}

async function handleSave() {
  isSaving.value = true
  errorMessage.value = ''
  saveSuccess.value = false
  try {
    const res = await patchAppSettings({
      body: {
        browser: {
          default_type: formData.browser.default_type,
          headless: formData.browser.headless,
          executable_path: formData.browser.executable_path.trim() || null,
          default_user_agent: formData.browser.default_user_agent.trim() || null,
        },
        runner: {
          max_concurrent_jobs: Number(formData.runner.max_concurrent_jobs),
          timeout_ms: Number(formData.runner.timeout_ms),
          auto_clean_history_days: Number(formData.runner.auto_clean_history_days),
        },
        grid: {
          enabled: formData.grid.enabled,
          matrix: {
            columns: Number(formData.grid.matrix.columns),
            rows: Number(formData.grid.matrix.rows),
          },
          behavior: {
            auto_recycle_slots: formData.grid.behavior.auto_recycle_slots,
            enforce_cdp_bounds: formData.grid.behavior.enforce_cdp_bounds,
            scale_factor: Number(formData.grid.behavior.scale_factor),
          },
          display: {
            margin: Number(formData.grid.display.margin),
            monitor_index: Number(formData.grid.display.monitor_index),
            offset_x: Number(formData.grid.display.offset_x),
            offset_y: Number(formData.grid.display.offset_y),
            screen_height: Number(formData.grid.display.screen_height),
            screen_width: Number(formData.grid.display.screen_width),
          },
        },
      },
    })
    if (res.data) {
      applySettings(res.data)
      saveSuccess.value = true
      emit('saved', res.data)
      setTimeout(() => {
        saveSuccess.value = false
      }, 3000)
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to save settings'
    errorMessage.value = msg
    emit('error', msg)
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  if (props.initialSettings) {
    applySettings(props.initialSettings)
  } else if (props.autoFetch) {
    fetchSettings()
  }
})
</script>

<template>
  <div class="w-full flex flex-col space-y-4 text-foreground">
    <!-- Optional Header Controls (Used when embedded standalone) -->
    <div v-if="showHeader" class="flex items-center justify-between pb-3 border-b border-border">
      <div class="flex items-center gap-2.5">
        <Sliders class="size-4 text-primary" :stroke-width="2" />
        <h2 class="text-xs font-semibold tracking-tight text-foreground">Core Engine Settings</h2>
      </div>
      <div class="flex items-center gap-2">
        <Badge v-if="isDirty" variant="warning" class="text-[10px] px-1.5 py-0.5">
          Unsaved
        </Badge>
        <Badge v-else-if="saveSuccess" variant="success" class="text-[10px] px-1.5 py-0.5 flex items-center gap-1">
          <Check class="size-3" /> Saved
        </Badge>
      </div>
    </div>

    <!-- Error Banner -->
    <div
      v-if="errorMessage"
      class="p-2.5 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs font-medium"
    >
      {{ errorMessage }}
    </div>

    <!-- Settings Tabs -->
    <Tabs v-model="activeTab" class="w-full flex-1 flex flex-col space-y-4">
      <TabsList class="inline-flex h-8 items-center rounded-lg bg-muted p-1 text-muted-foreground w-fit">
        <TabsTrigger value="browser" data-testid="tab-settings-browser" class="flex items-center gap-1.5 text-xs px-3 py-1">
          <Globe class="size-3.5" />
          <span>Browser</span>
        </TabsTrigger>
        <TabsTrigger value="runner" data-testid="tab-settings-runner" class="flex items-center gap-1.5 text-xs px-3 py-1">
          <Cpu class="size-3.5" />
          <span>Runner</span>
        </TabsTrigger>
        <TabsTrigger value="grid" data-testid="tab-settings-grid" class="flex items-center gap-1.5 text-xs px-3 py-1">
          <LayoutGrid class="size-3.5" />
          <span>Matrix Grid</span>
        </TabsTrigger>
      </TabsList>

      <!-- TAB 1: BROWSER SETTINGS -->
      <TabsContent value="browser" class="space-y-4 pt-1 outline-none">
        <div class="space-y-3 text-xs">
          <!-- Runtime Engine -->
          <div class="flex items-center justify-between py-2 border-b border-border/50">
            <div>
              <span class="font-medium text-foreground block">Browser Engine</span>
              <span class="text-muted-foreground text-[11px]">Anti-detect automation runtime</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-mono font-medium text-foreground">Chromium</span>
              <Badge variant="secondary" class="text-[10px] uppercase font-mono px-1.5 py-0.2">Built-in</Badge>
              <!-- Hidden select for testid backward compatibility -->
              <select
                v-model="formData.browser.default_type"
                disabled
                data-testid="select-browser-default-type"
                class="sr-only"
              >
                <option value="chromium">Chromium</option>
              </select>
            </div>
          </div>

          <!-- Executable Path -->
          <div class="py-2 border-b border-border/50 space-y-1.5">
            <div class="flex items-center justify-between">
              <label class="font-medium text-foreground">Custom Executable Path</label>
              <span class="text-muted-foreground text-[11px]">Leave blank for auto detection</span>
            </div>
            <Input
              v-model="formData.browser.executable_path"
              data-testid="input-browser-executable-path"
              placeholder="e.g. C:\Program Files\Google\Chrome\Application\chrome.exe"
              class="h-8 text-xs font-mono"
            />
          </div>

          <!-- User Agent -->
          <div class="py-2 border-b border-border/50 space-y-1.5">
            <div class="flex items-center justify-between">
              <label class="font-medium text-foreground">User Agent Override</label>
              <span class="text-muted-foreground text-[11px]">Global fallback</span>
            </div>
            <Input
              v-model="formData.browser.default_user_agent"
              data-testid="input-browser-user-agent"
              placeholder="Mozilla/5.0 (Windows NT 10.0; Win64; x64)..."
              class="h-8 text-xs font-mono"
            />
          </div>

          <!-- Headless Mode -->
          <div class="flex items-center justify-between py-2">
            <div>
              <span class="font-medium text-foreground block">Headless Mode</span>
              <span class="text-muted-foreground text-[11px]">Execute background jobs without GUI window</span>
            </div>
            <Switch
              :checked="formData.browser.headless"
              data-testid="switch-browser-headless"
              @update:checked="formData.browser.headless = $event"
            />
          </div>
        </div>
      </TabsContent>

      <!-- TAB 2: RUNNER SETTINGS -->
      <TabsContent value="runner" class="space-y-4 pt-1 outline-none">
        <div class="space-y-3 text-xs">
          <!-- Concurrency -->
          <div class="flex items-center justify-between py-2 border-b border-border/50">
            <div>
              <span class="font-medium text-foreground block">Max Concurrent Jobs</span>
              <span class="text-muted-foreground text-[11px]">Parallel job execution pool limit</span>
            </div>
            <div class="flex items-center gap-2 w-32">
              <Input
                v-model="formData.runner.max_concurrent_jobs"
                data-testid="input-runner-max-concurrency"
                type="number"
                min="1"
                max="32"
                class="h-8 text-xs font-mono text-right"
              />
              <span class="text-xs text-muted-foreground shrink-0">jobs</span>
            </div>
          </div>

          <!-- Timeout -->
          <div class="flex items-center justify-between py-2 border-b border-border/50">
            <div>
              <span class="font-medium text-foreground block">Execution Timeout</span>
              <span class="text-muted-foreground text-[11px]">Runaway task termination threshold</span>
            </div>
            <div class="flex items-center gap-2 w-36">
              <Input
                v-model="formData.runner.timeout_ms"
                data-testid="input-runner-timeout"
                type="number"
                min="1000"
                step="1000"
                class="h-8 text-xs font-mono text-right"
              />
              <span class="text-xs text-muted-foreground shrink-0">ms</span>
            </div>
          </div>

          <!-- History Retention -->
          <div class="flex items-center justify-between py-2">
            <div>
              <span class="font-medium text-foreground block">History Retention</span>
              <span class="text-muted-foreground text-[11px]">Auto-purge execution telemetry logs</span>
            </div>
            <div class="flex items-center gap-2 w-32">
              <Input
                v-model="formData.runner.auto_clean_history_days"
                data-testid="input-runner-retention-days"
                type="number"
                min="1"
                max="365"
                class="h-8 text-xs font-mono text-right"
              />
              <span class="text-xs text-muted-foreground shrink-0">days</span>
            </div>
          </div>
        </div>
      </TabsContent>

      <!-- TAB 3: MATRIX & GRID SETTINGS -->
      <TabsContent value="grid" class="space-y-4 pt-1 outline-none">
        <div class="space-y-3 text-xs">
          <!-- Grid Toggle -->
          <div class="flex items-center justify-between py-2 border-b border-border/50">
            <div>
              <span class="font-medium text-foreground block">Auto-Grid Tiling</span>
              <span class="text-muted-foreground text-[11px]">Position browser windows across screen coordinates</span>
            </div>
            <Switch
              :checked="formData.grid.enabled"
              data-testid="switch-grid-enabled"
              @update:checked="formData.grid.enabled = $event"
            />
          </div>

          <div v-if="formData.grid.enabled" class="space-y-3 pt-1">
            <!-- Matrix Columns & Rows in 2-col compact card -->
            <div class="grid grid-cols-2 gap-3">
              <div class="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/50">
                <div>
                  <span class="font-medium text-foreground block text-xs">Columns</span>
                  <span class="text-muted-foreground text-[11px]">Horizontal slots</span>
                </div>
                <div class="flex items-center gap-1.5 w-20">
                  <Input
                    v-model="formData.grid.matrix.columns"
                    data-testid="input-grid-columns"
                    type="number"
                    min="1"
                    max="8"
                    class="h-8 text-xs font-mono text-right"
                  />
                </div>
              </div>

              <div class="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/50">
                <div>
                  <span class="font-medium text-foreground block text-xs">Rows</span>
                  <span class="text-muted-foreground text-[11px]">Vertical slots</span>
                </div>
                <div class="flex items-center gap-1.5 w-20">
                  <Input
                    v-model="formData.grid.matrix.rows"
                    data-testid="input-grid-rows"
                    type="number"
                    min="1"
                    max="8"
                    class="h-8 text-xs font-mono text-right"
                  />
                </div>
              </div>
            </div>

            <!-- Auto-Recycle -->
            <div class="flex items-center justify-between py-2 border-b border-border/50">
              <div>
                <span class="font-medium text-foreground block">Auto-Recycle Slots</span>
                <span class="text-muted-foreground text-[11px]">Reuse closed window positions for pending jobs</span>
              </div>
              <Switch
                :checked="formData.grid.behavior.auto_recycle_slots"
                @update:checked="formData.grid.behavior.auto_recycle_slots = $event"
              />
            </div>

            <!-- CDP Bounds -->
            <div class="flex items-center justify-between py-2">
              <div>
                <span class="font-medium text-foreground block">Enforce CDP Bounds</span>
                <span class="text-muted-foreground text-[11px]">Lock coordinates strictly via Chrome DevTools Protocol</span>
              </div>
              <Switch
                :checked="formData.grid.behavior.enforce_cdp_bounds"
                @update:checked="formData.grid.behavior.enforce_cdp_bounds = $event"
              />
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>

    <!-- Sticky Footer Bar -->
    <div class="sticky bottom-0 z-10 -mx-6 -mb-6 px-6 py-3 border-t border-border bg-card/95 backdrop-blur-sm flex items-center justify-between mt-auto">
      <div class="flex items-center gap-2 text-xs">
        <span v-if="isDirty" class="inline-flex items-center gap-1.5 text-amber-500 font-medium">
          <span class="size-2 rounded-full bg-amber-500 animate-pulse" />
          Unsaved changes
        </span>
        <span v-else-if="saveSuccess" class="inline-flex items-center gap-1.5 text-emerald-500 font-medium">
          <Check class="size-3.5" />
          Saved
        </span>
        <span v-else class="text-muted-foreground text-[11px]">
          All settings up to date
        </span>
      </div>

      <div class="flex items-center gap-2">
        <AutomaButton
          id="btn.settings.refresh"
          size="sm"
          variant="ghost"
          :loading="isLoading"
          :disabled="isSaving"
          @click="fetchSettings"
        >
          <RefreshCw class="size-3.5 mr-1" />
          <span>Reload</span>
        </AutomaButton>

        <AutomaButton
          id="btn.settings.save"
          size="sm"
          variant="default"
          :loading="isSaving"
          :disabled="!isDirty"
          @click="handleSave"
        >
          <Save class="size-3.5 mr-1" />
          <span>Save Changes</span>
        </AutomaButton>
      </div>
    </div>
  </div>
</template>
