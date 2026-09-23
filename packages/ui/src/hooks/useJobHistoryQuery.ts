import { getJobHistory, type JobHistoryItem, killJob } from '@automa/types/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

export const HISTORY_QUERY_KEY = ['history'] as const

export function useJobHistoryQuery(params?: {
  limit?: MaybeRefOrGetter<number | undefined>
  offset?: MaybeRefOrGetter<number | undefined>
  status?: MaybeRefOrGetter<string | undefined>
}) {
  const queryParams = computed(() => ({
    limit: toValue(params?.limit),
    offset: toValue(params?.offset),
    status: toValue(params?.status),
  }))

  return useQuery({
    queryKey: computed(() => [...HISTORY_QUERY_KEY, 'jobs', queryParams.value]),
    queryFn: async () => {
      const res = await getJobHistory({
        query: {
          limit: queryParams.value.limit,
          offset: queryParams.value.offset,
          status: queryParams.value.status,
        },
      })
      const error = (res as { error?: unknown }).error
      if (error) {
        throw new Error(typeof error === 'string' ? error : 'Failed to fetch job history')
      }
      return (res.data ?? []) as JobHistoryItem[]
    },
    staleTime: 1000 * 15,
  })
}

export function useKillJobMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (jobId: string) => {
      const res = await killJob({ path: { job_id: jobId } })
      const error = (res as { error?: unknown }).error
      if (error) {
        throw new Error(typeof error === 'string' ? error : 'Failed to terminate job')
      }
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: HISTORY_QUERY_KEY })
    },
  })
}
