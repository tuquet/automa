import { flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  cachedProfiles,
  defaultProfileId,
  isQuickPickOpen,
  isResolverModalOpen,
  useBrowserWaterfall,
} from '../../../src/features/browsers/composables/useBrowserWaterfall'

vi.mock('../../../src/infrastructure/api/client', () => ({
  getBrowsers: vi.fn(),
  createBrowser: vi.fn(),
  getAppSettings: vi.fn(),
  autoDetectBrowsers: vi.fn(),
  installBrowserBinary: vi.fn(),
}))

import {
  autoDetectBrowsers,
  createBrowser,
  getAppSettings,
  getBrowsers,
  installBrowserBinary,
} from '../../../src/infrastructure/api/client'

describe('useBrowserWaterfall (SRS Section 2.1)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    isQuickPickOpen.value = false
    isResolverModalOpen.value = false
    cachedProfiles.value = []
    defaultProfileId.value = null
  })

  it('Level 1 Fast Path: resolves immediately when default profile exists', async () => {
    defaultProfileId.value = 'profile-default-1'
    vi.mocked(getBrowsers).mockResolvedValue({
      data: [
        {
          id: 'profile-default-1',
          name: 'Default Browser',
          isOnline: true,
          createdAt: '',
          updatedAt: '',
        },
        {
          id: 'profile-2',
          name: 'Secondary Browser',
          isOnline: false,
          createdAt: '',
          updatedAt: '',
        },
      ],
    })
    vi.mocked(getAppSettings).mockResolvedValue({
      data: {
        browser: { default_type: 'chromium', headless: false },
        grid: { matrix_rows: 2, matrix_cols: 2, tile_spacing: 8 },
        runner: {
          concurrency: 4,
          max_queue_size: 100,
          step_delay_ms: 0,
          timeout_ms: 30000,
        },
      },
    })

    const { resolveBrowser } = useBrowserWaterfall()
    const result = await resolveBrowser()

    expect(result).toBe('profile-default-1')
    expect(isQuickPickOpen.value).toBe(false)
    expect(isResolverModalOpen.value).toBe(false)
  })

  it('Level 2 Selection Prompt: opens QuickPick when multiple profiles exist and no default set', async () => {
    vi.mocked(getBrowsers).mockResolvedValue({
      data: [
        {
          id: 'profile-a',
          name: 'Chrome A',
          isOnline: false,
          createdAt: '',
          updatedAt: '',
        },
        {
          id: 'profile-b',
          name: 'Chrome B',
          isOnline: false,
          createdAt: '',
          updatedAt: '',
        },
      ],
    })
    vi.mocked(getAppSettings).mockResolvedValue({ data: undefined })

    const { resolveBrowser, finishResolution } = useBrowserWaterfall()

    const resolvePromise = resolveBrowser()
    await flushPromises()

    expect(isQuickPickOpen.value).toBe(true)

    // Simulate user selecting profile-b
    finishResolution('profile-b', true)

    const result = await resolvePromise
    expect(result).toBe('profile-b')
    expect(defaultProfileId.value).toBe('profile-b')
    expect(isQuickPickOpen.value).toBe(false)
  })

  it('Level 3 Master Browser Resolver: opens Resolver Modal when 0 profiles exist in DB', async () => {
    vi.mocked(getBrowsers)
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({
        data: [
          {
            id: 'auto-detected-1',
            name: 'Host System Chrome',
            isOnline: true,
            createdAt: '',
            updatedAt: '',
          },
        ],
      })
    vi.mocked(getAppSettings).mockResolvedValue({ data: undefined })
    vi.mocked(autoDetectBrowsers).mockResolvedValue({ data: undefined })

    const { resolveBrowser, handleAutoDetect } = useBrowserWaterfall()

    const resolvePromise = resolveBrowser()
    await flushPromises()

    expect(isResolverModalOpen.value).toBe(true)

    // Simulate user clicking Option A: Auto-Detect
    await handleAutoDetect()

    const result = await resolvePromise
    expect(result).toBe('auto-detected-1')
    expect(defaultProfileId.value).toBe('auto-detected-1')
    expect(isResolverModalOpen.value).toBe(false)
  })

  it('handles cancellation properly', async () => {
    vi.mocked(getBrowsers).mockResolvedValue({ data: [] })
    const { resolveBrowser, cancelResolution } = useBrowserWaterfall()

    const resolvePromise = resolveBrowser()
    await flushPromises()
    expect(isResolverModalOpen.value).toBe(true)

    cancelResolution()

    const result = await resolvePromise
    expect(result).toBeNull()
    expect(isResolverModalOpen.value).toBe(false)
  })
})
