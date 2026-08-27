import { describe, expect, it } from 'vitest'
import { createApp } from 'vue'
import {
  BROWSERS_QUERY_KEY,
  createAutomaUiPlugin,
  HEALTH_QUERY_KEY,
  HISTORY_QUERY_KEY,
  SETTINGS_QUERY_KEY,
  STORAGE_QUERY_KEY,
  WORKFLOWS_QUERY_KEY,
} from '../src'

describe('@automa/ui - Query Keys & Plugin Engine', () => {
  it('exposes canonical Query Keys matching Domain Schemas', () => {
    expect(BROWSERS_QUERY_KEY).toEqual(['browsers'])
    expect(WORKFLOWS_QUERY_KEY).toEqual(['workflows'])
    expect(STORAGE_QUERY_KEY).toEqual(['storage'])
    expect(HISTORY_QUERY_KEY).toEqual(['history'])
    expect(SETTINGS_QUERY_KEY).toEqual(['settings'])
    expect(HEALTH_QUERY_KEY).toEqual(['health'])
  })

  it('instantiates createAutomaUiPlugin cleanly on Vue app', () => {
    const app = createApp({})
    const plugin = createAutomaUiPlugin({
      baseUrl: 'http://127.0.0.1:8765',
      enableSseAutoInvalidation: false,
    })
    expect(plugin).toBeDefined()
    expect(typeof plugin.install).toBe('function')
    expect(() => app.use(plugin)).not.toThrow()
  })
})
