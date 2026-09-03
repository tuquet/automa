import {
  type CreateWorkflowStorageRequest,
  createStorageWorkflow,
  deleteStorageWorkflow,
  type GetStorageWorkflowsData,
  getStorageWorkflow,
  getStorageWorkflows,
  type UpdateWorkflowStorageRequest,
  updateStorageWorkflow,
  type WorkflowStorageItem,
} from '@automa/types/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

export const WORKFLOWS_QUERY_KEY = ['workflows'] as const

export function useWorkflowsQuery(params?: {
  limit?: MaybeRefOrGetter<number | undefined>
  offset?: MaybeRefOrGetter<number | undefined>
  search?: MaybeRefOrGetter<string | undefined>
  enabled?: MaybeRefOrGetter<boolean | undefined>
}) {
  const queryParams = computed(() => ({
    limit: toValue(params?.limit),
    offset: toValue(params?.offset),
    search: toValue(params?.search),
  }))

  const isEnabled = computed(() =>
    params?.enabled !== undefined ? Boolean(toValue(params.enabled)) : true,
  )

  return useQuery({
    queryKey: computed(() => [...WORKFLOWS_QUERY_KEY, queryParams.value]),
    queryFn: async () => {
      const query: NonNullable<GetStorageWorkflowsData['query']> = {}
      if (queryParams.value.limit !== undefined) query.limit = queryParams.value.limit
      if (queryParams.value.offset !== undefined) query.offset = queryParams.value.offset
      if (queryParams.value.search !== undefined) query.search = queryParams.value.search

      const res = await getStorageWorkflows(Object.keys(query).length > 0 ? { query } : undefined)
      const error = (res as { error?: unknown }).error
      if (error) {
        throw new Error(typeof error === 'string' ? error : 'Failed to fetch workflows')
      }
      return (res.data ?? []) as WorkflowStorageItem[]
    },
    enabled: isEnabled,
    staleTime: 1000 * 30,
  })
}

export function useWorkflowDetailQuery(id: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: computed(() => [...WORKFLOWS_QUERY_KEY, 'detail', toValue(id)]),
    queryFn: async () => {
      const workflowId = toValue(id)
      if (!workflowId) return null
      const res = await getStorageWorkflow({ path: { id: workflowId } })
      const error = (res as { error?: unknown }).error
      if (error) {
        throw new Error(typeof error === 'string' ? error : 'Failed to fetch workflow')
      }
      return res.data
    },
    enabled: computed(() => Boolean(toValue(id))),
  })
}

export function useCreateWorkflowMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (body: CreateWorkflowStorageRequest) => {
      const res = await createStorageWorkflow({ body })
      const error = (res as { error?: unknown }).error
      if (error) {
        throw new Error(typeof error === 'string' ? error : 'Failed to create workflow')
      }
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKFLOWS_QUERY_KEY })
    },
  })
}

export function useUpdateWorkflowMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, body }: { id: string; body: UpdateWorkflowStorageRequest }) => {
      const res = await updateStorageWorkflow({ path: { id }, body })
      const error = (res as { error?: unknown }).error
      if (error) {
        throw new Error(typeof error === 'string' ? error : 'Failed to update workflow')
      }
      return res.data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: WORKFLOWS_QUERY_KEY })
      queryClient.invalidateQueries({
        queryKey: [...WORKFLOWS_QUERY_KEY, 'detail', variables.id],
      })
    },
  })
}

export function useDeleteWorkflowMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await deleteStorageWorkflow({ path: { id } })
      const error = (res as { error?: unknown }).error
      if (error) {
        throw new Error(typeof error === 'string' ? error : 'Failed to delete workflow')
      }
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKFLOWS_QUERY_KEY })
    },
  })
}
