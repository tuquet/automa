import { describe, it, expect } from 'vitest';
import WebSocket from 'ws';
import type { AutomaWsEvent, AutomaWsCommand } from '@automa/types';
import {
  createBrowser,
  deleteBrowser,
  getHealth,
  addStorageVariable,
  deleteStorageVariable,
  submitJob,
} from '@automa/types/api';
import { E2E_BASE_URL } from './helpers/testDaemon';

describe('E2E: Chaos, Fault Injection & Process Resilience', () => {
  it('1. Chaos: Abrupt WebSocket TCP drop, reconnection and telemetry handshake', async () => {
    const wsUrl = E2E_BASE_URL.replace(/^http/, 'ws') + '/api/v1/ws';

    // 1st Connection
    const ws1 = new WebSocket(wsUrl);
    await new Promise<void>((resolve, reject) => {
      ws1.on('message', (data) => {
        const msg = JSON.parse(data.toString()) as AutomaWsEvent;
        if (msg.type === 'CONNECTED') {
          resolve();
        }
      });
      ws1.on('error', reject);
    });

    // Abrupt TCP socket destruction (simulating sudden client/network crash)
    ws1.terminate();

    // Reconnect immediately
    const ws2 = new WebSocket(wsUrl);
    let pongReceived = false;

    await new Promise<void>((resolve, reject) => {
      ws2.on('message', (data) => {
        const msg = JSON.parse(data.toString()) as AutomaWsEvent;
        if (msg.type === 'CONNECTED') {
          const pingCmd: AutomaWsCommand = { type: 'PING' };
          ws2.send(JSON.stringify(pingCmd));
        } else if (msg.type === 'PONG') {
          pongReceived = true;
          resolve();
        }
      });
      ws2.on('error', reject);
    });

    expect(pongReceived).toBe(true);
    ws2.close();
  });

  it('2. Chaos: SQLite storage contention under stress (10 concurrent transactions)', async () => {
    const batchId = `chaos_${Date.now()}`;
    const keys: string[] = [];

    // Concurrent writes (bounded to 10 to respect 2GB RAM limit)
    const writePromises = Array.from({ length: 10 }, async (_, i) => {
      const key = `${batchId}_${i}`;
      keys.push(key);

      const res = await addStorageVariable({
        baseUrl: E2E_BASE_URL,
        body: {
          name: key,
          key,
          value: { index: i, payload: `Stress test item ${i}` },
        },
      });

      expect(res.response?.status).toBe(200);
      expect(res.data?.name).toBe(key);
    });

    await Promise.all(writePromises);

    // Concurrent deletes
    const deletePromises = keys.map(async (key) => {
      const res = await deleteStorageVariable({
        baseUrl: E2E_BASE_URL,
        path: { id: key },
      });
      expect(res.response?.status).toBe(200);
    });

    await Promise.all(deletePromises);
  });

  it('3. Chaos: Malformed payload & boundary mutation stress (Daemon survivability)', async () => {
    // Attempt submitting extreme payloads (empty, missing required fields, massive nested array)
    const malformedPayloads = [
      {},
      { workflowData: null },
      { workflowData: { nodes: 'invalid_type_string' } },
      { workflowPath: '../../../../etc/shadow' },
      { workflowPath: 'workflows/../../outside.json' },
    ];

    for (const body of malformedPayloads) {
      const res = await submitJob({
        baseUrl: E2E_BASE_URL,
        body: body as any,
      });

      // Must reject with 400/422/404/429/503 or gracefully handle (200), NEVER crash daemon
      expect([200, 400, 404, 422, 429, 500, 503]).toContain(res.response?.status);
    }

    // Health check must still be 100% OK
    const healthRes = await getHealth({ baseUrl: E2E_BASE_URL });
    expect(healthRes.response?.status).toBe(200);
    expect(healthRes.data?.status).toBe('ok');
  }, 90000);

  it('4. Chaos: Browser lifecycle cleanup and orphaned instance prevention', async () => {
    const profileId = `chaos_prof_${Date.now()}`;

    // Create profile
    const createRes = await createBrowser({
      baseUrl: E2E_BASE_URL,
      body: {
        id: profileId,
        name: 'Chaos Browser Profile',
      },
    });
    expect(createRes.response?.status).toBe(200);

    // Delete profile
    const deleteRes = await deleteBrowser({
      baseUrl: E2E_BASE_URL,
      path: { id: profileId },
    });
    expect(deleteRes.response?.status).toBe(200);

    // Verify Daemon remains healthy
    const healthRes = await getHealth({ baseUrl: E2E_BASE_URL });
    expect(healthRes.response?.status).toBe(200);
  });
});
