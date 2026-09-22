/**
 * Reconnecting Server-Sent Events (SSE) Client
 * Connects to /api/v1/events for task progression and telemetry logs.
 */

import { DAEMON_SSE_URL, RECONNECT_DELAY_MS } from '../../core/constants/daemon'

export type SseMessageHandler = (event: {
  type: string
  jobId?: string
  message?: string
  step?: number
  status?: string
  error?: string
  [key: string]: unknown
}) => void

export class SseClient {
  private eventSource: EventSource | null = null
  private handlers = new Set<SseMessageHandler>()
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private isExplicitlyClosed = false
  private url: string

  constructor(url: string = DAEMON_SSE_URL) {
    this.url = url
  }

  public connect(): void {
    if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
      return
    }

    this.isExplicitlyClosed = false
    this.cleanup()

    try {
      this.eventSource = new EventSource(this.url)

      this.eventSource.onmessage = (e) => {
        try {
          const parsed = JSON.parse(e.data)
          for (const handler of this.handlers) {
            handler(parsed)
          }
        } catch (err) {
          console.warn('[SSE] Failed to parse event data:', err)
        }
      }

      this.eventSource.onerror = () => {
        if (!this.isExplicitlyClosed) {
          this.scheduleReconnect()
        }
      }
    } catch (err) {
      console.warn('[SSE] Connection error:', err)
      this.scheduleReconnect()
    }
  }

  public subscribe(handler: SseMessageHandler): () => void {
    this.handlers.add(handler)
    return () => {
      this.handlers.delete(handler)
    }
  }

  public disconnect(): void {
    this.isExplicitlyClosed = true
    this.cleanup()
  }

  private scheduleReconnect(): void {
    this.cleanup()
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.reconnectTimer = setTimeout(() => {
      if (!this.isExplicitlyClosed) {
        this.connect()
      }
    }, RECONNECT_DELAY_MS)
  }

  private cleanup(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.eventSource) {
      this.eventSource.close()
      this.eventSource = null
    }
  }
}

export const globalSseClient = new SseClient()
