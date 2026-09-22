<script setup lang="ts">
import HistoryPanel from './components/HistoryPanel.vue'
</script>

<template>
  <div class="h-full w-full flex flex-col p-6 overflow-hidden bg-[var(--automa-bg-subtle)] text-[var(--automa-text-primary)]">
    <HistoryPanel :page-size="20" />
  </div>
</template>
