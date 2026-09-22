import { ref } from 'vue';
import { useToast } from 'vue-toastification';
import {
  getStorageWorkflow,
  createStorageWorkflow,
  updateStorageWorkflow,
  deleteStorageWorkflow,
} from '@automa/types/api';
import { nanoid } from 'nanoid';
import { defaultWorkflow, emitIpcMessage } from '../adapters/host-bridge';
import { useStudioStore } from '../stores/useStudioStore';
import {
  formatApiError,
  fetchStorageWorkflows,
} from '../services/storage.service';

/**
 * Sanitizes workflow AST before loading into VueFlow canvas.
 */
// --- Pipeline for Workflow AST Sanitization ---
function ensureDrawflowStructure(workflow) {
  if (!workflow.drawflow) workflow.drawflow = { nodes: [], edges: [] };
  if (!Array.isArray(workflow.drawflow.nodes)) workflow.drawflow.nodes = [];
  if (!Array.isArray(workflow.drawflow.edges)) workflow.drawflow.edges = [];
  return workflow;
}

function normalizeNodeIdsAndData(workflow) {
  const idMap = new Map();
  workflow.drawflow.nodes.forEach((node) => {
    // Only generate a new ID if node has no valid ID
    if (!node.id || typeof node.id !== 'string' || node.id.trim() === '') {
      const oldId = node.id;
      const newId =
        node.label === 'trigger' || node.type === 'trigger'
          ? 'trigger'
          : nanoid();
      if (oldId !== undefined) {
        idMap.set(oldId, newId);
      }
      node.id = newId;
    }
    if (!node.type) node.type = 'BlockBasic';
    if (!node.data) node.data = { disableBlock: false };
  });
  return { workflow, idMap };
}

function reassignEdgeIds(workflow, idMap) {
  if (idMap.size > 0) {
    workflow.drawflow.edges.forEach((edge) => {
      if (edge.source !== undefined && idMap.has(edge.source)) {
        const newSource = idMap.get(edge.source);
        if (typeof edge.sourceHandle === 'string') {
          edge.sourceHandle = edge.sourceHandle.replace(
            String(edge.source),
            newSource
          );
        }
        edge.source = newSource;
      }
      if (edge.target !== undefined && idMap.has(edge.target)) {
        const newTarget = idMap.get(edge.target);
        if (typeof edge.targetHandle === 'string') {
          edge.targetHandle = edge.targetHandle.replace(
            String(edge.target),
            newTarget
          );
        }
        edge.target = newTarget;
      }
      if (typeof edge.id === 'string') {
        for (const [oldId, newId] of idMap.entries()) {
          const strOldId = String(oldId);
          if (strOldId && edge.id.includes(strOldId)) {
            edge.id = edge.id.replaceAll(strOldId, newId);
          }
        }
      }
      if (typeof edge.class === 'string') {
        for (const [oldId, newId] of idMap.entries()) {
          const strOldId = String(oldId);
          if (strOldId && edge.class.includes(strOldId)) {
            edge.class = edge.class.replaceAll(strOldId, newId);
          }
        }
      }
    });
  }
  return workflow;
}

function filterDanglingEdges(workflow) {
  const validNodeIds = new Set(workflow.drawflow.nodes.map((n) => n.id));
  workflow.drawflow.edges = workflow.drawflow.edges.filter(
    (edge) => validNodeIds.has(edge.source) && validNodeIds.has(edge.target)
  );
  return workflow;
}

export function sanitizeWorkflowAST(raw) {
  if (!raw || typeof raw !== 'object') {
    return structuredClone(defaultWorkflow);
  }
  const target =
    raw.data &&
    typeof raw.data === 'object' &&
    (raw.data.drawflow || raw.data.name)
      ? raw.data
      : raw;

  const clone = structuredClone(target);

  ensureDrawflowStructure(clone);
  const { workflow, idMap } = normalizeNodeIdsAndData(clone);
  reassignEdgeIds(workflow, idMap);
  filterDanglingEdges(workflow);

  return workflow;
}

