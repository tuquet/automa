import { describe, expect, it } from 'vitest'
import router from '../../src/router'

describe('router', () => {
  it('defines 7 routes for features', () => {
    const routes = router.options.routes
    expect(routes).toHaveLength(7)
  })

  it('has default redirect from / to /studio', () => {
    const root = router.options.routes[0]
    expect(root.path).toBe('/')
    expect(root.redirect).toBe('/studio')
  })

  it('has studio route at /studio', () => {
    const studio = router.options.routes[1]
    expect(studio.path).toBe('/studio')
    expect(studio.name).toBe('studio')
    expect(typeof studio.component).toBe('function')
  })

  it('has browsers route at /browsers', () => {
    const browsers = router.options.routes[2]
    expect(browsers.path).toBe('/browsers')
    expect(browsers.name).toBe('browsers')
  })

  it('has storage route at /storage', () => {
    const storage = router.options.routes[3]
    expect(storage.path).toBe('/storage')
    expect(storage.name).toBe('storage')
  })

  it('has history route at /history', () => {
    const history = router.options.routes[4]
    expect(history.path).toBe('/history')
    expect(history.name).toBe('history')
  })

  it('has settings route at /settings', () => {
    const settings = router.options.routes[5]
    expect(settings.path).toBe('/settings')
    expect(settings.name).toBe('settings')
  })
})
