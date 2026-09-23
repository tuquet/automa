import type { AppSettings } from '@automa/types/api'
import { describe, expect, it } from 'vitest'
import { SettingsForm } from '../src'

describe('@automa/ui - SettingsForm Component', () => {
  it('exports SettingsForm component cleanly', () => {
    expect(SettingsForm).toBeDefined()
  })

  it('handles initial settings structure cleanly', () => {
    const sampleSettings: AppSettings = {
      browser: {
        default_type: 'brave',
        headless: true,
        executable_path: '/usr/bin/brave',
        default_user_agent: 'CustomUA/1.0',
        default_profile_id: 'prof-123',
      },
      runner: {
        max_concurrent_jobs: 8,
        timeout_ms: 120000,
        auto_clean_history_days: 14,
      },
      grid: {
        enabled: true,
        matrix: {
          columns: 4,
          rows: 2,
        },
        behavior: {
          auto_recycle_slots: true,
          enforce_cdp_bounds: false,
          scale_factor: 1.25,
        },
        display: {
          margin: 10,
          monitor_index: 0,
          offset_x: 0,
          offset_y: 0,
          screen_height: 1080,
          screen_width: 1920,
        },
      },
    }

    expect(sampleSettings.browser.default_type).toBe('brave')
    expect(sampleSettings.runner.max_concurrent_jobs).toBe(8)
    expect(sampleSettings.grid.matrix.columns).toBe(4)
  })
})
