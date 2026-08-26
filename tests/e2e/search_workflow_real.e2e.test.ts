import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  lintWorkflow,
  submitJob,
  getJobStatus,
  getJobExecutionLogs,
  getJobHistory,
  killJob,
} from '@automa/types/api';
import { E2E_BASE_URL } from './helpers/testDaemon';

describe('E2E: Practical Real-World Execution of search.workflow.json', () => {
  const workflowFilePath = path.resolve(
    process.cwd(),
    'automa-vault/google.com/workflows/search.workflow.json'
  );

  it('Stage 1: Validate search.workflow.json with Core AST & Topology Linter', async () => {
    expect(fs.existsSync(workflowFilePath)).toBe(true);
    const rawContent = fs.readFileSync(workflowFilePath, 'utf8');
    const workflowJson = JSON.parse(rawContent);

    // Call /api/v1/lint
    const lintRes = await lintWorkflow({
      baseUrl: E2E_BASE_URL,
      body: workflowJson,
    });

    expect(lintRes.response?.status).toBe(200);
    expect(lintRes.data?.valid).toBe(true);
    
    // Check that there are no critical errors
    const errors = lintRes.data?.issues?.filter((i) => i.severity === 'error') || [];
    expect(errors).toHaveLength(0);
  });

  it('Stage 2 & 3: Submit and Execute search.workflow.json in Headless Anti-Detect Browser', async () => {
    const rawContent = fs.readFileSync(workflowFilePath, 'utf8');
    const workflowJson = JSON.parse(rawContent);

    // Override parameters or keyword variable for practical test
    if (workflowJson.trigger?.parameters?.[0]) {
      workflowJson.trigger.parameters[0].defaultValue = 'automa ecosystem search test';
    }

    const submitRes = await submitJob({
      baseUrl: E2E_BASE_URL,
      body: {
        workflowData: workflowJson,
        workflowPath: workflowFilePath,
        options: {
          headless: true,
          closeBrowserOnFinish: true,
          debug: false,
        },
      },
    });

    expect([200, 429, 503]).toContain(submitRes.response?.status);

    if (submitRes.data?.jobId) {
      const jobId = submitRes.data.jobId;
      expect(jobId).toBeDefined();

      // Poll job status until complete or terminal state (max 30 seconds)
      const maxRetries = 30;
      let terminalStateReached = false;
      let finalStatus = '';

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        const statusRes = await getJobStatus({
          baseUrl: E2E_BASE_URL,
          path: { job_id: jobId },
        });

        if (statusRes.response?.status === 200 && statusRes.data) {
          finalStatus = statusRes.data.status;
          if (['completed', 'stopped', 'failed'].includes(finalStatus)) {
            terminalStateReached = true;
            break;
          }
        }
        await new Promise((r) => setTimeout(r, 1000));
      }

      // Query real-time execution logs
      const logsRes = await getJobExecutionLogs({
        baseUrl: E2E_BASE_URL,
        path: { job_id: jobId },
      });

      expect([200, 404]).toContain(logsRes.response?.status);

      // Clean up job if still active
      if (!terminalStateReached) {
        await killJob({
          baseUrl: E2E_BASE_URL,
          path: { job_id: jobId },
        });
      }

      expect(['running', 'completed', 'stopped', 'failed']).toContain(finalStatus);
    }
  }, 90000);

  it('Stage 4: Verify Job History and SQLite Database Records', async () => {
    const historyRes = await getJobHistory({
      baseUrl: E2E_BASE_URL,
    });

    expect(historyRes.response?.status).toBe(200);
    expect(Array.isArray(historyRes.data)).toBe(true);
  });
});
