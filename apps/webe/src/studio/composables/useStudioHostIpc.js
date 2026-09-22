import { onMounted, onUnmounted, ref } from 'vue';

export function useStudioHostIpc({
  onLoadWorkflow,
  onToggleSidebar,
  goToBlock,
}) {
  const isHeadless = ref(false);

  function highlightNode(nodeId) {
    if (!nodeId) return;
    try {
      const el = document.querySelector(`[data-id="${nodeId}"]`);
      if (el) {
        document
          .querySelectorAll('.node-running')
          .forEach((n) => n.classList.remove('node-running'));
        el.classList.add('node-running');
      }
      goToBlock?.(nodeId);
    } catch (_) {
      // Ignored
    }
  }

  function resetNodeHighlights() {
    try {
      document
        .querySelectorAll('.node-running')
        .forEach((n) => n.classList.remove('node-running'));
    } catch (_) {
      // Ignored
    }
  }

  function handleWindowMessage(event) {
    const msg = event.data;
    if (!msg || typeof msg !== 'object') return;

    if (
      msg.type === 'automa:set-workflow' ||
      msg.type === 'automa:load-workflow'
    ) {
      const wf = msg.data?.data || msg.data;
      if (wf) {
        onLoadWorkflow?.(wf);
      }
    } else if (msg.type === 'updateData') {
      const wf = msg.payload?.data || msg.data?.data || msg.payload || msg.data;
      if (wf) {
        onLoadWorkflow?.(wf);
      }
    } else if (msg.type === 'automa:set-theme') {
      const isDark = msg.isDark ?? msg.theme === 'dark';
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else if (msg.type === 'automa:set-sidebar') {
      if (typeof msg.show === 'boolean') {
        onToggleSidebar?.(msg.show);
      }
    } else if (msg.type === 'highlightNode') {
      highlightNode(msg.nodeId);
    } else if (msg.type === 'resetNodeHighlights') {
      resetNodeHighlights();
    }
  }

  onMounted(() => {
    // Check initial query params for theme or headless
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('headless') === 'true') {
        isHeadless.value = true;
      }
      if (params.get('theme') === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (params.get('theme') === 'light') {
        document.documentElement.classList.remove('dark');
      }

      window.addEventListener('message', handleWindowMessage);
    }
  });

  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('message', handleWindowMessage);
    }
  });

  return {
    isHeadless,
    highlightNode,
    resetNodeHighlights,
  };
}
