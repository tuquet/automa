import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useStudioWorkflow } from '../../src/studio/composables/useStudioWorkflow';
import { useStudioStore } from '../../src/studio/stores/useStudioStore';

// Mock toast
const mockToast = {
  success: vi.fn(),
  error: vi.fn(),
  warning: vi.fn(),
  info: vi.fn(),
};
vi.mock('vue-toastification', () => ({
  useToast: () => mockToast,
}));

// Mock @automa/types/api
const mockGetStorageWorkflow = vi.fn();
const mockCreateStorageWorkflow = vi.fn();
const mockUpdateStorageWorkflow = vi.fn();
const mockDeleteStorageWorkflow = vi.fn();

vi.mock('@automa/types/api', () => ({
  getStorageWorkflow: (...args: unknown[]) => mockGetStorageWorkflow(...args),
  createStorageWorkflow: (...args: unknown[]) => mockCreateStorageWorkflow(...args),
  updateStorageWorkflow: (...args: unknown[]) => mockUpdateStorageWorkflow(...args),
  deleteStorageWorkflow: (...args: unknown[]) => mockDeleteStorageWorkflow(...args),
}));

// Mock storage.service
const mockFetchStorageWorkflows = vi.fn();
vi.mock('../../src/studio/services/storage.service', () => ({
  formatApiError: (err: unknown) => (err ? String(err) : 'Unknown error'),
  fetchStorageWorkflows: () => mockFetchStorageWorkflows(),
}));

// Mock host-bridge
const mockEmitIpcMessage = vi.fn();
vi.mock('../../src/studio/adapters/host-bridge', () => ({
  defaultWorkflow: {
    name: 'New Workflow',
    drawflow: { nodes: [], edges: [] },
  },
  emitIpcMessage: (...args: unknown[]) => mockEmitIpcMessage(...args),
}));

describe('useStudioWorkflow', () => {
  const fakeCoreState = {
    baseUrl: 'http://127.0.0.1:8765',
    status: 'online',
  };

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('loads workflow data and updates store and currentFilePath', () => {
    const store = useStudioStore();
    const { loadWorkflowData, currentFilePath } = useStudioWorkflow(fakeCoreState);

    loadWorkflowData(
      {
        id: 'wf-100',
        name: 'Test Workflow',
        drawflow: { nodes: [{ id: 'n1', label: 'trigger' }], edges: [] },
      },
      'wf-100'
    );

    expect(store.currentWorkflow).not.toBeNull();
    expect(store.currentWorkflow?.name).toBe('Test Workflow');
    expect(currentFilePath.value).toBe('wf-100');
  });

  it('loads workflow from storage via SQLite API', async () => {
    mockGetStorageWorkflow.mockResolvedValue({
      data: {
        id: 'wf-200',
        name: 'SQLite Workflow',
        data: {
          drawflow: { nodes: [{ id: 'n1' }], edges: [] },
        },
      },
    });

    const store = useStudioStore();
    const { loadWorkflowFromStorage, currentFilePath } = useStudioWorkflow(fakeCoreState);

    await loadWorkflowFromStorage('wf-200');

    expect(mockGetStorageWorkflow).toHaveBeenCalledWith({
      baseUrl: fakeCoreState.baseUrl,
      path: { id: 'wf-200' },
    });
    expect(store.currentWorkflow?.name).toBe('SQLite Workflow');
    expect(currentFilePath.value).toBe('wf-200');
  });

  it('blocks deletion when a job is actively running for the workflow', async () => {
    const store = useStudioStore();
    store.startJob('job_active');

    const { deleteWorkflowFromStorage, currentFilePath } = useStudioWorkflow(fakeCoreState);
    currentFilePath.value = 'wf-running';

    const success = await deleteWorkflowFromStorage('wf-running');

    expect(success).toBe(false);
    expect(mockDeleteStorageWorkflow).not.toHaveBeenCalled();
    expect(mockToast.error).toHaveBeenCalledWith(
      expect.stringContaining('Cannot delete workflow while it is actively running')
    );
  });

  it('deletes workflow from storage and switches to next remaining workflow', async () => {
    const store = useStudioStore();
    const { deleteWorkflowFromStorage, currentFilePath } = useStudioWorkflow(fakeCoreState);

    currentFilePath.value = 'wf-to-delete';
    store.setWorkflow({ id: 'wf-to-delete', name: 'To Delete', drawflow: { nodes: [], edges: [] } });
    store.markDirty();

    mockDeleteStorageWorkflow.mockResolvedValue({ data: { success: true } });
    mockFetchStorageWorkflows.mockResolvedValue([
      { id: 'wf-remaining', name: 'Remaining Workflow' },
    ]);
    mockGetStorageWorkflow.mockResolvedValue({
      data: {
        id: 'wf-remaining',
        name: 'Remaining Workflow',
        data: { drawflow: { nodes: [], edges: [] } },
      },
    });

    const success = await deleteWorkflowFromStorage('wf-to-delete');

    expect(success).toBe(true);
    expect(mockDeleteStorageWorkflow).toHaveBeenCalledWith({
      baseUrl: fakeCoreState.baseUrl,
      path: { id: 'wf-to-delete' },
    });
    expect(mockToast.success).toHaveBeenCalledWith('Workflow deleted successfully');
    expect(mockEmitIpcMessage).toHaveBeenCalledWith('workflow-deleted', { id: 'wf-to-delete' });
    expect(store.isDirty).toBe(false);
    expect(currentFilePath.value).toBe('wf-remaining');
  });

  it('deletes workflow from storage and creates new blank workflow if no workflows remain', async () => {
    const store = useStudioStore();
    const { deleteWorkflowFromStorage, currentFilePath } = useStudioWorkflow(fakeCoreState);

    currentFilePath.value = 'wf-last';
    store.setWorkflow({ id: 'wf-last', name: 'Last Workflow', drawflow: { nodes: [], edges: [] } });

    mockDeleteStorageWorkflow.mockResolvedValue({ data: { success: true } });
    mockFetchStorageWorkflows.mockResolvedValue([]);

    const success = await deleteWorkflowFromStorage('wf-last');

    expect(success).toBe(true);
    expect(mockEmitIpcMessage).toHaveBeenCalledWith('workflow-deleted', { id: 'wf-last' });
    expect(currentFilePath.value).toBe('');
    expect(store.currentWorkflow?.name).toBe('New Workflow');
  });

  it('handles 404 Not Found gracefully when deleting an unsaved workflow or workflow not in database', async () => {
    const store = useStudioStore();
    const { deleteWorkflowFromStorage, currentFilePath } = useStudioWorkflow(fakeCoreState);

    const unsavedId = 'EcO3D4w2Uzx5iumy3ojqK';
    currentFilePath.value = unsavedId;
    store.setWorkflow({ id: unsavedId, name: 'Unsaved Draft', drawflow: { nodes: [], edges: [] } });

    mockDeleteStorageWorkflow.mockResolvedValue({
      error: {
        status: 404,
        message: `Workflow '${unsavedId}' not found in database`,
      },
    });
    mockFetchStorageWorkflows.mockResolvedValue([]);

    const success = await deleteWorkflowFromStorage(unsavedId);

    expect(success).toBe(true);
    expect(mockToast.success).toHaveBeenCalledWith('Workflow discarded');
    expect(mockEmitIpcMessage).toHaveBeenCalledWith('workflow-deleted', { id: unsavedId });
    expect(currentFilePath.value).toBe('');
    expect(store.currentWorkflow?.name).toBe('New Workflow');
  });
});
