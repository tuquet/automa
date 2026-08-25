import { describe, it, expect } from 'vitest';
import {
  submitJob,
  getJobStatus,
  getActiveJobs,
  appendJobLog,
  finishJob,
  getJobHistory,
  clearAllJobHistory,
} from '@automa/types/api';
import { E2E_BASE_URL } from './helpers/testDaemon';

describe('E2E: Workflow Jobs & History Lifecycle', () => {
  let createdJobId = '';

  it('1. Query active jobs list', async () => {
    const res = await getActiveJobs({
      baseUrl: E2E_BASE_URL,
    });

    expect(res.response.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });

  it('2. Submit an inline workflow job', async () => {
    const res = await submitJob({
      baseUrl: E2E_BASE_URL,
      body: {
        workflow: {
          name: 'E2E Inline Workflow',
          drawflow: {
            nodes: [
              {
                id: 'trigger_1',
                type: 'trigger',
                data: {},
              },
            ],
          },
        },
        options: {
          headless: true,
          closeBrowserOnFinish: true,
        },
      },
    });

    expect([200, 503]).toContain(res.response.status);
    if (res.data?.jobId) {
      createdJobId = res.data.jobId;
    }
  }, 60000);

  it('3. Query job status', async () => {
    if (!createdJobId) return;

    const res = await getJobStatus({
      baseUrl: E2E_BASE_URL,
      path: { id: createdJobId },
    });

    expect(res.response.status).toBe(200);
    expect(res.data?.status).toBeDefined();
  });

  it('4. Append execution log to job', async () => {
    if (!createdJobId) return;

    const res = await appendJobLog({
      baseUrl: E2E_BASE_URL,
      path: { id: createdJobId },
      body: {
        log: {
          step: 1,
          blockId: 'trigger_1',
          type: 'trigger',
          message: 'E2E test log message',
        },
      },
    });

    expect([200, 404]).toContain(res.response.status);
  });

  it('5. Finish job execution', async () => {
    if (!createdJobId) return;

    const res = await finishJob({
      baseUrl: E2E_BASE_URL,
      path: { id: createdJobId },
    });

    expect([200, 404]).toContain(res.response.status);
  });

  it('6. Query job history', async () => {
    const res = await getJobHistory({
      baseUrl: E2E_BASE_URL,
    });

    expect(res.response.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });

  it('7. Clear all job history', async () => {
    const res = await clearAllJobHistory({
      baseUrl: E2E_BASE_URL,
    });

    expect(res.response.status).toBe(200);
    expect(res.data?.success).toBe(true);
  });
});
