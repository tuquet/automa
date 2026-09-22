<script setup lang="ts">
defineProps<{
  status: 'online' | 'offline' | 'running' | 'idle' | 'error'
  text?: string
}>()
</script>

<template>
  <span
    class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium"
    :class="{
      'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20': status === 'online',
      'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20': status === 'offline' || status === 'error',
      'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 animate-pulse': status === 'running',
      'bg-muted text-muted-foreground border border-border': status === 'idle',
    }"
  >
    <span
      class="size-1.5 rounded-full"
      :class="{
        'bg-emerald-500': status === 'online',
        'bg-rose-500': status === 'offline' || status === 'error',
        'bg-blue-500': status === 'running',
        'bg-muted-foreground': status === 'idle',
      }"
    />
    <slot>{{ text }}</slot>
  </span>
</template>
