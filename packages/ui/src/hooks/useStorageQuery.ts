import {
  addStorageVariable,
  deleteStorageVariable,
  getStorageCredentials,
  getStorageTableRows,
  getStorageTables,
  getStorageVariables,
  type StorageVariable,
} from '@automa/types/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

export const STORAGE_QUERY_KEY = ['storage'] as const

export function useStorageTablesQuery() {
  return useQuery({
    queryKey: computed(() => [...STORAGE_QUERY_KEY, 'tables']),
    queryFn: async () => {
      const res = await getStorageTables()
      const error = (res as { error?: unknown }).error
      if (error) {
        throw new Error(typeof error === 'string' ? error : 'Failed to fetch tables')
      }
      return res.data ?? []
    },
    staleTime: 1000 * 30,
  })
}

export function useStorageTableRowsQuery(tableId: MaybeRefOrGetter<string | null | undefined>) {
  return useQuery({
    queryKey: computed(() => [...STORAGE_QUERY_KEY, 'tables', toValue(tableId), 'rows']),
    queryFn: async () => {
      const id = toValue(tableId)
      if (!id) return []
      const res = await getStorageTableRows({ path: { id } })
      const error = (res as { error?: unknown }).error
      if (error) {
        throw new Error(typeof error === 'string' ? error : 'Failed to fetch table rows')
      }
      return res.data ?? []
    },
    enabled: computed(() => Boolean(toValue(tableId))),
  })
}

export function useStorageVariablesQuery() {
  return useQuery({
    queryKey: computed(() => [...STORAGE_QUERY_KEY, 'variables']),
    queryFn: async () => {
      const res = await getStorageVariables()
      const error = (res as { error?: unknown }).error
      if (error) {
        throw new Error(typeof error === 'string' ? error : 'Failed to fetch variables')
      }
      return res.data ?? []
    },
    staleTime: 1000 * 30,
  })
}

export function useStorageCredentialsQuery() {
  return useQuery({
    queryKey: computed(() => [...STORAGE_QUERY_KEY, 'credentials']),
    queryFn: async () => {
      const res = await getStorageCredentials()
      const error = (res as { error?: unknown }).error
      if (error) {
        throw new Error(typeof error === 'string' ? error : 'Failed to fetch credentials')
      }
      return res.data ?? []
    },
    staleTime: 1000 * 30,
  })
}

export function useCreateVariableMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (body: StorageVariable) => {
      const res = await addStorageVariable({ body })
      const error = (res as { error?: unknown }).error
      if (error) {
        throw new Error(typeof error === 'string' ? error : 'Failed to create variable')
      }
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...STORAGE_QUERY_KEY, 'variables'],
      })
    },
  })
}

export function useDeleteVariableMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteStorageVariable({ path: { id } })
      const error = (res as { error?: unknown }).error
      if (error) {
        throw new Error(typeof error === 'string' ? error : 'Failed to delete variable')
      }
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...STORAGE_QUERY_KEY, 'variables'],
      })
    },
  })
}
