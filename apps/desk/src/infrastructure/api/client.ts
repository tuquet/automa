/**
 * OpenAPI Client Configuration for Automa Desk
 * Consumes typed client from @automa/types/api
 */

import { client } from '@automa/types/api'
import { DAEMON_BASE_URL } from '../../core/constants/daemon'

// Initialize global API client base URL
client.setConfig({
  baseUrl: DAEMON_BASE_URL,
})

export * from '@automa/types/api'
export { client }
