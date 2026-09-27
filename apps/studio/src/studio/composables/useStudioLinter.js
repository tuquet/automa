import { ref } from 'vue';
import { useToast } from 'vue-toastification';
import { lintWorkflow } from '@automa/types/api';

export function useStudioLinter(automaCoreState) {
  const toast = useToast();
  const lintIssues = ref([]);
  const isLinting = ref(false);
  let lintDebounceTimer = null;

  async function executeLint(workflow) {
    if (!automaCoreState || automaCoreState.status !== 'online') {
      lintIssues.value = [];
      return;
    }
    isLinting.value = true;
    try {
      const res = await lintWorkflow({
        baseUrl: automaCoreState.baseUrl,
        body: {
          mode: 'editor',
          targetType: 'workflow',
          nodes: workflow?.drawflow?.nodes || workflow?.nodes || [],
          edges: workflow?.drawflow?.edges || workflow?.edges || [],
          drawflow: workflow?.drawflow || null,
        },
      });
      if (res.data && res.data.issues) {
        lintIssues.value = res.data.issues;
      } else {
        lintIssues.value = [];
      }
    } catch (_) {
      lintIssues.value = [];
    } finally {
      isLinting.value = false;
    }
  }

  function runLiveLint(workflow) {
    if (lintDebounceTimer) clearTimeout(lintDebounceTimer);
    lintDebounceTimer = setTimeout(() => {
      executeLint(workflow);
    }, 800);
  }

  function triggerManualLint(workflow) {
    executeLint(workflow).then(() => {
      if (lintIssues.value.length > 0) {
        toast.warning(
          `Lint detected ${lintIssues.value.length} potential issue(s).`
        );
      }
    });
  }

  return {
    lintIssues,
    isLinting,
    runLiveLint,
    triggerManualLint,
  };
}
