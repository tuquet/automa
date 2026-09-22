/**
 * Pre-flight Cascading & Browser Resolution Waterfall
 * Conforms strictly to docs/SRS_BUTTON_BUSINESS_LOGIC_EVENT_DRIVEN.md (Section 2.1)
 */

import type { BrowserResponse } from '@automa/types/api'
import { ref } from 'vue'
import {
  createBrowser,
  getAppSettings,
  getBrowsers,
  installBrowserBinary,
} from '../../../infrastructure/api/client'

export const isQuickPickOpen = ref(false)
export const isResolverModalOpen = ref(false)
export const cachedBrowsers = ref<BrowserResponse[]>([])
export const cachedProfiles = cachedBrowsers
export const defaultProfileId = ref<string | null>(null)

let resolveCallback: ((profileId: string | null) => void) | null = null

export function useBrowserWaterfall() {
  const isResolving = ref(false)

  async function fetchFreshProfiles(): Promise<BrowserResponse[]> {
    try {
      const res = await getBrowsers()
      if (res.data) {
        cachedProfiles.value = res.data
        return res.data
      }
    } catch (err) {
      console.warn('[Waterfall] Failed to fetch browsers:', err)
    }
    return []
  }

  async function fetchDefaultSettings(): Promise<string | null> {
    try {
      const res = await getAppSettings()
      if (res.data?.browser?.default_type) {
        // Check if there is a configured default profile
        return defaultProfileId.value
      }
    } catch (err) {
      console.warn('[Waterfall] Failed to fetch settings:', err)
    }
    return defaultProfileId.value
  }

  /**
   * Main entry point for the 3-Level Browser Resolution Waterfall
   */
  async function resolveBrowser(): Promise<string | null> {
    isResolving.value = true
    const profiles = await fetchFreshProfiles()
    const defaultId = await fetchDefaultSettings()

    // 🌊 Level 1: Fast Path - Happy Flow
    // If a default profile is configured and exists in DB, return immediately
    if (defaultId && profiles.some((p) => p.id === defaultId)) {
      isResolving.value = false
      return defaultId
    }

    // If only 1 profile exists, use it as default
    if (profiles.length === 1 && profiles[0]?.id) {
      defaultProfileId.value = profiles[0].id
      isResolving.value = false
      return profiles[0].id
    }

    // 🌊 Level 2: Selection Prompt - Missing Default (> 0 profiles)
    if (profiles.length > 1) {
      isQuickPickOpen.value = true
      return new Promise<string | null>((resolve) => {
        resolveCallback = resolve
      })
    }

    // 🌊 Level 3: Master Browser Resolver - Zero Profiles in DB
    isResolverModalOpen.value = true
    return new Promise<string | null>((resolve) => {
      resolveCallback = resolve
    })
  }

  function finishResolution(profileId: string | null, setAsDefault = false) {
    if (profileId && setAsDefault) {
      defaultProfileId.value = profileId
    }
    isQuickPickOpen.value = false
    isResolverModalOpen.value = false
    isResolving.value = false

    if (resolveCallback) {
      resolveCallback(profileId)
      resolveCallback = null
    }
  }

  function cancelResolution() {
    finishResolution(null)
  }

  // Resolver Option A: Initialize Standard Chromium Profile (btn.browser.auto_detect)
  async function handleAutoDetect(): Promise<string | null> {
    try {
      await installBrowserBinary()
      const fresh = await fetchFreshProfiles()
      const resolvedId = fresh[0]?.id || 'default-chromium'
      finishResolution(resolvedId, true)
      return resolvedId
    } catch (err) {
      console.error('[Waterfall] Standard Chromium init failed:', err)
    }
    return null
  }

  // Resolver Option B: Create Custom Profile (btn.browser.create)
  async function handleCreateCustom(name: string): Promise<string | null> {
    try {
      await createBrowser({
        body: {
          name: name.trim() || 'Custom Profile 1',
        },
      })
      const fresh = await fetchFreshProfiles()
      const target = fresh.find((p) => p.name === name.trim()) || fresh[fresh.length - 1]
      const resolvedId = target?.id || 'custom-profile'
      finishResolution(resolvedId, true)
      return resolvedId
    } catch (err) {
      console.error('[Waterfall] Create profile failed:', err)
    }
    return null
  }

  return {
    isResolving,
    isQuickPickOpen,
    isResolverModalOpen,
    cachedBrowsers,
    cachedProfiles,
    defaultProfileId,
    resolveBrowser,
    finishResolution,
    cancelResolution,
    handleAutoDetect,
    handleCreateCustom,
  }
}
