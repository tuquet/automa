<script setup lang="ts">
import { ref } from 'vue'
import { STUDIO_EMBED_HEADLESS_URL } from '../../../core/constants/daemon'
import { useStudioBridge } from '../composables/useStudioBridge'

const iframeRef = ref<HTMLIFrameElement | null>(null)
const isLoaded = ref(false)

const { syncThemeToStudio } = useStudioBridge(iframeRef)

function onIframeLoad() {
  isLoaded.value = true
  syncThemeToStudio()
}
</script>

<template>
  <div
    data-testid="layout-studio-canvas-embed"
    class="flex-1 w-full h-full relative overflow-hidden bg-muted"
  >
    <!-- Loading Overlay -->
    <div
      v-if="!isLoaded"
      data-testid="studio-canvas-loading"
      class="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-xs text-muted-foreground"
    >
      <div class="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
      <p class="text-xs font-medium">Loading Automa Studio Canvas...</p>
    </div>

    <!-- Embedded Studio Iframe (Headless Mode) -->
    <iframe
      ref="iframeRef"
      :src="STUDIO_EMBED_HEADLESS_URL"
      data-testid="studio-canvas-iframe"
      title="Automa Web Studio"
      class="w-full h-full border-none"
      allow="clipboard-read; clipboard-write;"
      @load="onIframeLoad"
    />
  </div>
</template>
