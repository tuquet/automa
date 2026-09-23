import {
  type BrowserResponse,
  type CreateBrowserRequest,
  createBrowser,
  deleteBrowser,
  type GetBrowsersData,
  getBrowsers,
  startBrowser,
  stopBrowserSession,
} from '@automa/types/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

export const BROWSERS_QUERY_KEY = ['browsers'] as const

export function useBrowsersQuery(params?: {
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
    queryKey: computed(() => [...BROWSERS_QUERY_KEY, queryParams.value]),
    queryFn: async () => {
      const query: NonNullable<GetBrowsersData['query']> = {}
      if (queryParams.value.limit !== undefined) query.limit = queryParams.value.limit
      if (queryParams.value.offset !== undefined) query.offset = queryParams.value.offset
      if (queryParams.value.search !== undefined) query.search = queryParams.value.search

      const res = await getBrowsers(Object.keys(query).length > 0 ? { query } : undefined)
      const error = (res as { error?: unknown }).error
      if (error) {
        throw new Error(typeof error === 'string' ? error : 'Failed to fetch browsers')
      }
      return (res.data ?? []) as BrowserResponse[]
    },
    enabled: isEnabled,
    staleTime: 1000 * 30, // 30s fresh cache
  })
}

export function useCreateBrowserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (body: CreateBrowserRequest) => {
      const res = await createBrowser({ body })
      const error = (res as { error?: unknown }).error
      if (error) {
        throw new Error(typeof error === 'string' ? error : 'Failed to create browser')
      }
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BROWSERS_QUERY_KEY })
    },
  })
}

export function useDeleteBrowserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (browserId: string) => {
      const res = await deleteBrowser({ path: { id: browserId } })
      const error = (res as { error?: unknown }).error
      if (error) {
        throw new Error(typeof error === 'string' ? error : 'Failed to delete browser')
      }
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BROWSERS_QUERY_KEY })
    },
  })
}

export function useStartBrowserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (browserId: string) => {
      const res = await startBrowser({ path: { id: browserId } })
      const error = (res as { error?: unknown }).error
      if (error) {
        throw new Error(typeof error === 'string' ? error : 'Failed to start browser')
      }
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BROWSERS_QUERY_KEY })
    },
  })
}

export function useStopBrowserMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (browserId: string) => {
      await stopBrowserSession({ path: { id: browserId } })
      return true
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BROWSERS_QUERY_KEY })
    },
  })
}
