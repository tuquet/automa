import type { AppSettings, SettingsStoreState } from '@automa/types'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  const settings = ref<AppSettings | null>(null)
  const isDaemonHealthy = ref<boolean>(false)
  const theme = ref<SettingsStoreState['theme']>('dark')

  function setSettings(data: AppSettings) {
    settings.value = data
  }

  function setDaemonHealthy(healthy: boolean) {
    isDaemonHealthy.value = healthy
  }

  function setTheme(newTheme: SettingsStoreState['theme']) {
    theme.value = newTheme
  }

  return {
    settings,
    isDaemonHealthy,
    theme,
    setSettings,
    setDaemonHealthy,
    setTheme,
  }
})
