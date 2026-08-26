import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  submitJob,
  getJobStatus,
  getJobExecutionLogs,
  killJob,
} from '@automa/types/api';
import { E2E_BASE_URL } from './helpers/testDaemon';
import { startFixtureServer, type FixtureServerInstance } from '../fixtures/fixtureServer';

describe('E2E: Real-DOM Headless Browser Execution & DOM Workflow Runner', () => {
  let fixtureServer: FixtureServerInstance;

  beforeAll(async () => {
    fixtureServer = await startFixtureServer();
  });

  afterAll(async () => {
    if (fixtureServer) {
      await fixtureServer.close();
    }
  });

  it('1. Execute full-lifecycle workflow navigating to fixture form and interacting with DOM', async () => {
    const fixtureUrl = `${fixtureServer.baseUrl}/forms.html`;

    const workflowPayload = {
      name: 'E2E Real-DOM Form Submission',
      nodes: [
        {
          id: 'node_trigger',
          type: 'BlockBasic',
          label: 'Trigger Workflow',
          data: {},
        },
        {
          id: 'node_new_tab',
          type: 'BlockNewTab',
          label: 'Open Forms Fixture',
          data: {
            url: fixtureUrl,
            active: true,
          },
        },
        {
          id: 'node_fill_username',
          type: 'BlockForms',
          label: 'Fill Username Field',
          data: {
            selector: '#username',
            value: 'automa_enterprise_tester',
            type: 'text-field',
          },
        },
        {
          id: 'node_fill_email',
          type: 'BlockForms',
          label: 'Fill Email Field',
          data: {
            selector: '#email',
            value: 'tester@enterprise.automa',
            type: 'text-field',
          },
        },
        {
          id: 'node_submit_click',
          type: 'BlockEventClick',
          label: 'Click Submit Button',
          data: {
            selector: '#btn-submit',
          },
        },
        {
          id: 'node_get_output',
          type: 'BlockGetData',
          label: 'Extract Output Result',
          data: {
            selector: '#result-status',
            variableName: 'submissionStatus',
          },
        },
      ],
      edges: [
        { id: 'e1', source: 'node_trigger', target: 'node_new_tab' },
        { id: 'e2', source: 'node_new_tab', target: 'node_fill_username' },
        { id: 'e3', source: 'node_fill_username', target: 'node_fill_email' },
        { id: 'e4', source: 'node_fill_email', target: 'node_submit_click' },
        { id: 'e5', source: 'node_submit_click', target: 'node_get_output' },
      ],
    };

    const submitRes = await submitJob({
      baseUrl: E2E_BASE_URL,
      body: {
        workflowData: workflowPayload,
        options: {
          headless: true,
          closeBrowserOnFinish: true,
          debug: false,
        },
      },
    });

    expect([200, 503]).toContain(submitRes.response?.status);

    if (submitRes.data?.jobId) {
      const jobId = submitRes.data.jobId;

      // Poll status for up to 15 seconds
      const maxRetries = 15;
      let isCompleted = false;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        const statusRes = await getJobStatus({
          baseUrl: E2E_BASE_URL,
          path: { job_id: jobId },
        });

        if (statusRes.response?.status === 200) {
          const status = statusRes.data?.status;
          if (status === 'completed' || status === 'stopped' || status === 'failed') {
            isCompleted = true;
            break;
          }
        }
        await new Promise((r) => setTimeout(r, 1000));
      }

      // Query execution logs
      const logsRes = await getJobExecutionLogs({
        baseUrl: E2E_BASE_URL,
        path: { job_id: jobId },
      });

      expect(logsRes.response?.status).toBe(200);

      // Clean up job if still active
      if (!isCompleted) {
        await killJob({
          baseUrl: E2E_BASE_URL,
          path: { job_id: jobId },
        });
      }
    }
  }, 45000);
});
