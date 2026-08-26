import { describe, it, expect } from 'vitest';
import {
  getJobHistory,
  getJobExecutionLogs,
  deleteJobHistoryItem,
  clearAllJobHistory,
  appendJobLog,
  submitJob,
} from '@automa/types/api';
import { E2E_BASE_URL } from './helpers/testDaemon';

describe('E2E: Job History & Execution Logs Lifecycle (/api/v1/history)', () => {
  let testJobId = `hist_job_${Date.now()}`;

  it('1. Submit job and append execution log entries', async () => {
    const res = await appendJobLog({
      baseUrl: E2E_BASE_URL,
      path: { job_id: testJobId },
      body: {
        type: 'info',
        message: 'Step 1: Navigating to page',
      },
    });

    expect(res.response?.status).toBe(200);
  });

  it('2. Query job execution logs', async () => {
    const res = await getJobExecutionLogs({
      baseUrl: E2E_BASE_URL,
      path: { job_id: testJobId },
    });

    expect(res.response?.status).toBe(200);
    expect(res.data).toBeDefined();
    if (res.data?.logs) {
      expect(Array.isArray(res.data.logs)).toBe(true);
    }
  });

  it('3. Query job execution history list with pagination', async () => {
    const res = await getJobHistory({
      baseUrl: E2E_BASE_URL,
      query: { limit: 10 },
    });

    expect(res.response?.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });

  it('4. Delete single job history entry', async () => {
    const res = await deleteJobHistoryItem({
      baseUrl: E2E_BASE_URL,
      path: { job_id: testJobId },
    });

    expect(res.response?.status).toBe(200);
  });

  it('5. Clear all historical job records', async () => {
    const res = await clearAllJobHistory({
      baseUrl: E2E_BASE_URL,
    });

    expect(res.response?.status).toBe(200);

    const historyAfter = await getJobHistory({
      baseUrl: E2E_BASE_URL,
      query: { limit: 10 },
    });
    expect(historyAfter.data?.length).toBe(0);
  });
});
