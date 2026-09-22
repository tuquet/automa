import { ref } from 'vue';
import { useToast } from 'vue-toastification';
import { fetchStorageFiles } from '../services/storage.service';

export function useStudioFileImport({
  loadWorkflowData,
  loadWorkflowFromStorage,
  onVaultWorkflowLoaded,
}) {
  const toast = useToast();

  const fileInputRef = ref(null);
  const importFileInputRef = ref(null);
  const availableWorkflows = ref([]);

  async function loadAvailableWorkflows() {
    try {
      const files = await fetchStorageFiles();
      availableWorkflows.value = Array.isArray(files)
        ? files.map((f) => ({
            id: f.id,
            name: f.name || f.id || 'Untitled',
            path: f.path || f.id,
            data: f.data || f.content,
          }))
        : [];
    } catch (_) {
      availableWorkflows.value = [];
    }
  }

  function loadWorkflowFromVault(file) {
    if (!file) return;
    if (
      typeof file === 'object' &&
      file.data &&
      typeof file.data === 'object' &&
      (file.data.drawflow ||
        file.data.name ||
        Object.keys(file.data).length > 0)
    ) {
      loadWorkflowData(file.data, file.path || file.name || file.id);
      if (onVaultWorkflowLoaded) onVaultWorkflowLoaded();
      return;
    }
    const workflowId = typeof file === 'string' ? file : file?.id;
    if (workflowId) {
      loadWorkflowFromStorage(workflowId);
      if (onVaultWorkflowLoaded) onVaultWorkflowLoaded();
    }
  }

  function openFilePicker() {
    fileInputRef.value?.click();
  }

  function triggerImportWorkflow() {
    importFileInputRef.value?.click();
  }

  function handleWorkflowFile(e, isImport = false) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        loadWorkflowData(parsed, isImport ? undefined : file.name);
        toast.success(
          `${isImport ? 'Imported' : 'Opened'} workflow: ${file.name}`
        );
      } catch (err) {
        toast.error(`Invalid workflow JSON: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  function onFileSelected(e) {
    handleWorkflowFile(e, false);
  }

  function onImportFileSelected(e) {
    handleWorkflowFile(e, true);
  }

  return {
    fileInputRef,
    importFileInputRef,
    availableWorkflows,
    loadAvailableWorkflows,
    loadWorkflowFromVault,
    openFilePicker,
    triggerImportWorkflow,
    onFileSelected,
    onImportFileSelected,
  };
}
