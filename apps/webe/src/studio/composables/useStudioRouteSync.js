import { watch } from 'vue';

/**
 * Synchronizes the active workflow state with the URL router query (?workflow=<id>).
 * Ensures F5 browser refresh restores the active workflow session and preserves existing
 * query parameters (e.g., ?headless=true, ?theme=dark).
 */
export function useStudioRouteSync({
  router,
  route,
  store,
  currentFilePath,
  loadWorkflowFromStorage,
  loadWorkflowData,
  getInitialWorkflow,
}) {
  function getWorkflowIdFromQuery() {
    if (route && route.query) {
      if (route.query.workflow) {
        return String(route.query.workflow);
      }
      if (route.query.id) {
        return String(route.query.id);
      }
      return null;
    }
    if (typeof window !== 'undefined' && window.location?.search) {
      try {
        const params = new URLSearchParams(window.location.search);
        return params.get('workflow') || params.get('id') || null;
      } catch (_) {
        return null;
      }
    }
    return null;
  }

  function clearWorkflowFromRoute() {
    // 1. Vue Router query clearing
    if (router && route) {
      const currentQuery = route.query || {};
      if (currentQuery.workflow || currentQuery.id) {
        const nextQuery = { ...currentQuery };
        delete nextQuery.workflow;
        delete nextQuery.id;
        router.replace({ query: nextQuery }).catch(() => {});
      }
    }

    // 2. Direct browser history fallback
    if (
      typeof window !== 'undefined' &&
      window.history?.replaceState &&
      window.location?.href
    ) {
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.has('workflow') || url.searchParams.has('id')) {
          url.searchParams.delete('workflow');
          url.searchParams.delete('id');
          window.history.replaceState(null, '', url.toString());
        }
      } catch (_) {
        // Ignored
      }
    }
  }

  function syncWorkflowToRoute(workflowId) {
    if (!workflowId || typeof workflowId !== 'string') {
      clearWorkflowFromRoute();
      return;
    }

    // 1. Vue Router query replacement (preserves other params like headless or theme)
    if (router && route) {
      const currentQuery = route.query || {};
      if (currentQuery.workflow !== workflowId) {
        const nextQuery = { ...currentQuery, workflow: workflowId };
        delete nextQuery.id;
        router.replace({ query: nextQuery }).catch(() => {});
      }
    }

    // 2. Direct browser history sync fallback (for standalone or iframe contexts)
    if (
      typeof window !== 'undefined' &&
      window.history?.replaceState &&
      window.location?.href
    ) {
      try {
        const url = new URL(window.location.href);
        if (url.searchParams.get('workflow') !== workflowId) {
          url.searchParams.set('workflow', workflowId);
          url.searchParams.delete('id');
          window.history.replaceState(null, '', url.toString());
        }
      } catch (_) {
        // Ignored in restricted environments
      }
    }
  }

  async function initWorkflowFromRoute() {
    const workflowId = getWorkflowIdFromQuery();

    if (workflowId && loadWorkflowFromStorage) {
      await loadWorkflowFromStorage(workflowId);
      if (store?.currentWorkflow) {
        syncWorkflowToRoute(workflowId);
        return;
      }
    }

    // Fallback: load initial workflow if none loaded
    if (!store?.currentWorkflow && loadWorkflowData) {
      const initial = getInitialWorkflow ? getInitialWorkflow() : null;
      if (initial) {
        loadWorkflowData(initial);
      }
    }

    if (!workflowId) {
      clearWorkflowFromRoute();
    }
  }

  // Reactively track currentFilePath to keep route query synchronized
  if (currentFilePath) {
    watch(
      () => currentFilePath.value,
      (newId) => {
        if (newId) {
          syncWorkflowToRoute(newId);
        } else {
          clearWorkflowFromRoute();
        }
      }
    );
  }

  // Reactively handle browser back/forward navigation
  if (route) {
    watch(
      () => route.query?.workflow,
      async (newWfId, oldWfId) => {
        if (
          newWfId &&
          newWfId !== currentFilePath?.value &&
          newWfId !== oldWfId &&
          loadWorkflowFromStorage
        ) {
          await loadWorkflowFromStorage(String(newWfId));
        }
      }
    );
  }

  return {
    getWorkflowIdFromQuery,
    syncWorkflowToRoute,
    clearWorkflowFromRoute,
    initWorkflowFromRoute,
  };
}
