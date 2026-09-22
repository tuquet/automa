<script setup lang="ts">
import { ExecutionConsoleDrawer } from '@automa/ui'
import { useStudioStore } from '../stores/useStudioStore'

const studioStore = useStudioStore()
</script>

<template>
  <ExecutionConsoleDrawer
    data-testid="layout-studio-execution-console"
    :open="studioStore.isConsoleOpen"
    :title="studioStore.activeJobId ? `Job Console: ${studioStore.activeJobId}` : 'Execution Logs'"
    @close="studioStore.isConsoleOpen = false"
  />
</template>
