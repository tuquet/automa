import { type AppSettings, getAppSettings, getHealth, updateAppSettings } from '@automa/types/api'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

export const SETTINGS_QUERY_KEY = ['settings'] as const
export const HEALTH_QUERY_KEY = ['health'] as const

export function useAppSettingsQuery() {
  return useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: async () => {
      const res = await getAppSettings()
      const error = (res as { error?: unknown }).error
      if (error) {
        throw new Error(typeof error === 'string' ? error : 'Failed to fetch settings')
      }
      return res.data
    },
    staleTime: 1000 * 60,
  })
}

export function useDaemonHealthQuery() {
  return useQuery({
    queryKey: HEALTH_QUERY_KEY,
    queryFn: async () => {
      const res = await getHealth()
      const error = (res as { error?: unknown }).error
      if (error) {
        throw new Error('Daemon is offline')
      }
      return res.data
    },
    refetchInterval: 1000 * 5, // Check daemon heartbeat every 5s
    retry: 2,
  })
}

export function useUpdateSettingsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (body: AppSettings) => {
      const res = await updateAppSettings({ body })
      const error = (res as { error?: unknown }).error
      if (error) {
        throw new Error(typeof error === 'string' ? error : 'Failed to update settings')
      }
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SETTINGS_QUERY_KEY })
    },
  })
}
