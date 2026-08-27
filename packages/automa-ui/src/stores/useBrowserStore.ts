import type { BrowserResponse, BrowserStoreState } from '@automa/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useBrowserStore = defineStore('browser', () => {
  const browsers = ref<BrowserResponse[]>([])
  const selectedBrowserId = ref<string>('default')
  const onlineBrowserIds = ref<string[]>([])
  const waterfallResolution = ref<BrowserStoreState['waterfallResolution']>({
    activeType: 'chromium',
    executablePath: null,
    isDetected: true,
  })
  const isLoading = ref<boolean>(false)
  const searchQuery = ref<string>('')

  const activeBrowser = computed(
    () => browsers.value.find((b) => b.id === selectedBrowserId.value) || null,
  )

  const filteredBrowsers = computed(() => {
    if (!searchQuery.value.trim()) return browsers.value
    const q = searchQuery.value.toLowerCase()
    return browsers.value.filter(
      (b) => b.name.toLowerCase().includes(q) || b.id.toLowerCase().includes(q),
    )
  })

  const onlineCount = computed(() => onlineBrowserIds.value.length)

  function setBrowsers(items: BrowserResponse[]) {
    browsers.value = items
  }

  function addBrowser(browser: BrowserResponse) {
    const idx = browsers.value.findIndex((b) => b.id === browser.id)
    if (idx >= 0) {
      browsers.value[idx] = browser
    } else {
      browsers.value.push(browser)
    }
  }

  function removeBrowser(id: string) {
    browsers.value = browsers.value.filter((b) => b.id !== id)
    if (selectedBrowserId.value === id) {
      selectedBrowserId.value = 'default'
    }
  }

  function setSelectedBrowser(id: string) {
    selectedBrowserId.value = id
  }

  function setBrowserOnline(id: string, online: boolean) {
    if (online) {
      if (!onlineBrowserIds.value.includes(id)) {
        onlineBrowserIds.value.push(id)
      }
    } else {
      onlineBrowserIds.value = onlineBrowserIds.value.filter((bId) => bId !== id)
    }
  }

  function setWaterfallResolution(data: BrowserStoreState['waterfallResolution']) {
    waterfallResolution.value = data
  }

  function setSearchQuery(query: string) {
    searchQuery.value = query
  }

  return {
    browsers,
    selectedBrowserId,
    onlineBrowserIds,
    waterfallResolution,
    isLoading,
    searchQuery,
    activeBrowser,
    filteredBrowsers,
    onlineCount,
    setBrowsers,
    addBrowser,
    removeBrowser,
    setSelectedBrowser,
    setBrowserOnline,
    setWaterfallResolution,
    setSearchQuery,
  }
})
