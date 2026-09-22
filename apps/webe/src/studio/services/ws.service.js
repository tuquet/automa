/**
 * Automa Studio WebSocket Service
 * Connects to /api/v1/ws on Automa Core for low-latency 2-way live debugging.
 */

import { getDaemonBaseUrl } from './storage.service';

class StudioWebSocketService {
  constructor() {
    this.ws = null;
    this.baseUrl = `${getDaemonBaseUrl().replace(/^http/, 'ws')}/api/v1/ws`;
    this.listeners = new Set();
    this.reconnectTimer = null;
    this.isConnected = false;
  }

  connect(baseUrl) {
    const target = baseUrl || getDaemonBaseUrl();
    const parsed = target.replace(/^http/, 'ws');
    this.baseUrl = `${parsed.replace(/\/$/, '')}/api/v1/ws`;

    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    try {
      this.ws = new WebSocket(this.baseUrl);

      this.ws.onopen = () => {
        this.isConnected = true;
        this.notifyListeners({ type: 'WS_CONNECTED' });
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.notifyListeners(message);
        } catch (_) {
          // Ignored non-JSON messages
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.notifyListeners({ type: 'WS_DISCONNECTED' });
        this.scheduleReconnect();
      };

      this.ws.onerror = () => {
        this.isConnected = false;
      };
    } catch (_) {
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 4000);
  }

  send(command) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }
    this.ws.send(JSON.stringify(command));
    return true;
  }

  pauseJob(jobId) {
    return this.send({ type: 'PAUSE_JOB', jobId });
  }

  resumeJob(jobId) {
    return this.send({ type: 'RESUME_JOB', jobId });
  }

  killJob(jobId) {
    return this.send({ type: 'KILL_JOB', jobId });
  }

  ping() {
    return this.send({ type: 'PING' });
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners(data) {
    this.listeners.forEach((listener) => {
      try {
        listener(data);
      } catch (_) {
        // Ignored listener error
      }
    });
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
  }
}

export const wsService = new StudioWebSocketService();
