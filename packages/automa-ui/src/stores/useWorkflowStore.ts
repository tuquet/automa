import type { ButtonExecutionState, Workflow, WorkflowStoreState } from '@automa/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useWorkflowStore = defineStore('workflow', () => {
  const workflow = ref<Partial<Workflow>>({
    name: 'new-workflow',
    version: '1.30.02',
    drawflow: { nodes: [], edges: [] },
  })
  const workflowId = ref<string>('')
  const isDirty = ref<boolean>(false)
  const activeNodeId = ref<string | null>(null)
  const breakpoints = ref<string[]>([])
  const fsmState = ref<ButtonExecutionState>('IDLE')
  const lintIssues = ref<WorkflowStoreState['lintIssues']>([])

  const validNodesCount = computed(() => workflow.value.drawflow?.nodes?.length || 0)
  const hasErrors = computed(() => lintIssues.value.some((i) => i.severity === 'error'))
  const isExecuting = computed(() => fsmState.value === 'EXECUTING')

  function setWorkflow(data: Partial<Workflow>, id?: string) {
    workflow.value = JSON.parse(JSON.stringify(data))
    if (id !== undefined) {
      workflowId.value = id
    }
  }

  function updateNodeData(nodeId: string, data: Record<string, unknown>) {
    if (!workflow.value.drawflow?.nodes) return
    const node = workflow.value.drawflow.nodes.find((n: { id: string }) => n.id === nodeId)
    if (node) {
      Object.assign(node.data || {}, data)
      isDirty.value = true
    }
  }

  function toggleBreakpoint(nodeId: string) {
    if (breakpoints.value.includes(nodeId)) {
      breakpoints.value = breakpoints.value.filter((id) => id !== nodeId)
    } else {
      breakpoints.value.push(nodeId)
    }
  }

  function setActiveNode(nodeId: string | null) {
    activeNodeId.value = nodeId
  }

  function markDirty(dirty = true) {
    isDirty.value = dirty
  }

  function setFsmState(state: ButtonExecutionState) {
    fsmState.value = state
  }

  function setLintIssues(issues: WorkflowStoreState['lintIssues']) {
    lintIssues.value = issues
  }

  return {
    workflow,
    workflowId,
    isDirty,
    activeNodeId,
    breakpoints,
    fsmState,
    lintIssues,
    validNodesCount,
    hasErrors,
    isExecuting,
    setWorkflow,
    updateNodeData,
    toggleBreakpoint,
    setActiveNode,
    markDirty,
    setFsmState,
    setLintIssues,
  }
})
