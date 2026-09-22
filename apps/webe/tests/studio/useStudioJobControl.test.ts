import { setActivePinia, createPinia } from 'pinia';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useStudioJobControl } from '../../src/studio/composables/useStudioJobControl';
import { useStudioStore } from '../../src/studio/stores/useStudioStore';
import { wsService } from '../../src/studio/services/ws.service';

// Mock toast
vi.mock('vue-toastification', () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
  }),
}));

// Mock storage.service
const mockCancelJob = vi.fn();
vi.mock('../../src/studio/services/storage.service', () => ({
  getDaemonBaseUrl: vi.fn().mockReturnValue('http://127.0.0.1:8765'),
  DAEMON_BASE_URL: 'http://127.0.0.1:8765',
  killAllBrowserProcesses: vi.fn(),
  cancelJob: (...args: unknown[]) => mockCancelJob(...args),
  getDefaultBrowserProfile: vi.fn().mockResolvedValue('daemon_worker'),
}));

describe('useStudioJobControl', () => {
  let wsListeners: Set<(msg: unknown) => void>;

  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    wsListeners = new Set();
    vi.spyOn(wsService, 'subscribe').mockImplementation((fn: (msg: unknown) => void) => {
      wsListeners.add(fn);
      return () => wsListeners.delete(fn);
    });
    vi.spyOn(wsService, 'pauseJob').mockImplementation(vi.fn());
    vi.spyOn(wsService, 'resumeJob').mockImplementation(vi.fn());
    vi.spyOn(wsService, 'killJob').mockImplementation(vi.fn());
  });

  it('reflects WebSocket JOB_STATUS_CHANGED events in the store', () => {
    const store = useStudioStore();
    const resetNodeHighlights = vi.fn();
    const highlightNode = vi.fn();

    useStudioJobControl({
      currentFilePath: { value: '' },
      runModalState: {},
      openRunModal: vi.fn(),
      submitWorkflowExecution: vi.fn(),
      highlightNode,
      resetNodeHighlights,
    });

    store.startJob('job_123');
    expect(store.isJobRunning).toBe(true);

    // Simulate WebSocket event from automa-core: paused
    for (const listener of wsListeners) {
      listener({ type: 'JOB_STATUS_CHANGED', jobId: 'job_123', status: 'paused' });
    }
    expect(store.isJobPaused).toBe(true);

    // Simulate WebSocket event from automa-core: completed
    for (const listener of wsListeners) {
      listener({ type: 'JOB_STATUS_CHANGED', jobId: 'job_123', status: 'completed' });
    }
    expect(store.isJobRunning).toBe(false);
    expect(store.activeJobId).toBeNull();
    expect(resetNodeHighlights).toHaveBeenCalled();
  });

  it('highlights nodes on active-block WebSocket messages', () => {
    const highlightNode = vi.fn();
    const resetNodeHighlights = vi.fn();

    useStudioJobControl({
      currentFilePath: { value: '' },
      runModalState: {},
      openRunModal: vi.fn(),
      submitWorkflowExecution: vi.fn(),
      highlightNode,
      resetNodeHighlights,
    });

    for (const listener of wsListeners) {
      listener({ type: 'active-block', data: { blockId: 'block_node_777' } });
    }
    expect(highlightNode).toHaveBeenCalledWith('block_node_777');
  });

  it('handles onStopJob cleanly by calling cancelJob and wsService.killJob', async () => {
    const store = useStudioStore();
    store.startJob('job_kill_me');

    const { onStopJob } = useStudioJobControl({
      currentFilePath: { value: '' },
      runModalState: {},
      openRunModal: vi.fn(),
      submitWorkflowExecution: vi.fn(),
      highlightNode: vi.fn(),
      resetNodeHighlights: vi.fn(),
    });

    await onStopJob();

    expect(wsService.killJob).toHaveBeenCalledWith('job_kill_me');
    expect(mockCancelJob).toHaveBeenCalledWith('job_kill_me');
    expect(store.isJobRunning).toBe(false);
    expect(store.activeJobId).toBeNull();
  });
});
