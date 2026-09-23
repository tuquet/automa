import type { StorageStoreState } from '@automa/types'
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

export const useStorageStore = defineStore('storage', () => {
  const tables = ref<StorageStoreState['tables']>([])
  const activeTableId = ref<string | null>(null)
  const activeTableRows = ref<StorageStoreState['activeTableRows']>([])
  const variables = ref<StorageStoreState['variables']>([])
  const credentials = ref<StorageStoreState['credentials']>([])
  const isLoading = ref<boolean>(false)

  const tableCount = computed(() => tables.value.length)
  const variableCount = computed(() => variables.value.length)
  const credentialCount = computed(() => credentials.value.length)

  function setTables(items: StorageStoreState['tables']) {
    tables.value = items
  }

  function setActiveTable(id: string | null, rows: StorageStoreState['activeTableRows'] = []) {
    activeTableId.value = id
    activeTableRows.value = rows
  }

  function setVariables(items: StorageStoreState['variables']) {
    variables.value = items
  }

  function setCredentials(items: StorageStoreState['credentials']) {
    credentials.value = items
  }

  function addVariable(variable: StorageStoreState['variables'][0]) {
    const idx = variables.value.findIndex((v) => v.key === variable.key)
    if (idx >= 0) {
      variables.value[idx] = variable
    } else {
      variables.value.push(variable)
    }
  }

  function removeVariable(key: string) {
    variables.value = variables.value.filter((v) => v.key !== key)
  }

  function removeCredential(keyOrId: string) {
    credentials.value = credentials.value.filter((c) => c.id !== keyOrId && c.key !== keyOrId)
  }

  return {
    tables,
    activeTableId,
    activeTableRows,
    variables,
    credentials,
    isLoading,
    tableCount,
    variableCount,
    credentialCount,
    setTables,
    setActiveTable,
    setVariables,
    setCredentials,
    addVariable,
    removeVariable,
    removeCredential,
  }
})
