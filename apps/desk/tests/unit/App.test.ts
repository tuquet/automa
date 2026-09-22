import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { describe, expect, it, vi } from 'vitest'
import App from '../../src/App.vue'

vi.mock('../../src/composables/useDarkMode', () => ({
  useDarkMode: vi.fn(() => ({
    isDark: { value: false },
    toggleDark: vi.fn(),
  })),
}))

describe('App', () => {
  it('renders MainAppLayout', () => {
    const pinia = createPinia()
    const wrapper = mount(App, {
      global: {
        plugins: [pinia],
        stubs: {
          MainAppLayout: { template: '<div data-testid="main-layout"><slot /></div>' },
        },
      },
    })
    expect(wrapper.find('[data-testid="main-layout"]').exists()).toBe(true)
  })
})
