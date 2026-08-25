import { describe, it, expect } from 'vitest';
import WebSocket from 'ws';
import { E2E_BASE_URL } from './helpers/testDaemon';

describe('E2E: Bidirectional WebSocket Communication (/api/v1/ws)', () => {
  it('1. Connect to WebSocket, verify handshake greeting and exchange PING / PONG', async () => {
    const wsUrl = E2E_BASE_URL.replace(/^http/, 'ws') + '/api/v1/ws';
    const ws = new WebSocket(wsUrl);

    const messages: any[] = [];

    await new Promise<void>((resolve, reject) => {
      ws.on('open', () => {
        // Connected
      });

      ws.on('message', (data) => {
        const parsed = JSON.parse(data.toString());
        messages.push(parsed);

        if (parsed.type === 'CONNECTED') {
          // Send PING after greeting
          ws.send(JSON.stringify({ type: 'PING' }));
        } else if (parsed.type === 'PONG') {
          resolve();
        }
      });

      ws.on('error', (err) => {
        reject(err);
      });
    });

    expect(messages.some((m) => m.type === 'CONNECTED')).toBe(true);
    expect(messages.some((m) => m.type === 'PONG')).toBe(true);

    ws.close();
  });
});
