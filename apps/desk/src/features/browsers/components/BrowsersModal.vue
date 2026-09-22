<script setup lang="ts">
import { Globe, X } from 'lucide-vue-next'
import { isBrowsersModalOpen, useLayoutModals } from '../../../shared/composables/useLayoutModals'
import BrowsersPanel from './BrowsersPanel.vue'

const { closeBrowsersModal } = useLayoutModals()

defineOptions({
  name: 'BrowsersModal',
})
</script>

<template>
  <div
    v-if="isBrowsersModalOpen"
    data-testid="modal-browsers"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm select-none animate-in fade-in duration-150"
    @click.self="closeBrowsersModal"
  >
    <div
      class="w-full max-w-4xl max-h-[85vh] rounded-2xl bg-card border border-border text-foreground shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
    >
      <!-- Single Unified Header -->
      <div class="px-5 py-3 border-b border-border flex items-center justify-between bg-muted/40 shrink-0">
        <div class="flex items-center gap-2">
          <div class="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
            <Globe class="size-3.5" :stroke-width="2" />
          </div>
          <h3 class="text-xs font-semibold text-foreground tracking-tight">Browsers</h3>
        </div>

        <button
          type="button"
          data-testid="btn-close-modal"
          class="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
          title="Close (Esc)"
          @click="closeBrowsersModal"
        >
          <X class="size-4" :stroke-width="2" />
        </button>
      </div>

      <!-- Browsers Table Body (showHeader=false eliminates double header) -->
      <div class="flex-1 overflow-hidden p-4">
        <BrowsersPanel :show-header="false" :page-size="10" />
      </div>
    </div>
  </div>
</template>
