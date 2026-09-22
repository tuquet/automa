<script setup lang="ts">
import { AlertTriangle, ArrowLeft, DownloadCloud, Plus } from 'lucide-vue-next'
import { ref } from 'vue'
import { isResolverModalOpen, useBrowserWaterfall } from '../composables/useBrowserWaterfall'

defineOptions({
  name: 'BrowserResolverModal',
})

const { handleAutoDetect, handleCreateCustom, cancelResolution } = useBrowserWaterfall()

const customName = ref('')
const isCustomMode = ref(false)
const isProcessing = ref(false)

async function onAutoDetect() {
  isProcessing.value = true
  await handleAutoDetect()
  isProcessing.value = false
}

async function onCreateCustom() {
  if (!customName.value.trim()) return
  isProcessing.value = true
  await handleCreateCustom(customName.value)
  isProcessing.value = false
}
</script>

<template>
  <div
    v-if="isResolverModalOpen"
    data-testid="browser-resolver-modal"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md select-none animate-in fade-in zoom-in-95 duration-150"
  >
    <div class="w-full max-w-md rounded-2xl bg-card text-card-foreground border border-border shadow-2xl overflow-hidden p-6 space-y-6">
      <!-- Header -->
      <div class="space-y-1.5">
        <div class="flex items-center gap-2.5 text-amber-600 dark:text-amber-400">
          <div class="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle class="size-4" :stroke-width="2" />
          </div>
          <h2 class="font-semibold text-sm text-foreground tracking-tight">No Browser</h2>
        </div>
      </div>

      <!-- Action Options -->
      <div v-if="!isCustomMode" class="space-y-3">
        <!-- Primary Action: Provision Standalone Chromium Browser -->
        <button
          type="button"
          data-testid="btn-autodetect-browsers"
          :disabled="isProcessing"
          class="w-full flex items-center gap-3 p-3 rounded-xl border border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20 hover:border-emerald-500 hover:bg-emerald-100/50 dark:hover:bg-emerald-950/40 text-left transition-all group cursor-pointer active:scale-[0.99] shadow-xs"
          @click="onAutoDetect"
        >
          <div class="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
            <DownloadCloud class="size-4" :stroke-width="2" />
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-xs font-semibold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 tracking-tight">
              Install Chromium
            </h3>
          </div>
        </button>

        <!-- Secondary Option: Create Custom Browser -->
        <button
          type="button"
          data-testid="btn-create-browser"
          :disabled="isProcessing"
          class="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-accent hover:bg-accent/40 text-left transition-all group cursor-pointer active:scale-[0.99]"
          @click="isCustomMode = true"
        >
          <div class="p-2 rounded-lg bg-muted text-muted-foreground group-hover:scale-105 transition-transform shrink-0">
            <Plus class="size-4" :stroke-width="2" />
          </div>
          <div class="flex-1 min-w-0">
            <h3 class="text-xs font-semibold text-foreground tracking-tight">
              Custom Profile
            </h3>
          </div>
        </button>
      </div>

      <!-- Custom Browser Form -->
      <div v-else class="space-y-4">
        <div class="space-y-1.5">
          <label for="custom-name-input" class="text-xs font-semibold text-muted-foreground">Profile Name</label>
          <input
            id="custom-name-input"
            v-model="customName"
            type="text"
            data-testid="input-custom-browser-name"
            placeholder="Profile name..."
            class="w-full px-3 py-2 text-xs rounded-lg bg-muted/50 border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary shadow-2xs"
            autofocus
          />
        </div>

        <div class="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            data-testid="btn-cancel-custom-mode"
            class="flex items-center gap-1 px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground rounded-lg transition active:scale-95 cursor-pointer font-medium"
            @click="isCustomMode = false"
          >
            <ArrowLeft class="size-3.5" :stroke-width="2" />
            <span>Back</span>
          </button>
          <button
            type="button"
            data-testid="btn-submit-custom-browser"
            :disabled="!customName.trim() || isProcessing"
            class="px-4 py-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 rounded-lg transition active:scale-95 shadow-xs cursor-pointer"
            @click="onCreateCustom"
          >
            Create & Continue
          </button>
        </div>
      </div>

      <!-- Footer Cancel -->
      <div class="flex items-center justify-end pt-2 border-t border-border">
        <button
          type="button"
          data-testid="btn-cancel-resolver"
          class="px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition cursor-pointer"
          @click="cancelResolution"
        >
          Cancel Execution
        </button>
      </div>
    </div>
  </div>
</template>
