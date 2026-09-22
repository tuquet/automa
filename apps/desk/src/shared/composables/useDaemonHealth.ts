/**
 * Heartbeat Health Checker for Automa Core Daemon
 */

import { onMounted, onUnmounted, ref } from 'vue'
import { HEALTH_CHECK_INTERVAL_MS } from '../../core/constants/daemon'
import { getHealth } from '../../infrastructure/api/client'

export function useDaemonHealth() {
  const isHealthy = ref<boolean | null>(null)
  const version = ref<string>('')
  let intervalId: ReturnType<typeof setInterval> | null = null

  async function checkHealth() {
    try {
      const res = await getHealth()
      if (res.data && res.data.status === 'ok') {
        isHealthy.value = true
        version.value = res.data.version || '1.0.0'
      } else {
        isHealthy.value = false
      }
    } catch {
      isHealthy.value = false
    }
  }

  onMounted(() => {
    checkHealth()
    intervalId = setInterval(checkHealth, HEALTH_CHECK_INTERVAL_MS)
  })

  onUnmounted(() => {
    if (intervalId) {
      clearInterval(intervalId)
    }
  })

  return {
    isHealthy,
    version,
    checkHealth,
  }
}
