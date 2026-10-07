import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  getBrowsers,
  createBrowser,
  getBrowserDetail,
  deleteBrowser,
  getHealth,
  getSystemMetrics,
  submitJob,
  getJobStatus,
  getJobExecutionLogs,
  killJob,
  addStorageVariable,
  deleteStorageVariable,
  type BrowserProfile,
} from '@automa/types/api';
import { E2E_BASE_URL, isDaemonOnline } from './helpers/testDaemon';

const daemonReady = await isDaemonOnline();

describe.runIf(daemonReady)('E2E: Unified Automa Browser & Execution Integration', () => {
  describe('1. Browser Profiles Lifecycle', () => {
    const profileId = `prof_e2e_${Date.now()}`;

    it('creates, inspects, and deletes browser profile', async () => {
      // Create profile
      const createRes = await createBrowser({
        baseUrl: E2E_BASE_URL,
        body: {
          id: profileId,
          name: 'E2E Testing Profile',
          user_agent: 'TuquetBrowser/1.0',
          timezone: 'Asia/Ho_Chi_Minh',
        },
      });
      expect(createRes.response?.status).toBe(200);

      // List profiles
      const listRes = await getBrowsers({ baseUrl: E2E_BASE_URL });
      expect(listRes.response?.status).toBe(200);
      expect(listRes.data?.some((b: BrowserProfile) => b.id === profileId)).toBe(true);

      // Detail
      const detailRes = await getBrowserDetail({
        baseUrl: E2E_BASE_URL,
        path: { id: profileId },
      });
      expect(detailRes.response?.status).toBe(200);
      expect(detailRes.data?.name).toBe('E2E Testing Profile');

      // Delete profile
      const delRes = await deleteBrowser({
        baseUrl: E2E_BASE_URL,
        path: { id: profileId },
      });
      expect(delRes.response?.status).toBe(200);
    });
  });

  describe('2. Headless DOM Workflow Execution', () => {
    it('executes basic in-memory DOM workflow', async () => {
      const workflowData = {
        name: 'Simple DOM Workflow',
        nodes: [
          { id: 'start', type: 'trigger', label: 'trigger' },
          { id: 'tab', type: 'new-tab', label: 'new-tab', data: { url: 'data:text/html,<h1>Hello Automa</h1>' } },
        ],
        edges: [{ source: 'start', target: 'tab' }],
      };

      const submitRes = await submitJob({
        baseUrl: E2E_BASE_URL,
        body: {
          workflowData,
          options: { headless: true, closeBrowserOnFinish: true },
        },
      });

      expect([200, 429, 503]).toContain(submitRes.response?.status);

      if (submitRes.data?.jobId) {
        const jobId = submitRes.data.jobId;
        // Verify job status can be fetched
        const statusRes = await getJobStatus({
          baseUrl: E2E_BASE_URL,
          path: { job_id: jobId },
        });
        expect([200, 404]).toContain(statusRes.response?.status);
      }
    });
  });

  describe('3. Concurrency & Load Stress', () => {
    it('handles 20 concurrent health and metrics requests', async () => {
      const promises = Array.from({ length: 20 }, async (_, i) => {
        if (i % 2 === 0) {
          const res = await getHealth({ baseUrl: E2E_BASE_URL });
          expect(res.response?.status).toBe(200);
        } else {
          const res = await getSystemMetrics({ baseUrl: E2E_BASE_URL });
          expect(res.response?.status).toBe(200);
        }
      });
      await Promise.all(promises);
    });

    it('handles 10 concurrent storage operations safely', async () => {
      const timestamp = Date.now();
      const keys = Array.from({ length: 10 }, (_, i) => `conc_${timestamp}_${i}`);

      const writes = keys.map((key, i) =>
        addStorageVariable({
          baseUrl: E2E_BASE_URL,
          body: { name: key, key, value: { testIndex: i } },
        })
      );
      await Promise.all(writes);

      const deletes = keys.map((key) =>
        deleteStorageVariable({
          baseUrl: E2E_BASE_URL,
          path: { id: key },
        })
      );
      await Promise.all(deletes);
    });
  });

  describe('4. Chaos & Resilience Testing', () => {
    it('survives malformed payloads without daemon crash', async () => {
      const badPayloads = [
        {},
        { workflowData: null },
        { workflowData: { nodes: 'invalid' } },
        { workflowPath: '../../outside.json' },
      ];

      for (const body of badPayloads) {
        const res = await submitJob({
          baseUrl: E2E_BASE_URL,
          body: body as any,
        });
        expect([200, 400, 404, 422, 429, 500, 503]).toContain(res.response?.status);
      }

      // Daemon must remain healthy
      const healthRes = await getHealth({ baseUrl: E2E_BASE_URL });
      expect(healthRes.response?.status).toBe(200);
      expect(healthRes.data?.status).toBe('ok');
    });
  });
});
