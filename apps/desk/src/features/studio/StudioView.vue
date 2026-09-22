<script setup lang="ts">
import ExecutionConsole from './components/ExecutionConsole.vue'
import StudioActionHeader from './components/StudioActionHeader.vue'
import StudioCanvasEmbed from './components/StudioCanvasEmbed.vue'
</script>

<template>
  <div
    data-testid="layout-studio-view"
    class="h-full w-full flex flex-col overflow-hidden bg-background text-foreground"
  >
    <!-- Top Action Toolbar -->
    <StudioActionHeader />

    <!-- Center Canvas Embed (Iframe to automa-webe:studio) -->
    <div
      data-testid="studio-canvas-container"
      class="flex-1 flex flex-col overflow-hidden relative"
    >
      <StudioCanvasEmbed />
    </div>

    <!-- Bottom Collapsible SSE Telemetry Log Console -->
    <ExecutionConsole />
  </div>
</template>
