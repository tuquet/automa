import { describe, expect, it } from 'vitest'
import {
  BUTTON_CATALOG,
  BUTTON_PROTOTYPE_REGISTRY,
  DEFAULT_DRAWER_HEIGHT,
  DEFAULT_SEARCH_DEBOUNCE_MS,
  DEFAULT_VIRTUAL_ITEM_HEIGHT,
  QUERY_KEYS,
  SELECT_CATALOG,
  SELECT_REGISTRY,
  SUPPORTED_THEMES,
  THEME_STORAGE_KEY,
  UI_Z_INDEX,
} from '../src'

describe('@automa/ui Constants & Registries', () => {
  it('exports layout & UI timing constants', () => {
    expect(DEFAULT_DRAWER_HEIGHT).toBe(280)
    expect(DEFAULT_VIRTUAL_ITEM_HEIGHT).toBe(32)
    expect(DEFAULT_SEARCH_DEBOUNCE_MS).toBe(250)
    expect(UI_Z_INDEX.MODAL_BACKDROP).toBe(50)
    expect(SUPPORTED_THEMES).toContain('dark')
    expect(THEME_STORAGE_KEY).toBe('automa_theme')
  })

  it('exports canonical TanStack Query keys', () => {
    expect(QUERY_KEYS.WORKFLOWS).toEqual(['workflows'])
    expect(QUERY_KEYS.BROWSERS).toEqual(['browsers'])
    expect(QUERY_KEYS.CAMPAIGNS).toEqual(['campaigns'])
    expect(QUERY_KEYS.TABLES).toEqual(['tables'])
    expect(QUERY_KEYS.VARIABLES).toEqual(['variables'])
    expect(QUERY_KEYS.JOB_HISTORY).toEqual(['job_history'])
  })

  it('re-exports Button and Select registries correctly', () => {
    expect(BUTTON_CATALOG.length).toBeGreaterThan(30)
    expect(BUTTON_PROTOTYPE_REGISTRY['btn.workflow.run']).toBeDefined()
    expect(SELECT_CATALOG.length).toBeGreaterThan(5)
    expect(SELECT_REGISTRY['select.browser.profile']).toBeDefined()
  })
})
