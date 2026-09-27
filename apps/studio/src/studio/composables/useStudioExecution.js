import { reactive, computed } from 'vue';
import { useToast } from 'vue-toastification';
import { submitJob } from '@automa/types/api';

export function useStudioExecution(automaCoreState) {
  const toast = useToast();

  const runModalState = reactive({
    show: false,
    isSubmitting: false,
    browserId: 'daemon_worker',
    headless: false,
    closeBrowserOnFinish: false,
  });

  function openRunModal() {
    if (!automaCoreState || automaCoreState.status !== 'online') {
      toast.error('Automa Core daemon is offline. Cannot execute workflow.');
      return;
    }
    runModalState.show = true;
  }

  async function submitWorkflowExecution(workflow, currentFilePath, onFinish) {
    if (!automaCoreState || automaCoreState.status !== 'online') {
      toast.error('Automa Core is offline.');
      return;
    }

    runModalState.isSubmitting = true;
    try {
      const variables = {};
      if (Array.isArray(runModalState.parameters)) {
        for (const param of runModalState.parameters) {
          if (param.name) {
            variables[param.name] = param.value;
          }
        }
      }

      const payload = {
        workflowData: workflow,
        workflowId: workflow?.id || undefined,
        options: {
          browserId: runModalState.browserId || 'daemon_worker',
          headless: runModalState.headless,
          closeBrowserOnFinish: runModalState.closeBrowserOnFinish,
          variables: Object.keys(variables).length > 0 ? variables : undefined,
        },
      };
      if (currentFilePath) {
        payload.workflowPath = currentFilePath;
      }

      const res = await submitJob({
        baseUrl: automaCoreState.baseUrl,
        body: payload,
      });

      if (res.data && res.data.jobId) {
        toast.success(
          `Workflow submitted! Job ID: ${res.data.jobId.slice(0, 8)}`
        );
        runModalState.show = false;
        if (typeof onFinish === 'function') {
          onFinish(res.data.jobId);
        }
      } else if (res.error) {
        toast.error(`Execution failed: ${res.error.message || 'Error'}`);
      }
    } catch (e) {
      toast.error(`Failed to submit job: ${e.message}`);
    } finally {
      runModalState.isSubmitting = false;
    }
  }

  const isParamsValid = computed(() => {
    if (!runModalState.parameters || !runModalState.parameters.length) {
      return true;
    }
    for (const param of runModalState.parameters) {
      const isMissing =
        param.value === undefined || param.value === '' || param.value === null;
      if (param.data?.required && isMissing) {
        return false;
      }
    }
    return true;
  });

  return {
    runModalState,
    isParamsValid,
    openRunModal,
    submitWorkflowExecution,
  };
}
