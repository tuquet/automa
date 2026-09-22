import { ref, onMounted, onUnmounted, getCurrentInstance } from 'vue';

export function useStudioTheme() {
  const isDark = ref(
    typeof document !== 'undefined'
      ? document.documentElement.classList.contains('dark')
      : true
  );

  function syncTheme() {
    if (typeof document !== 'undefined') {
      isDark.value = document.documentElement.classList.contains('dark');
    }
  }

  function toggleDark() {
    if (typeof document === 'undefined') return;
    const nextDark = !document.documentElement.classList.contains('dark');
    if (nextDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    isDark.value = nextDark;

    try {
      localStorage.setItem('automa-theme', nextDark ? 'dark' : 'light');
    } catch (_) {
      // Ignored in sandboxed contexts
    }

    // Notify host iframe bridge if embedded in automa-desk or automa-vsce
    if (
      typeof window !== 'undefined' &&
      window.parent &&
      window.parent !== window
    ) {
      window.parent.postMessage(
        {
          type: 'automa:theme-changed',
          theme: nextDark ? 'dark' : 'light',
          isDark: nextDark,
        },
        '*'
      );
    }
  }

  if (getCurrentInstance()) {
    onMounted(() => {
      syncTheme();
      // Observe class attribute changes on documentElement to stay in sync with host
      if (typeof MutationObserver !== 'undefined') {
        const observer = new MutationObserver(() => syncTheme());
        observer.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ['class'],
        });
        onUnmounted(() => observer.disconnect());
      }
    });
  } else {
    syncTheme();
  }

  return { isDark, toggleDark };
}
