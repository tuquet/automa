import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useStudioWorkflow } from '../../../src/features/studio/composables/useStudioWorkflow'
import { useStudioStore } from '../../../src/features/studio/stores/useStudioStore'

describe('useStudioWorkflow', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('imports workflow from valid JSON and marks dirty', () => {
    const studioStore = useStudioStore()
    const { importWorkflowFromJson } = useStudioWorkflow()

    const sampleJson = JSON.stringify({
      name: 'Test Import',
      nodes: [{ id: 'n1', label: 'trigger' }],
      edges: [],
    })

    const result = importWorkflowFromJson(sampleJson, 'test.workflow.json')

    expect(result.name).toBe('Test Import')
    expect(studioStore.workflow?.name).toBe('Test Import')
    expect(studioStore.isDirty).toBe(true)
    expect(studioStore.workflowPath).toBe('test.workflow.json')
    expect(studioStore.executionLogs.some((l) => l.message.includes('Test Import'))).toBe(true)
  })

  it('throws error when importing invalid JSON', () => {
    const { importWorkflowFromJson } = useStudioWorkflow()

    expect(() => {
      importWorkflowFromJson('invalid-json')
    }).toThrow()
  })

  it('exports workflow via blob download fallback when not in Tauri', async () => {
    const studioStore = useStudioStore()
    const { importWorkflowFromJson, handleExportWorkflow } = useStudioWorkflow()

    importWorkflowFromJson(
      JSON.stringify({
        name: 'Exportable Workflow',
        drawflow: { nodes: [], edges: [] },
      }),
    )

    // Mock DOM elements for download
    const appendChildMock = vi.spyOn(document.body, 'appendChild')
    const removeChildMock = vi.spyOn(document.body, 'removeChild')

    await handleExportWorkflow()

    expect(appendChildMock).toHaveBeenCalled()
    expect(removeChildMock).toHaveBeenCalled()
    expect(studioStore.executionLogs.some((l) => l.message.includes('Exported workflow'))).toBe(
      true,
    )
  })

  it('initializes a fresh workflow with trigger node', () => {
    const studioStore = useStudioStore()
    const { createNewWorkflow } = useStudioWorkflow()

    createNewWorkflow()

    expect(studioStore.workflow?.name).toBe('new-workflow')
    expect(studioStore.workflow?.drawflow?.nodes?.[0]?.label).toBe('trigger')
    expect(studioStore.isDirty).toBe(false)
  })
})
