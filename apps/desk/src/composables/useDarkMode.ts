import { useDark, useToggle } from '@vueuse/core'

export function useDarkMode() {
  const isDark = useDark({ disableTransition: true })
  const toggle = useToggle(isDark)

  const toggleDark = () => {
    if (
      typeof document !== 'undefined' &&
      'startViewTransition' in document &&
      !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    ) {
      document.startViewTransition(() => {
        toggle()
      })
    } else {
      toggle()
    }
  }

  return { isDark, toggleDark }
}
