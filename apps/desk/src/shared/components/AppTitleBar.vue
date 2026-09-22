<script setup lang="ts">
import { Minus, Moon, Search, Square, Sun, X } from 'lucide-vue-next'
import { useDarkMode } from '../../composables/useDarkMode'
import {
  closeWindow,
  minimizeWindow,
  toggleMaximizeWindow,
} from '../../infrastructure/tauri/window'
import DaemonStatusPill from './DaemonStatusPill.vue'

defineProps<{
  title?: string
  isDirty?: boolean
}>()

defineEmits<(e: 'open-palette') => void>()

const { isDark, toggleDark } = useDarkMode()
</script>

<template>
  <header
    data-tauri-drag-region
    data-testid="layout-app-titlebar"
    class="h-10 w-full select-none bg-card/90 backdrop-blur-md border-b border-border flex items-center justify-between px-3 text-sm font-medium text-foreground z-40 transition-colors"
    @dblclick="toggleMaximizeWindow"
  >
    <!-- Left: App Branding & Active Context -->
    <div
      data-testid="titlebar-branding"
      class="flex items-center gap-2 pointer-events-none"
    >
      <div class="size-5 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center p-0.5 shadow-xs">
        <img src="/icon.svg" alt="Automa" class="size-3.5" />
      </div>
      <span class="font-bold text-foreground tracking-tight text-sm">Automa Desk</span>
      <span class="text-muted-foreground font-mono text-xs truncate max-w-[220px] font-medium flex items-center gap-1">
        <span>{{ title || 'Untitled' }}</span>
        <span v-if="isDirty" class="size-1.5 rounded-full bg-amber-500 shrink-0" title="Unsaved changes" />
      </span>
    </div>

    <!-- Center: Search & Command Palette Trigger (Pill Style) -->
    <button
      type="button"
      data-testid="btn-command-palette"
      class="no-drag flex items-center gap-2 px-3 py-1 rounded-full bg-muted/80 hover:bg-accent border border-border text-muted-foreground hover:text-foreground transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.98]"
      title="Search (Ctrl+K)"
      @click="$emit('open-palette')"
    >
      <Search class="size-3.5 text-muted-foreground" :stroke-width="2" />
      <span class="text-sm font-medium tracking-tight">Search...</span>
      <kbd class="ml-1 px-1.5 py-0.2 rounded bg-background/80 border border-border text-xs font-mono text-muted-foreground shadow-2xs">Ctrl+K</kbd>
    </button>

    <!-- Right: Daemon Status, Theme Toggle & Native Window Controls -->
    <div
      data-testid="titlebar-actions"
      class="flex items-center gap-1.5 no-drag"
    >
      <!-- Daemon Interactive Status Pill -->
      <DaemonStatusPill class="hidden sm:inline-flex" />

      <!-- Theme Switcher -->
      <button
        type="button"
        data-testid="btn-toggle-theme"
        class="no-drag p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition active:scale-95 cursor-pointer"
        :title="isDark ? 'Light' : 'Dark'"
        @click="toggleDark()"
      >
        <Sun v-if="isDark" class="size-3.5 text-amber-400" :stroke-width="2" />
        <Moon v-else class="size-3.5 text-foreground" :stroke-width="2" />
      </button>

      <div class="h-4 w-px bg-border mx-1"></div>

      <!-- Native Window Controls -->
      <div
        data-testid="titlebar-window-controls"
        class="flex items-center gap-0.5"
      >
        <button
          type="button"
          data-testid="btn-window-minimize"
          class="no-drag p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition active:scale-95 cursor-pointer"
          title="Minimize"
          @click="minimizeWindow"
        >
          <Minus class="size-3.5" :stroke-width="2" />
        </button>

        <button
          type="button"
          data-testid="btn-window-maximize"
          class="no-drag p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition active:scale-95 cursor-pointer"
          title="Maximize / Restore"
          @click="toggleMaximizeWindow"
        >
          <Square class="size-3.5" :stroke-width="2" />
        </button>

        <button
          type="button"
          data-testid="btn-window-close"
          class="no-drag p-1.5 rounded-md hover:bg-destructive hover:text-destructive-foreground text-muted-foreground transition active:scale-95 cursor-pointer"
          title="Close"
          @click="closeWindow"
        >
          <X class="size-3.5" :stroke-width="2" />
        </button>
      </div>
    </div>
  </header>
</template>
