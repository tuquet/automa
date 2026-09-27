import { onUnmounted, getCurrentInstance } from 'vue';
import { useToast } from 'vue-toastification';
import { wsService } from '../services/ws.service';
import { useStudioStore } from '../stores/useStudioStore';
import {
  killAllBrowserProcesses,
  cancelJob,
  getDefaultBrowserProfile,
} from '../services/storage.service';

export function useStudioJobControl({
  currentFilePath,
  runModalState,
  openRunModal,
  submitWorkflowExecution,
  highlightNode,
  resetNodeHighlights,
}) {
  const toast = useToast();
  const store = useStudioStore();

  async function onRunWorkflow() {
    const triggerParams = store.getTriggerParameters || [];
    runModalState.parameters = triggerParams.map((p) => ({
      name: p.name,
      value: p.defaultValue || '',
      type: p.type || 'string',
      description: p.description || '',
      data: { required: p.required || false },
    }));

    const defaultBrowser = await getDefaultBrowserProfile();
    runModalState.browserId = defaultBrowser || 'daemon_worker';
    openRunModal();
  }

  function executeWorkflowFromModal() {
    submitWorkflowExecution(
      store.currentWorkflow,
      currentFilePath.value,
      (jobId) => {
        store.startJob(jobId);
      }
    );
  }

  async function onKillAllBrowsers() {
    try {
      await killAllBrowserProcesses();
      toast.success('Terminated all browser processes');
    } catch (err) {
      toast.error(`Kill browsers failed: ${err.message}`);
    }
  }

  async function onPauseJob() {
    if (!store.activeJobId) return;
    try {
      wsService.pauseJob(store.activeJobId);
      store.pauseJob();
    } catch (err) {
      toast.error(`Pause failed: ${err.message}`);
    }
  }

  async function onResumeJob() {
    if (!store.activeJobId) return;
    try {
      wsService.resumeJob(store.activeJobId);
      store.resumeJob();
    } catch (err) {
      toast.error(`Resume failed: ${err.message}`);
    }
  }

  async function onStopJob() {
    if (!store.activeJobId) return;
    const jobId = store.activeJobId;
    try {
      try {
        wsService.killJob(jobId);
      } catch (_) {
        // Fallback to REST cancel
      }
      await cancelJob(jobId);
      store.finishJob();
      resetNodeHighlights?.();
    } catch (err) {
      toast.error(`Stop failed: ${err.message}`);
    }
  }

  // Subscribe to real-time events from Automa Core WebSocket
  const unsubscribeWs = wsService.subscribe((msg) => {
    if (!msg || typeof msg !== 'object') return;

    if (msg.type === 'JOB_STATUS_CHANGED') {
      const status = msg.status?.toLowerCase();
      if (
        status === 'completed' ||
        status === 'failed' ||
        status === 'stopped'
      ) {
        store.finishJob();
        resetNodeHighlights?.();
        if (status === 'completed') {
          toast.success('Workflow execution completed');
        } else if (status === 'failed') {
          toast.error(`Workflow execution failed: ${msg.error || 'Error'}`);
        }
      } else if (status === 'paused') {
        store.pauseJob();
      } else if (status === 'running') {
        store.resumeJob();
      }
    }

    if (msg.type === 'workflow_finished') {
      store.finishJob();
      resetNodeHighlights?.();
      toast.success('Workflow execution completed');
    }

    // Highlight running block on canvas
    const blockId =
      msg.blockId ||
      msg.data?.blockId ||
      msg.data?.activeBlockId ||
      msg.log?.blockId;
    if (blockId) {
      highlightNode?.(blockId);
      store.setActiveBlock(blockId);
    }
  });

  if (getCurrentInstance()) {
    onUnmounted(() => {
      unsubscribeWs();
    });
  }

  return {
    onRunWorkflow,
    executeWorkflowFromModal,
    onKillAllBrowsers,
    onPauseJob,
    onResumeJob,
    onStopJob,
  };
}
