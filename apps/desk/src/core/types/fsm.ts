/**
 * Finite State Machine (FSM) Execution States for Automa Desk
 * Strictly aligned with docs/SRS_BUTTON_BUSINESS_LOGIC_EVENT_DRIVEN.md
 */

export type { ButtonExecutionState } from '@automa/types'

import type { ButtonExecutionState } from '@automa/types'

export interface StateMachineContext {
  state: ButtonExecutionState
  activeJobId: string | null
  errorMessage: string | null
  startTime: number | null
  elapsedMs: number
}
