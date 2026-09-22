<script setup lang="ts">
import { SettingsForm } from '@automa/ui'
import { Sliders, X } from 'lucide-vue-next'
import { isSettingsModalOpen, useLayoutModals } from '../../../shared/composables/useLayoutModals'

const { closeSettingsModal } = useLayoutModals()

defineOptions({
  name: 'SettingsModal',
})
</script>

<template>
  <div
    v-if="isSettingsModalOpen"
    data-testid="modal-settings"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm select-none animate-in fade-in duration-150"
    @click.self="closeSettingsModal"
  >
    <div
      class="w-full max-w-2xl max-h-[85vh] rounded-2xl bg-card border border-border text-foreground shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
    >
      <!-- Single Unified Modal Header -->
      <div class="px-5 py-3 border-b border-border flex items-center justify-between bg-muted/40 shrink-0">
        <div class="flex items-center gap-2">
          <Sliders class="size-4 text-primary" :stroke-width="2" />
          <h3 class="text-sm font-semibold text-foreground tracking-tight">Core Engine Settings</h3>
        </div>

        <button
          type="button"
          data-testid="btn-close-modal"
          class="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition cursor-pointer"
          title="Close (Esc)"
          @click="closeSettingsModal"
        >
          <X class="size-4" :stroke-width="2" />
        </button>
      </div>

      <!-- Settings Body -->
      <div class="flex-1 overflow-y-auto p-6 flex flex-col">
        <!-- Reusable Full Settings Form from @automa/ui -->
        <SettingsForm :show-header="false" />
      </div>
    </div>
  </div>
</template>
