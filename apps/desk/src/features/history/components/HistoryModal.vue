<script setup lang="ts">
import { History, X } from 'lucide-vue-next'
import { isHistoryModalOpen, useLayoutModals } from '../../../shared/composables/useLayoutModals'
import HistoryPanel from './HistoryPanel.vue'

const { closeHistoryModal } = useLayoutModals()

defineOptions({
  name: 'HistoryModal',
})
</script>

<template>
  <div
    v-if="isHistoryModalOpen"
    data-testid="modal-history"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm select-none animate-in fade-in duration-150"
    @click.self="closeHistoryModal"
  >
    <div
      class="w-full max-w-4xl max-h-[85vh] rounded-2xl bg-card border border-border text-foreground shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
    >
      <!-- Single Unified Header -->
      <div class="px-5 py-3 border-b border-border flex items-center justify-between bg-muted/40 shrink-0">
        <div class="flex items-center gap-2">
          <div class="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
            <History class="size-3.5" :stroke-width="2" />
          </div>
          <h3 class="text-sm font-semibold text-foreground tracking-tight">History</h3>
        </div>

        <button
          type="button"
          data-testid="btn-close-modal"
          class="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
          title="Close (Esc)"
          @click="closeHistoryModal"
        >
          <X class="size-4" :stroke-width="2" />
        </button>
      </div>

      <!-- History Table Body (showHeader=false eliminates double header, borderless=true eliminates nested card borders) -->
      <div class="flex-1 min-h-0 overflow-hidden flex flex-col">
        <HistoryPanel :show-header="false" :page-size="10" :borderless="true" />
      </div>
    </div>
  </div>
</template>
