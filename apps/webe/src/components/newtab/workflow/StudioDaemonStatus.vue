<template>
  <div
    v-if="state.status === 'online'"
    class="relative inline-flex items-center"
  >
    <button
      data-testid="btn-automa-core-status"
      class="px-2 py-1 text-xs font-medium rounded-lg border flex items-center space-x-1.5 transition-colors shadow-sm"
      :class="statusClasses"
      :title="tooltipText"
      @click="handleStatusClick"
    >
      <!-- Status LED Dot Indicator -->
      <span class="relative flex h-2 w-2">
        <span
          class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"
        ></span>
        <span
          class="relative inline-flex rounded-full h-2 w-2"
          :class="dotClasses"
        ></span>
      </span>

      <span
        v-if="state.latency > 0"
        class="text-xs opacity-70 hidden sm:inline font-mono"
      >
        {{ state.latency }}ms
      </span>
    </button>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue';
import { useAutomaCoreHealth } from '@/composable/useAutomaCoreHealth';
import { useToast } from 'vue-toastification';

const { state, checkHealth, initEventStream, closeEventStream } =
  useAutomaCoreHealth();
const toast = useToast();

onMounted(() => {
  initEventStream();
  checkHealth();
});

onUnmounted(() => {
  closeEventStream();
});

const tooltipText = computed(() => {
  const browsersCount = state.browsers?.length || 0;
  return `automa-core (${state.baseUrl}) | Latency: ${state.latency}ms | Browser Profiles: ${browsersCount}`;
});

const statusClasses = computed(() => {
  return 'border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50';
});

const dotClasses = computed(() => {
  return 'bg-emerald-500';
});

async function handleStatusClick() {
  await checkHealth();
  if (state.status === 'online') {
    toast.success(`automa-core: connected (${state.latency}ms)`);
  }
}
</script>
