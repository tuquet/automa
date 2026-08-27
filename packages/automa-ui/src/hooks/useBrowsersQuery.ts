import {
  type BrowserResponse,
  type CreateBrowserRequest,
  createBrowser,
  deleteBrowser,
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
}) {
  const queryParams = computed(() => ({
    limit: toValue(params?.limit),
    offset: toValue(params?.offset),
    search: toValue(params?.search),
  }))

  return useQuery({
    queryKey: computed(() => [...BROWSERS_QUERY_KEY, queryParams.value]),
    queryFn: async () => {
      const res = await getBrowsers({
        query: {
          limit: queryParams.value.limit,
          offset: queryParams.value.offset,
          search: queryParams.value.search,
        },
      })
      const error = (res as { error?: unknown }).error
      if (error) {
        throw new Error(typeof error === 'string' ? error : 'Failed to fetch browsers')
      }
      return (res.data ?? []) as BrowserResponse[]
    },
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
