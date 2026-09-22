<script setup lang="ts">
import type { BrowserResponse } from '@automa/types/api'
import { AutomaButton, BrowserDataTable, useBrowserStore } from '@automa/ui'
import { Globe } from 'lucide-vue-next'
import { onMounted } from 'vue'
import {
  deleteBrowser,
  getBrowsers,
  killAllBrowsers,
  startBrowser,
  stopBrowserSession,
} from '../../../infrastructure/api/client'
import { isResolverModalOpen } from '../composables/useBrowserWaterfall'

defineOptions({
  name: 'BrowsersPanel',
})

const props = withDefaults(
  defineProps<{
    showHeader?: boolean
    pageSize?: number
  }>(),
  {
    showHeader: true,
    pageSize: 15,
  },
)

const emit = defineEmits<(e: 'select-browser', browser: BrowserResponse) => void>()

const browserStore = useBrowserStore()

async function loadBrowsers() {
  browserStore.isLoading = true
  try {
    const res = await getBrowsers()
    if (res.data) {
      browserStore.setBrowsers(res.data)
    }
  } catch (err) {
    console.error('Failed to load browsers:', err)
  } finally {
    browserStore.isLoading = false
  }
}

async function handleLaunchSession(idOrBrowser: string | BrowserResponse) {
  const id = typeof idOrBrowser === 'string' ? idOrBrowser : idOrBrowser.id
  try {
    await startBrowser({ path: { id } })
    await loadBrowsers()
  } catch (err) {
    console.error('Launch error:', err)
    await loadBrowsers()
  }
}

async function handleStopSession(idOrBrowser: string | BrowserResponse, force = false) {
  const id = typeof idOrBrowser === 'string' ? idOrBrowser : idOrBrowser.id
  try {
    await stopBrowserSession({ path: { id }, query: { force } })
    await loadBrowsers()
  } catch (err) {
    console.error('Stop session error:', err)
    await loadBrowsers()
  }
}

async function handleDeleteBrowser(idOrBrowser: string | BrowserResponse) {
  const id = typeof idOrBrowser === 'string' ? idOrBrowser : idOrBrowser.id
  try {
    await deleteBrowser({ path: { id } })
    await loadBrowsers()
  } catch (err) {
    console.error('Delete browser error:', err)
  }
}

async function handleKillAll() {
  try {
    await killAllBrowsers()
    await loadBrowsers()
  } catch (err) {
    console.error('Kill all error:', err)
  }
}

function handleCreateNew() {
  isResolverModalOpen.value = true
}

onMounted(() => {
  loadBrowsers()
})

defineExpose({
  loadBrowsers,
})
</script>

<template>
  <div class="h-full w-full flex flex-col overflow-hidden">
    <!-- Header Bar -->
    <div v-if="showHeader" class="flex items-center justify-between pb-3 border-b border-border shrink-0">
      <div class="flex items-center gap-2.5">
        <div class="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20">
          <Globe class="size-4" :stroke-width="2" />
        </div>
        <h2 class="font-semibold text-xs tracking-tight text-foreground">Browsers</h2>
      </div>

      <div class="flex items-center gap-2">
        <AutomaButton
          id="btn.browser.kill_all"
          size="xs"
          variant="destructive"
          title="Kill all browsers"
          @click="handleKillAll"
          @confirmed="handleKillAll"
        />
      </div>
    </div>

    <!-- Virtual Browsers Table -->
    <div class="flex-1 min-h-0 mt-2 overflow-hidden">
      <BrowserDataTable
        :enable-virtualization="true"
        :page-size="pageSize"
        @launch-browser="handleLaunchSession"
        @stop-browser="handleStopSession"
        @delete-browser="handleDeleteBrowser"
        @create-browser="handleCreateNew"
        @select-browser="emit('select-browser', $event)"
      />
    </div>
  </div>
</template>
