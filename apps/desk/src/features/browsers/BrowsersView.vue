<script setup lang="ts">
import BrowsersPanel from './components/BrowsersPanel.vue'
</script>

<template>
  <div class="h-full w-full flex flex-col p-6 overflow-hidden bg-[var(--automa-bg-subtle)] text-[var(--automa-text-primary)] font-sans">
    <BrowsersPanel :page-size="20" />
  </div>
</template>
