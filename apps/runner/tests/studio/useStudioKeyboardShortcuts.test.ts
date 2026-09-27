import { describe, it, expect, vi } from 'vitest';
import { useStudioKeyboardShortcuts } from '../../src/studio/composables/useStudioKeyboardShortcuts';

describe('useStudioKeyboardShortcuts', () => {
  it('triggers onSave when Ctrl+S is pressed', () => {
    const onSave = vi.fn();
    const { handleKeyDown } = useStudioKeyboardShortcuts({ onSave });

    const event = {
      ctrlKey: true,
      metaKey: false,
      key: 's',
      target: { tagName: 'DIV' },
      preventDefault: vi.fn(),
    };

    handleKeyDown(event);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(onSave).toHaveBeenCalled();
  });

  it('triggers onUndo when Ctrl+Z is pressed without Shift', () => {
    const onUndo = vi.fn();
    const onRedo = vi.fn();
    const { handleKeyDown } = useStudioKeyboardShortcuts({ onUndo, onRedo });

    const event = {
      ctrlKey: true,
      shiftKey: false,
      key: 'z',
      target: { tagName: 'DIV' },
      preventDefault: vi.fn(),
    };

    handleKeyDown(event);
    expect(onUndo).toHaveBeenCalled();
    expect(onRedo).not.toHaveBeenCalled();
  });

  it('triggers onRedo when Ctrl+Shift+Z or Ctrl+Y is pressed', () => {
    const onUndo = vi.fn();
    const onRedo = vi.fn();
    const { handleKeyDown } = useStudioKeyboardShortcuts({ onUndo, onRedo });

    const eventZ = {
      ctrlKey: true,
      shiftKey: true,
      key: 'z',
      target: { tagName: 'DIV' },
      preventDefault: vi.fn(),
    };
    handleKeyDown(eventZ);
    expect(onRedo).toHaveBeenCalledTimes(1);

    const eventY = {
      ctrlKey: true,
      shiftKey: false,
      key: 'y',
      target: { tagName: 'DIV' },
      preventDefault: vi.fn(),
    };
    handleKeyDown(eventY);
    expect(onRedo).toHaveBeenCalledTimes(2);
  });

  it('suppresses shortcut handling when typing inside input or textarea', () => {
    const onSave = vi.fn();
    const { handleKeyDown } = useStudioKeyboardShortcuts({ onSave });

    const inputEvent = {
      ctrlKey: true,
      key: 's',
      target: { tagName: 'INPUT' },
      preventDefault: vi.fn(),
    };

    handleKeyDown(inputEvent);
    expect(onSave).not.toHaveBeenCalled();
    expect(inputEvent.preventDefault).not.toHaveBeenCalled();
  });
});
