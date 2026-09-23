import { SELECT_CATALOG, type SelectBusinessLogicSchema } from '@automa/types'

export const SELECT_REGISTRY: Record<string, SelectBusinessLogicSchema> = Object.fromEntries(
  SELECT_CATALOG.map((s) => [s.id, s as SelectBusinessLogicSchema]),
)

// Re-export canonical registries from @automa/types for centralized consumption
export {
  BUTTON_CATALOG,
  BUTTON_PROTOTYPE_REGISTRY,
  type ButtonBusinessLogicSchema,
  type ButtonContextScope,
  type ButtonExecutionState,
  getSelectSchema,
  SELECT_CATALOG,
  type SelectBusinessLogicSchema,
  type SelectContextScope,
  type SelectId,
} from '@automa/types'
export * from './query-keys.constants'
export * from './ui.constants'
