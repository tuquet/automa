<script setup lang="ts">
import { Button, Popover, PopoverContent, PopoverTrigger } from '@automa/ui'
import { useClipboard } from '@vueuse/core'
import {
  Activity,
  Check,
  ChevronDown,
  Copy,
  Cpu,
  Database,
  ExternalLink,
  Globe,
  Radio,
  RefreshCw,
  Server,
} from 'lucide-vue-next'
import { ref } from 'vue'
import { DAEMON_BASE_URL, DAEMON_DOCS_URL, STUDIO_EMBED_URL } from '../../core/constants/daemon'
import { useDaemonHealth } from '../composables/useDaemonHealth'

defineOptions({
  name: 'DaemonStatusPill',
})

const { isHealthy, version, checkHealth } = useDaemonHealth()

const isChecking = ref(false)
const popoverOpen = ref(false)

const { copy, copied } = useClipboard()

async function handleRefresh() {
  isChecking.value = true
  try {
    await checkHealth()
  } finally {
    isChecking.value = false
  }
}

async function openExternalUrl(url: string) {
  try {
    const { openUrl } = await import('@tauri-apps/plugin-opener')
    await openUrl(url)
  } catch {
    window.open(url, '_blank')
  }
}
</script>

<template>
  <Popover v-model:open="popoverOpen">
    <PopoverTrigger as-child>
      <button
        type="button"
        data-testid="daemon-status-pill"
        class="no-drag inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all cursor-pointer select-none shadow-2xs hover:shadow-xs active:scale-95"
        :class="{
          'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/15':
            isHealthy,
          'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25 hover:bg-rose-500/15':
            isHealthy === false,
          'bg-muted/80 text-muted-foreground border-border hover:bg-accent':
            isHealthy === null,
        }"
        :title="
          isHealthy
            ? `Automa Core Active (v${version || '1.0.0'}) - Click to view full topology`
            : isHealthy === false
              ? 'Automa Core Offline - Click to inspect'
              : 'Connecting to Automa Core...'
        "
      >
        <span
          class="size-1.5 rounded-full shrink-0"
          :class="{
            'bg-emerald-500 animate-pulse': isHealthy,
            'bg-rose-500': isHealthy === false,
            'bg-muted-foreground/60': isHealthy === null,
          }"
        />
        <span class="font-medium tracking-tight">
          {{ isHealthy ? 'Online' : isHealthy === false ? 'Offline' : 'Connecting...' }}
        </span>
        <ChevronDown class="size-3 opacity-60 ml-0.5" />
      </button>
    </PopoverTrigger>

    <PopoverContent
      align="end"
      :side-offset="8"
      class="w-80 sm:w-92 p-4 bg-card border-border shadow-2xl rounded-2xl text-foreground text-xs space-y-3.5 animate-in zoom-in-95 duration-150"
    >
      <!-- Header -->
      <div class="flex items-start justify-between gap-2 pb-3 border-b border-border">
        <div class="flex items-center gap-2.5">
          <div class="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
            <Server class="size-4.5" :stroke-width="2" />
          </div>
          <div>
            <h4 class="font-bold text-sm tracking-tight text-foreground">Automa Core</h4>
            <p class="text-xs text-muted-foreground font-mono">Rust Engine • v{{ version || '1.0.0' }}</p>
          </div>
        </div>

        <span
          class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold shrink-0"
          :class="
            isHealthy
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
          "
        >
          <span class="size-1.5 rounded-full" :class="isHealthy ? 'bg-emerald-500' : 'bg-rose-500'" />
          {{ isHealthy ? 'Active' : 'Offline' }}
        </span>
      </div>

      <!-- Network & Endpoints -->
      <div class="space-y-2">
        <div class="flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <span>Network & Topology</span>
          <span class="font-mono text-xs text-muted-foreground/80">Port 8765</span>
        </div>

        <div class="space-y-1.5">
          <!-- REST API -->
          <div class="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/60 hover:border-border transition">
            <div class="flex items-center gap-2 min-w-0">
              <Activity class="size-3.5 text-primary shrink-0" />
              <div class="min-w-0">
                <p class="text-xs text-muted-foreground font-medium">REST API</p>
                <p class="font-mono text-xs text-foreground truncate select-all">{{ DAEMON_BASE_URL }}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              data-testid="btn-copy-rest-url"
              class="shrink-0 text-muted-foreground hover:text-foreground cursor-pointer"
              :title="copied ? 'Copied!' : 'Copy REST URL'"
              @click="copy(DAEMON_BASE_URL)"
            >
              <Check v-if="copied" class="size-3 text-emerald-500" />
              <Copy v-else class="size-3" />
            </Button>
          </div>

          <!-- Web Studio Mount -->
          <div class="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/60 hover:border-border transition">
            <div class="flex items-center gap-2 min-w-0 pr-2">
              <Globe class="size-3.5 text-primary shrink-0" />
              <div class="min-w-0">
                <p class="text-xs text-muted-foreground font-medium">Web Studio</p>
                <p class="font-mono text-xs text-foreground truncate">{{ STUDIO_EMBED_URL }}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              data-testid="btn-open-studio-external"
              class="shrink-0 text-muted-foreground hover:text-foreground cursor-pointer"
              title="Open Web Studio in External Browser"
              @click="openExternalUrl(STUDIO_EMBED_URL)"
            >
              <ExternalLink class="size-3" />
            </Button>
          </div>

          <!-- WebSocket & SSE Channels -->
          <div class="grid grid-cols-2 gap-1.5 text-xs">
            <div class="p-2 rounded-lg bg-muted/40 border border-border/60 flex items-center justify-between">
              <div class="flex items-center gap-1.5 text-muted-foreground truncate">
                <Cpu class="size-3 text-primary shrink-0" />
                <span class="truncate">WebSocket</span>
              </div>
              <span class="font-medium font-mono text-xs text-emerald-500">2-Way</span>
            </div>

            <div class="p-2 rounded-lg bg-muted/40 border border-border/60 flex items-center justify-between">
              <div class="flex items-center gap-1.5 text-muted-foreground truncate">
                <Radio class="size-3 text-primary shrink-0" />
                <span class="truncate">SSE Events</span>
              </div>
              <span class="font-medium font-mono text-xs text-emerald-500">Live</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Runtime Invariants -->
      <div class="space-y-1.5 pt-1">
        <div class="flex items-center justify-between text-xs font-semibold text-muted-foreground">
          <span>Runtime Invariants</span>
          <span class="font-mono text-xs text-muted-foreground/80">Phase 1</span>
        </div>
        <div class="p-2 rounded-lg bg-muted/30 border border-border/50 text-xs space-y-1">
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground flex items-center gap-1.5">
              <Globe class="size-3 text-muted-foreground/70" />
              Chromium Runtime
            </span>
            <span class="font-medium text-foreground">Dedicated (Isolated)</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground flex items-center gap-1.5">
              <Database class="size-3 text-muted-foreground/70" />
              Database Storage
            </span>
            <span class="font-medium text-foreground">SQLite-First</span>
          </div>
        </div>
      </div>

      <!-- Quick Actions Footer -->
      <div class="pt-2 border-t border-border flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          data-testid="btn-ping-core"
          class="flex-1 gap-1.5 h-7 text-xs border-border cursor-pointer"
          :disabled="isChecking"
          @click="handleRefresh"
        >
          <RefreshCw class="size-3" :class="{ 'animate-spin': isChecking }" />
          <span>{{ isChecking ? 'Pinging...' : 'Ping Core' }}</span>
        </Button>

        <Button
          variant="secondary"
          size="sm"
          data-testid="btn-open-api-docs"
          class="flex-1 gap-1.5 h-7 text-xs cursor-pointer"
          title="Open Swagger OpenAPI Documentation"
          @click="openExternalUrl(DAEMON_DOCS_URL)"
        >
          <span>OpenAPI Docs</span>
          <ExternalLink class="size-3" />
        </Button>
      </div>
    </PopoverContent>
  </Popover>
</template>
