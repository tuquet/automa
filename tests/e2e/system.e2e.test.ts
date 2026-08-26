import { describe, it, expect } from 'vitest';
import {
  getHealth,
  getSystemMetrics,
  getAppSettings,
  patchAppSettings,
  lintWorkflow,
} from '@automa/types/api';
import { E2E_BASE_URL } from './helpers/testDaemon';

describe('E2E: System Telemetry, Settings & Linter API', () => {
  it('1. Health check returns OK status', async () => {
    const res = await getHealth({
      baseUrl: E2E_BASE_URL,
    });

    expect(res.response?.status).toBe(200);
    expect(res.data?.status).toBe('ok');
  });

  it('2. Query real-time system metrics (CPU, Memory, Runners)', async () => {
    const res = await getSystemMetrics({
      baseUrl: E2E_BASE_URL,
    });

    expect(res.response?.status).toBe(200);
    expect(res.data).toBeDefined();
    expect(typeof res.data?.cpuUsage).toBe('number');
    expect(typeof res.data?.memoryFree).toBe('number');
    expect(typeof res.data?.memoryTotal).toBe('number');
    expect(typeof res.data?.activeRunners).toBe('number');
  });

  it('3. Read application & grid configuration settings', async () => {
    const res = await getAppSettings({
      baseUrl: E2E_BASE_URL,
    });

    expect(res.response?.status).toBe(200);
    expect(res.data?.grid).toBeDefined();
    expect(res.data?.grid.matrix).toBeDefined();
  });

  it('4. Patch grid matrix settings', async () => {
    const res = await patchAppSettings({
      baseUrl: E2E_BASE_URL,
      body: {
        grid: {
          matrix: {
            columns: 4,
            rows: 2,
          },
        },
      },
    });

    expect(res.response?.status).toBe(200);
    expect(res.data?.grid.matrix.columns).toBe(4);
    expect(res.data?.grid.matrix.rows).toBe(2);
  });

  it('5. Lint workflow AST via Linter API', async () => {
    const res = await lintWorkflow({
      baseUrl: E2E_BASE_URL,
      body: {
        nodes: [
          {
            id: 'trigger_1',
            type: 'trigger',
            data: {},
          },
        ],
        edges: [],
      },
    });

    expect(res.response?.status).toBe(200);
    expect(res.data?.valid).toBe(true);
    expect(Array.isArray(res.data?.issues)).toBe(true);
  });
});
