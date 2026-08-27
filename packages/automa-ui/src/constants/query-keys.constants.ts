/**
 * TanStack Query Cache Keys for Server State
 */

export const QUERY_KEYS = {
  WORKFLOWS: ['workflows'] as const,
  BROWSERS: ['browsers'] as const,
  CAMPAIGNS: ['campaigns'] as const,
  TABLES: ['tables'] as const,
  VARIABLES: ['variables'] as const,
  CREDENTIALS: ['credentials'] as const,
  JOB_HISTORY: ['job_history'] as const,
  SETTINGS: ['settings'] as const,
  SYSTEM_HEALTH: ['system_health'] as const,
} as const
