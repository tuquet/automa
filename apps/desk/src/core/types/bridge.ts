/**
 * Host <-> Automa Web Studio Iframe Bridge Message Contracts
 * Aligned with automa-webe/src/studio/adapters/host-bridge.js
 */

import type { Workflow } from '@automa/types'

/**
 * Messages sent from Studio Iframe -> Host (Desk)
 */
export type StudioToHostMessage =
  | { type: 'automa:workflow-changed'; data: Partial<Workflow> }
  | { type: 'saveWorkflow'; data: Partial<Workflow> }
  | { type: 'runWorkflow'; data?: unknown }
  | { type: 'ready' }

/**
 * Messages sent from Host (Desk) -> Studio Iframe
 */
export type HostToStudioMessage =
  | { type: 'automa:set-workflow'; data: Partial<Workflow> }
  | { type: 'setWorkflow'; workflow: Partial<Workflow> }
  | { type: 'highlightNode'; nodeId: string; status: 'running' | 'completed' | 'failed' }
  | { type: 'resetNodeHighlights' }
