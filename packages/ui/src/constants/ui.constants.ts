/**
 * UI Layout, Dimension & Timing Constants
 */

export const DEFAULT_DRAWER_HEIGHT = 280
export const MIN_DRAWER_HEIGHT = 160
export const MAX_DRAWER_HEIGHT = 600

export const DEFAULT_VIRTUAL_ITEM_HEIGHT = 32
export const DEFAULT_SELECT_POPOVER_MAX_HEIGHT = 288

export const DEFAULT_SEARCH_DEBOUNCE_MS = 250
export const TOAST_DURATION_MS = 3000
export const FSM_ANIMATION_DURATION_MS = 150

export const UI_Z_INDEX = {
  BASE: 0,
  STICKY: 10,
  POPOVER: 30,
  DROPDOWN: 40,
  DRAWER: 45,
  MODAL_BACKDROP: 50,
  MODAL_CONTENT: 51,
  TOOLTIP: 60,
} as const

export const THEME_STORAGE_KEY = 'automa_theme'
export const SUPPORTED_THEMES = ['light', 'dark', 'system'] as const
export type SupportedTheme = (typeof SUPPORTED_THEMES)[number]
