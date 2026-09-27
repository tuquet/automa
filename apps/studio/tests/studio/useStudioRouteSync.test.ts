import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ref, reactive } from 'vue';
import { useStudioRouteSync } from '../../src/studio/composables/useStudioRouteSync';
import { useStudioStore } from '../../src/studio/stores/useStudioStore';

describe('useStudioRouteSync', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    if (typeof window !== 'undefined' && window.history?.replaceState) {
      window.history.replaceState(null, '', '/');
    }
  });

  it('restores workflow from storage on startup when query contains workflow parameter', async () => {
    const store = useStudioStore();
    const currentFilePath = ref('');
    const route = reactive({ query: { workflow: 'wf_123' } });
    const router = { replace: vi.fn().mockResolvedValue(true) };

    const loadWorkflowFromStorage = vi.fn().mockImplementation(async (id) => {
      store.setWorkflow({ id, name: 'Restored Workflow', drawflow: { nodes: [], edges: [] } });
      currentFilePath.value = id;
    });
    const loadWorkflowData = vi.fn();

    const { initWorkflowFromRoute } = useStudioRouteSync({
      router,
      route,
      store,
      currentFilePath,
      loadWorkflowFromStorage,
      loadWorkflowData,
      getInitialWorkflow: () => ({ id: 'default', name: 'Default' }),
    });

    await initWorkflowFromRoute();

    expect(loadWorkflowFromStorage).toHaveBeenCalledWith('wf_123');
    expect(store.currentWorkflow?.id).toBe('wf_123');
    expect(loadWorkflowData).not.toHaveBeenCalled();
  });

  it('supports legacy ?id= parameter and normalizes to ?workflow=', async () => {
    const store = useStudioStore();
    const currentFilePath = ref('');
    const route = reactive({ query: { id: 'wf_legacy_456' } });
    const router = { replace: vi.fn().mockResolvedValue(true) };

    const loadWorkflowFromStorage = vi.fn().mockImplementation(async (id) => {
      store.setWorkflow({ id, name: 'Legacy Workflow', drawflow: { nodes: [], edges: [] } });
      currentFilePath.value = id;
    });
    const loadWorkflowData = vi.fn();

    const { initWorkflowFromRoute } = useStudioRouteSync({
      router,
      route,
      store,
      currentFilePath,
      loadWorkflowFromStorage,
      loadWorkflowData,
      getInitialWorkflow: () => ({ id: 'default', name: 'Default' }),
    });

    await initWorkflowFromRoute();

    expect(loadWorkflowFromStorage).toHaveBeenCalledWith('wf_legacy_456');
    expect(router.replace).toHaveBeenCalledWith({
      query: { workflow: 'wf_legacy_456' },
    });
  });

  it('loads default initial workflow when no workflow query is present', async () => {
    const store = useStudioStore();
    const currentFilePath = ref('');
    const route = reactive({ query: {} });
    const router = { replace: vi.fn().mockResolvedValue(true) };

    const loadWorkflowFromStorage = vi.fn();
    const loadWorkflowData = vi.fn().mockImplementation((data) => {
      store.setWorkflow(data);
    });

    const { initWorkflowFromRoute } = useStudioRouteSync({
      router,
      route,
      store,
      currentFilePath,
      loadWorkflowFromStorage,
      loadWorkflowData,
      getInitialWorkflow: () => ({ id: 'blank_default', name: 'Blank Default' }),
    });

    await initWorkflowFromRoute();

    expect(loadWorkflowFromStorage).not.toHaveBeenCalled();
    expect(loadWorkflowData).toHaveBeenCalledWith({ id: 'blank_default', name: 'Blank Default' });
  });

  it('preserves existing query parameters (headless, theme) when syncing workflow', () => {
    const store = useStudioStore();
    const currentFilePath = ref('');
    const route = reactive({ query: { headless: 'true', theme: 'dark' } });
    const router = { replace: vi.fn().mockResolvedValue(true) };

    const { syncWorkflowToRoute } = useStudioRouteSync({
      router,
      route,
      store,
      currentFilePath,
      loadWorkflowFromStorage: vi.fn(),
      loadWorkflowData: vi.fn(),
    });

    syncWorkflowToRoute('wf_target_789');

    expect(router.replace).toHaveBeenCalledWith({
      query: {
        headless: 'true',
        theme: 'dark',
        workflow: 'wf_target_789',
      },
    });
  });

  it('removes workflow query parameter when clearing workflow while keeping other params', () => {
    const store = useStudioStore();
    const currentFilePath = ref('');
    const route = reactive({ query: { headless: 'true', workflow: 'wf_to_remove' } });
    const router = { replace: vi.fn().mockResolvedValue(true) };

    const { clearWorkflowFromRoute } = useStudioRouteSync({
      router,
      route,
      store,
      currentFilePath,
      loadWorkflowFromStorage: vi.fn(),
      loadWorkflowData: vi.fn(),
    });

    clearWorkflowFromRoute();

    expect(router.replace).toHaveBeenCalledWith({
      query: {
        headless: 'true',
      },
    });
  });

  it('reactively syncs route query when currentFilePath changes', async () => {
    const store = useStudioStore();
    const currentFilePath = ref('');
    const route = reactive({ query: {} });
    const router = { replace: vi.fn().mockResolvedValue(true) };

    useStudioRouteSync({
      router,
      route,
      store,
      currentFilePath,
      loadWorkflowFromStorage: vi.fn(),
      loadWorkflowData: vi.fn(),
    });

    currentFilePath.value = 'wf_reactive_1';
    await new Promise((resolve) => setTimeout(resolve, 10));

    expect(router.replace).toHaveBeenCalledWith({
      query: { workflow: 'wf_reactive_1' },
    });
  });
});