export function useStudioWorkflow(automaCoreState) {
  const toast = useToast();
  const store = useStudioStore();
  const currentFilePath = ref('');
  const editorKey = ref(0);

  function loadWorkflowData(data, filePath = '') {
    const sanitized = sanitizeWorkflowAST(data);
    store.setWorkflow(sanitized);
    currentFilePath.value = filePath;
    editorKey.value += 1;
  }

  async function loadWorkflowFromStorage(workflowId) {
    if (!automaCoreState?.baseUrl || !workflowId) return;
    try {
      const res = await getStorageWorkflow({
        baseUrl: automaCoreState.baseUrl,
        path: { id: workflowId },
      });
      if (res.error) {
        toast.error(`Failed to load workflow: ${formatApiError(res.error)}`);
        return;
      }
      const item = res.data;
      let content = item?.data || item?.content || item;
      if (typeof content === 'string') {
        try {
          content = JSON.parse(content);
        } catch (_) {
          // Ignored
        }
      }

      if (content && typeof content === 'object') {
        if (!content.id && item?.id) content.id = item.id;
        if (!content.name && item?.name) content.name = item.name;
        const targetId = item?.id || workflowId;
        loadWorkflowData(content, targetId);
      } else {
        toast.error('Workflow contains invalid or empty data');
      }
    } catch (e) {
      toast.error(`Error loading workflow: ${e.message}`);
    }
  }

  function exportJson() {
    if (!store.currentWorkflow) return;
    const workflowJson = JSON.stringify(store.currentWorkflow, null, 2);
    const blob = new Blob([workflowJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const name = store.currentWorkflow.name || 'workflow';
    a.download = `${name}.automa.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function saveWorkflowToStorage() {
    if (!store.currentWorkflow) return;
    if (!automaCoreState || automaCoreState.status !== 'online') {
      toast.warning('Automa Core is offline. Exporting JSON file locally...');
      exportJson();
      return;
    }

    const wf = store.currentWorkflow;
    const id = currentFilePath.value || wf.id;
    const name = wf.name || 'Untitled Workflow';
    const description = wf.description || '';

    try {
      if (id) {
        const updateRes = await updateStorageWorkflow({
          baseUrl: automaCoreState.baseUrl,
          path: { id },
          body: {
            name,
            description,
            data: wf,
          },
        });

        if (updateRes.data) {
          store.clearDirty();
          return;
        }
      }

      const createRes = await createStorageWorkflow({
        baseUrl: automaCoreState.baseUrl,
        body: {
          id: id || undefined,
          name,
          description,
          data: wf,
        },
      });

      if (createRes.data) {
        const createdId = createRes.data.id || id;
        currentFilePath.value = createdId;
        wf.id = createdId;
        store.clearDirty();
      } else if (createRes.error) {
        toast.error(`Failed to save: ${formatApiError(createRes.error)}`);
      }
    } catch (e) {
      toast.error(`Error saving workflow: ${e.message}`);
    }
  }

  function createNewWorkflow() {
    loadWorkflowData(defaultWorkflow, '');
  }

  async function deleteWorkflowFromStorage(workflowId) {
    if (!automaCoreState?.baseUrl || !workflowId) return false;

    // 1. Runtime guard: cannot delete if workflow is actively running
    if (
      store.isJobRunning &&
      (store.activeJobId || currentFilePath.value === workflowId)
    ) {
      toast.error(
        'Cannot delete workflow while it is actively running. Please stop the job first.'
      );
      return false;
    }

    try {
      const res = await deleteStorageWorkflow({
        baseUrl: automaCoreState.baseUrl,
        path: { id: workflowId },
      });

      const isNotFound = Boolean(
        res.error &&
          (res.error.status === 404 ||
            res.response?.status === 404 ||
            (typeof res.error === 'string' &&
              res.error.toLowerCase().includes('not found')) ||
            (res.error.message &&
              res.error.message.toLowerCase().includes('not found')) ||
            (res.error.error &&
              res.error.error.toLowerCase().includes('not found')))
      );

      if (res.error && !isNotFound) {
        toast.error(`Failed to delete workflow: ${formatApiError(res.error)}`);
        return false;
      }

      toast.success(
        isNotFound ? 'Workflow discarded' : 'Workflow deleted successfully'
      );

      // If the deleted workflow is currently loaded on canvas:
      if (
        currentFilePath.value === workflowId ||
        store.currentWorkflow?.id === workflowId
      ) {
        const remainingRes = await fetchStorageWorkflows();
        const remainingList = Array.isArray(remainingRes) ? remainingRes : [];
        const filtered = remainingList.filter((w) => w.id !== workflowId);

        if (filtered.length > 0) {
          await loadWorkflowFromStorage(filtered[0].id);
        } else {
          createNewWorkflow();
        }
        store.clearDirty();
      }

      // Emit IPC notification for host environments (VS Code / Desk)
      emitIpcMessage('workflow-deleted', { id: workflowId });

      return true;
    } catch (e) {
      toast.error(`Error deleting workflow: ${e.message}`);
      return false;
    }
  }

  return {
    editorKey,
    currentFilePath,
    loadWorkflowData,
    loadWorkflowFromStorage,
    saveWorkflowToStorage,
    deleteWorkflowFromStorage,
    exportJson,
    createNewWorkflow,
  };
}
