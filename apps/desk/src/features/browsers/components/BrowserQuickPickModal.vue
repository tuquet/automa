<script setup lang="ts">
import { Globe, Star, X } from 'lucide-vue-next'
import { ref } from 'vue'
import {
  cachedBrowsers,
  isQuickPickOpen,
  useBrowserWaterfall,
} from '../composables/useBrowserWaterfall'

defineOptions({
  name: 'BrowserQuickPickModal',
})

const { finishResolution, cancelResolution } = useBrowserWaterfall()

const selectedId = ref<string>('')
const setAsDefault = ref<boolean>(true)

function onSelect(browserId: string) {
  selectedId.value = browserId
  finishResolution(browserId, setAsDefault.value)
}
</script>

<template>
  <div
    v-if="isQuickPickOpen"
    data-testid="browser-quickpick-modal"
    class="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 backdrop-blur-md select-none animate-in fade-in zoom-in-95 duration-150"
    @click.self="cancelResolution"
  >
    <div class="w-full max-w-md rounded-2xl bg-card text-card-foreground border border-border shadow-2xl overflow-hidden p-5 space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-border pb-3">
        <h2 class="font-semibold text-sm text-foreground tracking-tight">Select Browser</h2>
        <button
          type="button"
          data-testid="btn-close-quickpick"
          class="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition active:scale-95 cursor-pointer"
          title="Close (Esc)"
          @click="cancelResolution"
        >
          <X class="size-4" :stroke-width="2" />
        </button>
      </div>

      <!-- Browser Selector List -->
      <div class="max-h-60 overflow-y-auto space-y-1.5 pr-1">
        <button
          v-for="p in cachedBrowsers"
          :key="p.id"
          type="button"
          :data-testid="`btn-quickpick-browser-${p.id}`"
          class="w-full flex items-center justify-between p-2.5 rounded-xl border border-border/60 hover:border-primary/50 hover:bg-muted/40 transition active:scale-[0.99] text-left group cursor-pointer"
          @click="onSelect(p.id)"
        >
          <div class="flex items-center gap-2.5">
            <div class="p-2 rounded-lg bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Globe class="size-4" :stroke-width="1.8" />
            </div>
            <div>
              <p class="text-sm font-semibold text-foreground group-hover:text-primary tracking-tight">
                {{ p.name }}
              </p>
              <p v-if="p.id !== p.name" class="text-xs text-muted-foreground font-mono">{{ p.id }}</p>
            </div>
          </div>
        </button>
      </div>

      <!-- Remember as Default Option -->
      <div class="flex items-center justify-between pt-2 border-t border-border text-xs">
        <label class="flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground transition select-none">
          <input
            v-model="setAsDefault"
            type="checkbox"
            data-testid="checkbox-set-default-browser"
            class="rounded border-border text-primary focus:ring-primary size-3.5"
          />
          <span class="flex items-center gap-1">
            <span>Set as default</span>
            <Star class="size-3 text-amber-500 fill-amber-500" />
          </span>
        </label>

        <button
          type="button"
          data-testid="btn-cancel-quickpick"
          class="text-xs text-muted-foreground hover:text-foreground transition font-medium cursor-pointer"
          @click="cancelResolution"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</template>
