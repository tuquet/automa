<script setup lang="ts">
import { Database, X } from 'lucide-vue-next'
import { isStorageModalOpen, useLayoutModals } from '../../../shared/composables/useLayoutModals'
import StoragePanel from './StoragePanel.vue'

const { closeStorageModal } = useLayoutModals()

defineOptions({
  name: 'StorageModal',
})
</script>

<template>
  <div
    v-if="isStorageModalOpen"
    data-testid="modal-storage"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm select-none animate-in fade-in duration-150"
    @click.self="closeStorageModal"
  >
    <div
      class="w-full max-w-4xl max-h-[85vh] rounded-2xl bg-card border border-border text-foreground shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
    >
      <!-- Single Unified Header -->
      <div class="px-5 py-3 border-b border-border flex items-center justify-between bg-muted/40 shrink-0">
        <div class="flex items-center gap-2">
          <div class="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
            <Database class="size-3.5" :stroke-width="2" />
          </div>
          <h3 class="text-sm font-semibold text-foreground tracking-tight">Storage</h3>
        </div>

        <button
          type="button"
          data-testid="btn-close-modal"
          class="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
          title="Close (Esc)"
          @click="closeStorageModal"
        >
          <X class="size-4" :stroke-width="2" />
        </button>
      </div>

      <!-- Storage Body (showHeader=false eliminates double header) -->
      <div class="flex-1 overflow-hidden p-4">
        <StoragePanel :show-header="false" :page-size="10" />
      </div>
    </div>
  </div>
</template>
