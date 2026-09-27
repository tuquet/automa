import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useStudioTheme } from '../../src/studio/composables/useStudioTheme';

describe('useStudioTheme', () => {
  beforeEach(() => {
    document.documentElement.className = '';
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('detects light mode when dark class is absent', () => {
    document.documentElement.classList.remove('dark');
    const { isDark } = useStudioTheme();
    expect(isDark.value).toBe(false);
  });

  it('detects dark mode when dark class is present', () => {
    document.documentElement.classList.add('dark');
    const { isDark } = useStudioTheme();
    expect(isDark.value).toBe(true);
  });

  it('toggles dark mode and updates documentElement and localStorage', () => {
    document.documentElement.classList.remove('dark');
    const { isDark, toggleDark } = useStudioTheme();

    toggleDark();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(isDark.value).toBe(true);
    expect(localStorage.getItem('automa-theme')).toBe('dark');

    toggleDark();
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(isDark.value).toBe(false);
    expect(localStorage.getItem('automa-theme')).toBe('light');
  });
});
