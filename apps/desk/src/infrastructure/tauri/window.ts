/**
 * Tauri v2 Native Window Controls & Ergonomics Adapter
 */

import { getCurrentWindow } from '@tauri-apps/api/window'

export async function minimizeWindow(): Promise<void> {
  try {
    const appWindow = getCurrentWindow()
    await appWindow.minimize()
  } catch (err) {
    console.warn('[Window] Minimize error (likely in web preview):', err)
  }
}

export async function toggleMaximizeWindow(): Promise<void> {
  try {
    const appWindow = getCurrentWindow()
    await appWindow.toggleMaximize()
  } catch (err) {
    console.warn('[Window] Toggle maximize error:', err)
  }
}

export async function closeWindow(): Promise<void> {
  try {
    const appWindow = getCurrentWindow()
    await appWindow.close()
  } catch (err) {
    console.warn('[Window] Close error:', err)
  }
}
