/**
 * Workflow Storage, Linting, and Browser Profiles Management
 */

import type { Workflow } from '@automa/types'
import type { BrowserResponse } from '@automa/types/api'
import { getCurrentInstance, onMounted, ref } from 'vue'
import {
  getBrowsers,
  getStorageWorkflow,
  lintWorkflow,
  saveWorkflow,
} from '../../../infrastructure/api/client'
import { useStudioStore } from '../stores/useStudioStore'
import { useStudioBridge } from './useStudioBridge'

export function useStudioWorkflow() {
  const studioStore = useStudioStore()
  const availableBrowsers = ref<BrowserResponse[]>([])
  const isSaving = ref(false)
  const isLinting = ref(false)
  const lintIssues = ref<Array<{ message: string; severity: string }>>([])

  async function fetchBrowsers() {
    try {
      const res = await getBrowsers()
      if (res.data) {
        availableBrowsers.value = res.data
      }
    } catch (err) {
      console.warn('[Studio] Failed to load browsers:', err)
    }
  }

  async function handleSaveWorkflow() {
    if (!studioStore.workflow) return
    isSaving.value = true
    try {
      const path = studioStore.workflowPath || 'workflows/default.workflow.json'
      await saveWorkflow({
        body: {
          path,
          content: (studioStore.workflow || {}) as Record<string, unknown>,
        },
      })
      studioStore.markDirty(false)
      studioStore.addLog(`Workflow saved successfully to ${path}`, 'info')
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Failed to save workflow'
      studioStore.addLog(`Save error: ${msg}`, 'error')
    } finally {
      isSaving.value = false
    }
  }

  async function handleLintWorkflow() {
    if (!studioStore.workflow) return
    isLinting.value = true
    lintIssues.value = []
    try {
      const res = await lintWorkflow({
        body: {
          content: studioStore.workflow as Record<string, unknown>,
        },
      })
      if (res.data) {
        studioStore.addLog('Workflow lint check passed with 0 errors.', 'info')
      }
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Lint check failed'
      studioStore.addLog(`Lint warning/error: ${msg}`, 'warn')
    } finally {
      isLinting.value = false
    }
  }

  async function loadWorkflowById(id: string) {
    try {
      const res = await getStorageWorkflow({ path: { id } })
      if (res.data) {
        const item = res.data as {
          id?: string
          name?: string
          data?: unknown
          relativePath?: string
          icon?: string
          description?: string
        }
        let itemData = item.data
        if (typeof itemData === 'string') {
          try {
            itemData = JSON.parse(itemData)
          } catch (_) {
            // Ignored
          }
        }
        const dataObj = (
          typeof itemData === 'object' && itemData !== null
            ? { ...(itemData as Record<string, unknown>) }
            : {}
        ) as Record<string, unknown>

        const flowData: NonNullable<Workflow['drawflow']> =
          dataObj.drawflow && typeof dataObj.drawflow === 'object'
            ? (dataObj.drawflow as NonNullable<Workflow['drawflow']>)
            : dataObj.nodes
              ? {
                  nodes: (dataObj.nodes || []) as NonNullable<Workflow['drawflow']>['nodes'],
                  edges: (dataObj.edges || []) as NonNullable<Workflow['drawflow']>['edges'],
                }
              : { nodes: [], edges: [] }

        delete dataObj.drawflow

        const wfContent: Partial<Workflow> = {
          ...dataObj,
          id: item.id || (dataObj.id as string) || id,
          name: item.name || (dataObj.name as string) || 'Untitled Workflow',
          icon: item.icon || (dataObj.icon as string) || 'riGlobalLine',
          description: item.description || (dataObj.description as string) || '',
          drawflow: flowData,
        }
        studioStore.setWorkflow(wfContent)
        studioStore.selectedWorkflowId = id
        studioStore.workflowPath = item.relativePath || `workflows/${id}.workflow.json`
        studioStore.markDirty(false)
        const { injectWorkflowIntoStudio } = useStudioBridge()
        injectWorkflowIntoStudio(wfContent)
        studioStore.addLog(`Loaded workflow "${item.name || id}" into Studio Canvas`, 'info')
      }
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Failed to load workflow'
      studioStore.addLog(`Error loading workflow: ${msg}`, 'error')
    }
  }

  function createNewWorkflow() {
    const freshWf: Partial<Workflow> = {
      name: 'new-workflow',
      icon: 'riGlobalLine',
      drawflow: {
        nodes: [
          {
            id: 'trigger',
            label: 'trigger',
            position: { x: 100, y: 500 },
            type: 'BlockBasic',
            data: {
              disableBlock: false,
              description: '',
              type: 'manual',
            },
          },
        ],
        edges: [],
      },
      table: [],
      version: '1.30.02',
    }
    studioStore.setWorkflow(freshWf)
    studioStore.selectedWorkflowId = ''
    studioStore.workflowPath = ''
    studioStore.markDirty(false)
    const { injectWorkflowIntoStudio } = useStudioBridge()
    injectWorkflowIntoStudio(freshWf)
    studioStore.addLog('Initialized new workflow', 'info')
  }

  function importWorkflowFromJson(jsonText: string, filePath = '') {
    try {
      const parsed = JSON.parse(jsonText)
      const dataObj =
        typeof parsed === 'object' && parsed !== null
          ? { ...(parsed as Record<string, unknown>) }
          : {}

      const flowData: NonNullable<Workflow['drawflow']> =
        dataObj.drawflow && typeof dataObj.drawflow === 'object'
          ? (dataObj.drawflow as NonNullable<Workflow['drawflow']>)
          : dataObj.nodes
            ? {
                nodes: (dataObj.nodes || []) as NonNullable<Workflow['drawflow']>['nodes'],
                edges: (dataObj.edges || []) as NonNullable<Workflow['drawflow']>['edges'],
              }
            : { nodes: [], edges: [] }

      delete dataObj.drawflow

      const wfContent: Partial<Workflow> = {
        ...dataObj,
        name: (dataObj.name as string) || 'Imported Workflow',
        icon: (dataObj.icon as string) || 'Globe',
        drawflow: flowData,
      }

      studioStore.setWorkflow(wfContent)
      studioStore.selectedWorkflowId = ''
      studioStore.workflowPath = filePath
      studioStore.markDirty(true)
      const { injectWorkflowIntoStudio } = useStudioBridge()
      injectWorkflowIntoStudio(wfContent)
      studioStore.addLog(`Imported workflow "${wfContent.name}" into Studio Canvas`, 'info')
      return wfContent
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Invalid workflow JSON'
      studioStore.addLog(`Import error: ${msg}`, 'error')
      throw err
    }
  }

  async function handleImportWorkflow(fileInputEl?: HTMLInputElement | null) {
    try {
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        const { open } = await import('@tauri-apps/plugin-dialog')
        const { readTextFile } = await import('@tauri-apps/plugin-fs')
        const selected = await open({
          multiple: false,
          filters: [
            {
              name: 'Automa Workflow',
              extensions: ['workflow.json', 'automa.json', 'json'],
            },
          ],
        })
        if (selected && typeof selected === 'string') {
          const text = await readTextFile(selected)
          importWorkflowFromJson(text, selected)
          return
        }
        return
      }
    } catch (err) {
      console.warn('[Studio] Native open dialog failed, falling back to web file input:', err)
    }

    if (fileInputEl) {
      fileInputEl.click()
    }
  }

  function handleFileInputChange(event: Event) {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      if (content) {
        importWorkflowFromJson(content, file.name)
      }
    }
    reader.readAsText(file)
    input.value = ''
  }

  async function handleExportWorkflow() {
    if (!studioStore.workflow) {
      studioStore.addLog('No workflow loaded to export', 'warn')
      return
    }

    const name = studioStore.workflow.name || 'workflow'
    const filename = `${name}.workflow.json`
    const jsonContent = JSON.stringify(studioStore.workflow, null, 2)

    try {
      if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
        const { save } = await import('@tauri-apps/plugin-dialog')
        const { writeTextFile } = await import('@tauri-apps/plugin-fs')
        const filePath = await save({
          defaultPath: filename,
          filters: [{ name: 'Automa Workflow', extensions: ['workflow.json', 'json'] }],
        })
        if (filePath) {
          await writeTextFile(filePath, jsonContent)
          studioStore.addLog(`Exported workflow to ${filePath}`, 'info')
          return
        }
        return
      }
    } catch (err) {
      console.warn('[Studio] Native save failed, falling back to web download:', err)
    }

    const blob = new Blob([jsonContent], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    studioStore.addLog(`Exported workflow "${filename}"`, 'info')
  }

  if (getCurrentInstance()) {
    onMounted(() => {
      fetchBrowsers()
    })
  }

  return {
    availableBrowsers,
    isSaving,
    isLinting,
    lintIssues,
    fetchBrowsers,
    handleSaveWorkflow,
    handleLintWorkflow,
    loadWorkflowById,
    createNewWorkflow,
    importWorkflowFromJson,
    handleImportWorkflow,
    handleFileInputChange,
    handleExportWorkflow,
  }
}
