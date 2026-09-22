import { getCurrentInstance, onMounted, onUnmounted } from 'vue';

export function useStudioKeyboardShortcuts({
  onSave,
  onCopy,
  onPaste,
  onDuplicate,
  onUndo,
  onRedo,
  onToggleSidebar,
}) {
  function handleKeyDown(event) {
    const isMod = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();

    // Check if user is typing in an input/textarea/select
    const tag = event.target?.tagName?.toLowerCase();
    if (
      tag === 'input' ||
      tag === 'textarea' ||
      tag === 'select' ||
      event.target?.isContentEditable
    ) {
      return;
    }

    if (isMod && key === 's') {
      event.preventDefault();
      onSave?.();
    } else if (isMod && key === 'c') {
      onCopy?.();
    } else if (isMod && key === 'v') {
      onPaste?.();
    } else if (isMod && key === 'd') {
      event.preventDefault();
      onDuplicate?.();
    } else if (isMod && key === 'z') {
      event.preventDefault();
      if (event.shiftKey) {
        onRedo?.();
      } else {
        onUndo?.();
      }
    } else if (isMod && key === 'y') {
      event.preventDefault();
      onRedo?.();
    } else if (isMod && key === 'b') {
      event.preventDefault();
      onToggleSidebar?.();
    }
  }

  if (getCurrentInstance()) {
    onMounted(() => {
      window.addEventListener('keydown', handleKeyDown);
    });

    onUnmounted(() => {
      window.removeEventListener('keydown', handleKeyDown);
    });
  }

  return {
    handleKeyDown,
  };
}
