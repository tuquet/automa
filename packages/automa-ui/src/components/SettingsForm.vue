<script setup lang="ts">
import type { AppSettings } from '@automa/types/api'
import { getAppSettings, patchAppSettings } from '@automa/types/api'
import { Check, Cpu, Globe, LayoutGrid, RefreshCw, Save, Sliders } from 'lucide-vue-next'
import { computed, onMounted, reactive, ref } from 'vue'
import AutomaButton from './AutomaButton.vue'
import { Badge } from './ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Switch } from './ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

export interface SettingsFormProps {
  initialSettings?: AppSettings | null
  autoFetch?: boolean
}

const props = withDefaults(defineProps<SettingsFormProps>(), {
  initialSettings: null,
  autoFetch: true,
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
  <div class="w-full flex flex-col space-y-6 text-foreground">
    <!-- Header Controls -->
    <div class="flex items-center justify-between pb-4 border-b border-border">
      <div class="flex items-center gap-3">
        <div class="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
          <Sliders class="size-5" :stroke-width="2" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h2 class="text-base font-bold tracking-tight">Core Engine Settings</h2>
            <Badge v-if="isDirty" variant="warning">
              Unsaved Changes
            </Badge>
            <Badge v-else-if="saveSuccess" variant="success" class="flex items-center gap-1">
              <Check class="size-3" /> Saved
            </Badge>
          </div>
          <p class="text-xs text-muted-foreground mt-0.5">
            Configure execution runner, anti-detect browser defaults, and multi-window matrix.
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <AutomaButton
          id="btn.settings.refresh"
          size="sm"
          variant="outline"
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

    <!-- Error Banner -->
    <div
      v-if="errorMessage"
      class="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-destructive text-xs font-medium"
    >
      {{ errorMessage }}
    </div>

    <!-- Settings Tabs -->
    <Tabs v-model="activeTab" class="w-full space-y-4">
      <TabsList class="grid grid-cols-3 w-full max-w-md">
        <TabsTrigger value="browser" class="flex items-center gap-1.5 text-xs">
          <Globe class="size-3.5" />
          <span>Browser</span>
        </TabsTrigger>
        <TabsTrigger value="runner" class="flex items-center gap-1.5 text-xs">
          <Cpu class="size-3.5" />
          <span>Runner</span>
        </TabsTrigger>
        <TabsTrigger value="grid" class="flex items-center gap-1.5 text-xs">
          <LayoutGrid class="size-3.5" />
          <span>Matrix Grid</span>
        </TabsTrigger>
      </TabsList>

      <!-- TAB 1: BROWSER SETTINGS -->
      <TabsContent value="browser" class="space-y-4 pt-1">
        <Card>
          <CardHeader>
            <CardTitle class="text-sm font-semibold">Anti-Detect Browser Defaults</CardTitle>
            <CardDescription class="text-xs">
              Default Chromium engine options used when launching automation workflows.
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-4 text-xs">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="font-medium text-foreground">Default Browser Engine</label>
                <select
                  v-model="formData.browser.default_type"
                  disabled
                  class="flex h-8 w-full rounded-md border border-input bg-muted px-2.5 py-1 text-xs text-muted-foreground shadow-2xs cursor-not-allowed"
                >
                  <option value="chromium">Chromium (Built-in Anti-Detect)</option>
                </select>
                <p class="text-[11px] text-muted-foreground">The system is locked to Chromium engine for Phase 1 to guarantee anti-detect stability.</p>
              </div>

              <div class="space-y-1.5">
                <label class="font-medium text-foreground">Custom Executable Path</label>
                <Input
                  v-model="formData.browser.executable_path"
                  placeholder="e.g. C:\Program Files\Google\Chrome\Application\chrome.exe"
                />
                <p class="text-[11px] text-muted-foreground">Leave empty to use automatic system binary detection.</p>
              </div>
            </div>

            <div class="pt-2 border-t border-border space-y-1.5">
              <label class="font-medium text-foreground">Default User Agent Override</label>
              <Input
                v-model="formData.browser.default_user_agent"
                placeholder="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36..."
              />
              <p class="text-[11px] text-muted-foreground">Global User-Agent string applied if not overridden by browser profile.</p>
            </div>

            <div class="pt-2 border-t border-border flex items-center justify-between">
              <div>
                <span class="font-medium text-foreground block">Headless Mode</span>
                <span class="text-[11px] text-muted-foreground">Run browser instances in the background without opening GUI windows.</span>
              </div>
              <Switch
                :checked="formData.browser.headless"
                @update:checked="formData.browser.headless = $event"
              />
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <!-- TAB 2: RUNNER SETTINGS -->
      <TabsContent value="runner" class="space-y-4 pt-1">
        <Card>
          <CardHeader>
            <CardTitle class="text-sm font-semibold">Execution Engine & Concurrency</CardTitle>
            <CardDescription class="text-xs">
              Configure concurrent workflow job pool and execution timeouts.
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-4 text-xs">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div class="space-y-1.5">
                <label class="font-medium text-foreground">Max Concurrent Jobs</label>
                <Input
                  v-model="formData.runner.max_concurrent_jobs"
                  type="number"
                  min="1"
                  max="32"
                />
                <p class="text-[11px] text-muted-foreground">Maximum simultaneous automation jobs (1-32).</p>
              </div>

              <div class="space-y-1.5">
                <label class="font-medium text-foreground">Job Timeout (ms)</label>
                <Input
                  v-model="formData.runner.timeout_ms"
                  type="number"
                  min="1000"
                  step="1000"
                />
                <p class="text-[11px] text-muted-foreground">Kill runaway execution after specified milliseconds.</p>
              </div>

              <div class="space-y-1.5">
                <label class="font-medium text-foreground">History Retention (Days)</label>
                <Input
                  v-model="formData.runner.auto_clean_history_days"
                  type="number"
                  min="1"
                  max="365"
                />
                <p class="text-[11px] text-muted-foreground">Auto-purge telemetry logs older than N days.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <!-- TAB 3: MATRIX & GRID SETTINGS -->
      <TabsContent value="grid" class="space-y-4 pt-1">
        <Card>
          <CardHeader>
            <CardTitle class="text-sm font-semibold">Campaign Matrix Grid Layout</CardTitle>
            <CardDescription class="text-xs">
              Automatic window tiling and screen partition for multi-browser campaign execution.
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-4 text-xs">
            <div class="flex items-center justify-between pb-3 border-b border-border">
              <div>
                <span class="font-medium text-foreground block">Enable Auto-Grid Tiling</span>
                <span class="text-[11px] text-muted-foreground">Arrange launched browser windows automatically across screen coordinates.</span>
              </div>
              <Switch
                :checked="formData.grid.enabled"
                @update:checked="formData.grid.enabled = $event"
              />
            </div>

            <div v-if="formData.grid.enabled" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-1.5">
                  <label class="font-medium text-foreground">Matrix Columns</label>
                  <Input
                    v-model="formData.grid.matrix.columns"
                    type="number"
                    min="1"
                    max="8"
                  />
                  <p class="text-[11px] text-muted-foreground">Number of horizontal slots across display.</p>
                </div>

                <div class="space-y-1.5">
                  <label class="font-medium text-foreground">Matrix Rows</label>
                  <Input
                    v-model="formData.grid.matrix.rows"
                    type="number"
                    min="1"
                    max="8"
                  />
                  <p class="text-[11px] text-muted-foreground">Number of vertical slots per column.</p>
                </div>
              </div>

              <div class="pt-2 border-t border-border flex items-center justify-between">
                <div>
                  <span class="font-medium text-foreground block">Auto-Recycle Slots</span>
                  <span class="text-[11px] text-muted-foreground">Reuse finished grid slots for next scheduled campaign browser.</span>
                </div>
                <Switch
                  :checked="formData.grid.behavior.auto_recycle_slots"
                  @update:checked="formData.grid.behavior.auto_recycle_slots = $event"
                />
              </div>

              <div class="flex items-center justify-between">
                <div>
                  <span class="font-medium text-foreground block">Enforce CDP Bounds</span>
                  <span class="text-[11px] text-muted-foreground">Lock Chromium window viewport coordinates strictly via Chrome DevTools Protocol.</span>
                </div>
                <Switch
                  :checked="formData.grid.behavior.enforce_cdp_bounds"
                  @update:checked="formData.grid.behavior.enforce_cdp_bounds = $event"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
</template>
