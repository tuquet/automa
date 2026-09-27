import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { emitIpcMessage } from '../adapters/host-bridge';

export const useStudioStore = defineStore('studio', () => {
  // --- STATE ---
  const currentWorkflow = ref(null);
  const isDirty = ref(false);
  const activeJobId = ref(null);
  const isJobRunning = ref(false);
  const isJobPaused = ref(false);
  const activeBlockId = ref(null);

  // --- GETTERS ---
  const getNodes = computed(() => currentWorkflow.value?.drawflow?.nodes || []);
  const getEdges = computed(() => currentWorkflow.value?.drawflow?.edges || []);
  const getNodesCount = computed(() => getNodes.value.length);

  const getTriggerParameters = computed(() => {
    const triggerNode = getNodes.value.find(
      (n) => n.label === 'trigger' || n.type === 'trigger'
    );
    const params = triggerNode?.data?.parameters;
    return Array.isArray(params) ? params : [];
  });

  // --- ACTIONS ---
  function setWorkflow(workflow) {
    currentWorkflow.value = workflow;
    isDirty.value = false;
  }

  function markDirty() {
    if (!isDirty.value) {
      isDirty.value = true;
    }
  }

  function clearDirty() {
    isDirty.value = false;
  }

  function updateGraphLayout(nodes, edges) {
    if (!currentWorkflow.value) return;
    if (!currentWorkflow.value.drawflow) {
      currentWorkflow.value.drawflow = { nodes: [], edges: [] };
    }

    currentWorkflow.value.drawflow.nodes = nodes;
    currentWorkflow.value.drawflow.edges = edges;
    markDirty();
  }

  function updateWorkflowDetails(details) {
    if (!currentWorkflow.value) return;
    Object.assign(currentWorkflow.value, details);
    markDirty();
  }

  function updateNodeData(id, data) {
    if (!currentWorkflow.value?.drawflow?.nodes) return;
    const target = currentWorkflow.value.drawflow.nodes.find(
      (n) => n.id === id
    );
    if (target) {
      target.data = { ...(target.data || {}), ...data };
      markDirty();
    }
  }

  function addNode(node) {
    if (!currentWorkflow.value) return;
    if (!currentWorkflow.value.drawflow) {
      currentWorkflow.value.drawflow = { nodes: [], edges: [] };
    }
    const existing = currentWorkflow.value.drawflow.nodes.find(
      (n) => n.id === node.id
    );
    if (!existing) {
      currentWorkflow.value.drawflow.nodes.push(node);
      markDirty();
    }
  }

  function getNode(id) {
    return getNodes.value.find((n) => n.id === id) || null;
  }

  function deleteNode(id) {
    if (!currentWorkflow.value?.drawflow?.nodes) return;
    const index = currentWorkflow.value.drawflow.nodes.findIndex(
      (n) => n.id === id
    );
    if (index !== -1) {
      currentWorkflow.value.drawflow.nodes.splice(index, 1);
      markDirty();
    }
  }

  function startJob(jobId) {
    activeJobId.value = jobId;
    isJobRunning.value = true;
    isJobPaused.value = false;
  }

  function pauseJob() {
    isJobPaused.value = true;
  }

  function resumeJob() {
    isJobPaused.value = false;
  }

  function finishJob() {
    activeJobId.value = null;
    isJobRunning.value = false;
    isJobPaused.value = false;
    activeBlockId.value = null;
  }

  function setActiveBlock(blockId) {
    activeBlockId.value = blockId;
  }

  // --- IPC SYNC ---
  // Automatically notify parent environments when workflow is mutated
  watch(
    [currentWorkflow, isDirty],
    () => {
      emitIpcMessage('workflow-changed', currentWorkflow.value);
    },
    { deep: true }
  );

  return {
    currentWorkflow,
    isDirty,
    activeJobId,
    isJobRunning,
    isJobPaused,
    activeBlockId,

    // Getters
    getNodes,
    getEdges,
    getNodesCount,
    getTriggerParameters,

    // Actions
    setWorkflow,
    markDirty,
    clearDirty,
    updateGraphLayout,
    updateWorkflowDetails,
    updateNodeData,
    addNode,
    getNode,
    deleteNode,
    startJob,
    pauseJob,
    resumeJob,
    finishJob,
    setActiveBlock,
  };
});
