<template>
  <div class="relative inline-flex items-center">
    <button
      data-testid="btn-automa-core-status"
      class="px-2 py-1 text-xs font-medium rounded-lg border flex items-center space-x-1.5 transition-colors shadow-xs"
      :class="statusClasses"
      :title="tooltipText"
      @click="toggleMetricsPopover"
    >
      <!-- Status LED Dot Indicator (Green when online, Red when offline, Amber when checking) -->
      <span class="relative flex h-2 w-2">
        <span
          v-if="state.status === 'online'"
          class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
        ></span>
        <span
          class="relative inline-flex rounded-full h-2 w-2"
          :class="dotClasses"
        ></span>
      </span>

      <span
        v-if="state.status === 'online' && state.latency > 0"
        class="text-xs opacity-80 hidden sm:inline font-mono"
      >
        {{ state.latency }}ms
      </span>
    </button>

    <!-- Telemetry Popover (When Online) -->
    <div
      v-if="showPopover && state.status === 'online'"
      class="absolute right-0 top-9 w-64 p-3 rounded-xl border border-border bg-card text-card-foreground shadow-xl z-50 text-xs space-y-2.5 animate-in fade-in zoom-in-95 duration-100"
    >
      <div
        class="flex items-center justify-between border-b border-border pb-1.5"
      >
        <span class="font-semibold text-foreground flex items-center">
          <v-remixicon
            name="riComputerLine"
            size="14"
            class="mr-1 text-emerald-500"
          />
          Automa Core Telemetry
        </span>
        <span
          class="text-xs font-mono text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded-full"
        >
          Online
        </span>
      </div>

      <div class="space-y-1.5 text-muted-foreground">
        <div class="flex justify-between items-center">
          <span>Daemon Host:</span>
          <span class="font-mono text-xs text-foreground">{{
            state.baseUrl
          }}</span>
        </div>

        <div class="flex justify-between items-center">
          <span>Ping Latency:</span>
          <span class="font-mono text-xs text-foreground"
            >{{ state.latency }} ms</span
          >
        </div>

        <div v-if="metrics" class="flex justify-between items-center">
          <span>CPU Usage:</span>
          <span class="font-mono text-xs font-medium text-foreground">
            {{ (metrics.cpu_usage_pct || 0).toFixed(1) }}%
          </span>
        </div>

        <div v-if="metrics" class="flex justify-between items-center">
          <span>Memory RSS:</span>
          <span class="font-mono text-xs font-medium text-foreground">
            {{
              (metrics.memory_rss_bytes
                ? metrics.memory_rss_bytes / 1024 / 1024
                : 0
              ).toFixed(1)
            }}
            MB
          </span>
        </div>

        <div v-if="metrics" class="flex justify-between items-center">
          <span>Active Runners:</span>
          <span class="font-mono text-xs font-medium text-accent">
            {{ metrics.active_runners_count || 0 }}
          </span>
        </div>
      </div>

      <div
        class="pt-1 border-t border-border flex items-center justify-between text-xs"
      >
        <a
          href="http://127.0.0.1:8765/swagger-ui"
          target="_blank"
          class="text-accent hover:underline flex items-center space-x-0.5"
        >
          <span>Swagger UI</span>
          <v-remixicon name="riExternalLinkLine" size="10" />
        </a>

        <a
          href="http://127.0.0.1:8767"
          target="_blank"
          class="text-accent hover:underline flex items-center space-x-0.5"
        >
          <span>Scalar Docs</span>
          <v-remixicon name="riExternalLinkLine" size="10" />
        </a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useAutomaCoreHealth } from '@/composable/useAutomaCoreHealth';
import { fetchSystemMetrics } from '@/studio/services/storage.service';
import { useToast } from 'vue-toastification';

const { state, checkHealth, initEventStream, closeEventStream } =
  useAutomaCoreHealth();
const toast = useToast();

const showPopover = ref(false);
const metrics = ref(null);
let metricsInterval = null;

async function loadMetrics() {
  if (state.status === 'online') {
    metrics.value = await fetchSystemMetrics();
  }
}

async function handleStatusClick() {
  await checkHealth();
  if (state.status === 'online') {
    toast.success(`automa-core: connected (${state.latency}ms)`);
  }
}

function toggleMetricsPopover() {
  if (state.status === 'online') {
    showPopover.value = !showPopover.value;
    if (showPopover.value) loadMetrics();
  } else {
    handleStatusClick();
  }
}

onMounted(() => {
  initEventStream();
  checkHealth();
  metricsInterval = setInterval(loadMetrics, 6000);
});

onUnmounted(() => {
  closeEventStream();
  if (metricsInterval) clearInterval(metricsInterval);
});

const tooltipText = computed(() => {
  if (state.status === 'online') {
    const browsersCount = state.browsers?.length || 0;
    return `automa-core: Online (${state.baseUrl}) | Latency: ${state.latency}ms | Browser Profiles: ${browsersCount} (Click for telemetry)`;
  }
  if (state.status === 'checking') {
    return `automa-core: Connecting to ${state.baseUrl}...`;
  }
  return `automa-core: Offline (${state.baseUrl}) - Click to retry connection`;
});

const statusClasses = computed(() => {
  if (state.status === 'online') {
    return 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50';
  }
  if (state.status === 'checking') {
    return 'border-amber-200 dark:border-amber-800/60 bg-amber-50/80 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300';
  }
  return 'border-rose-200 dark:border-rose-800/60 bg-rose-50/80 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50';
});

const dotClasses = computed(() => {
  if (state.status === 'online') return 'bg-emerald-500';
  if (state.status === 'checking') return 'bg-amber-500 animate-pulse';
  return 'bg-rose-500';
});
</script>
