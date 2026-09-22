import { useBindStoreSse as useUiBindStoreSse } from '@automa/ui'
import { globalSseClient } from '../infrastructure/sse/sse-client'

export function useBindStoreSse() {
  return useUiBindStoreSse(globalSseClient)
}
