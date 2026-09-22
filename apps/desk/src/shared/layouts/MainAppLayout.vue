<script setup lang="ts">
import { ref } from 'vue'
import { RouterView } from 'vue-router'
import BrowserQuickPickModal from '../../features/browsers/components/BrowserQuickPickModal.vue'
import BrowserResolverModal from '../../features/browsers/components/BrowserResolverModal.vue'
import BrowsersModal from '../../features/browsers/components/BrowsersModal.vue'
import CommandPaletteDialog from '../../features/command-palette/components/CommandPaletteDialog.vue'
import HistoryModal from '../../features/history/components/HistoryModal.vue'
import SettingsModal from '../../features/settings/components/SettingsModal.vue'
import StorageModal from '../../features/storage/components/StorageModal.vue'
import { useStudioStore } from '../../features/studio/stores/useStudioStore'
import AppTitleBar from '../components/AppTitleBar.vue'

const isPaletteOpen = ref(false)
const studioStore = useStudioStore()
</script>

<template>
  <div
    data-testid="layout-main-app"
    class="h-screen w-screen flex flex-col bg-background text-foreground overflow-hidden font-sans"
  >
    <!-- Top Frameless Titlebar -->
    <AppTitleBar
      :title="studioStore.workflow?.name || 'New Workflow'"
      :is-dirty="studioStore.isDirty"
      @open-palette="isPaletteOpen = true"
    />

    <!-- Main Body: Dynamic Viewport (Edge-to-Edge Canvas) -->
    <div
      data-testid="layout-viewport"
      class="flex-1 flex overflow-hidden relative"
    >
      <main
        data-testid="layout-main-content"
        class="flex-1 w-full h-full flex flex-col overflow-hidden relative"
      >
        <RouterView v-slot="{ Component }">
          <Transition name="fade" mode="out-in">
            <component :is="Component" />
          </Transition>
        </RouterView>
      </main>
    </div>

    <!-- Command Palette (Ctrl+K) -->
    <CommandPaletteDialog v-model:is-open="isPaletteOpen" />

    <!-- Browser Resolution Waterfall Modals (SRS Section 2.1) -->
    <BrowserQuickPickModal />
    <BrowserResolverModal />

    <!-- All-In-One Feature Popup Modals -->
    <BrowsersModal />
    <StorageModal />
    <HistoryModal />
    <SettingsModal />
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.1s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
