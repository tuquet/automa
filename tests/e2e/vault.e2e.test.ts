import { describe, it, expect } from 'vitest';
import type { Workflow } from '@automa/types';
import {
  listStorageFiles,
  saveWorkflow,
  getWorkflow,
} from '@automa/types/api';
import { E2E_BASE_URL } from './helpers/testDaemon';

describe('E2E: Vault Files & Workflows Management (/api/v1/storage/files & workflow)', () => {
  const testWorkflowPath = `workflows/e2e_vault_${Date.now()}.workflow.json`;

  it('1. List storage files in vault', async () => {
    const res = await listStorageFiles({
      baseUrl: E2E_BASE_URL,
    });

    expect(res.response?.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
  });

  it('2. Save a new workflow into vault storage', async () => {
    const res = await saveWorkflow({
      baseUrl: E2E_BASE_URL,
      body: {
        path: testWorkflowPath,
        content: {
          name: 'E2E Test Workflow',
          nodes: [
            { id: 'node_start', type: 'BlockBasic' },
            { id: 'node_click', type: 'BlockEventClick' },
          ],
          edges: [
            { id: 'edge_1', source: 'node_start', target: 'node_click' },
          ],
        },
      },
    });

    expect(res.response?.status).toBe(200);
  });

  it('3. Read back saved workflow from vault storage', async () => {
    const res = await getWorkflow({
      baseUrl: E2E_BASE_URL,
      query: { path: testWorkflowPath },
    });

    expect(res.response?.status).toBe(200);
    const data = res.data as Workflow;
    expect(data?.name).toBe('E2E Test Workflow');
    expect(data?.nodes?.length).toBe(2);
  });

  it('4. Cleanup test workflow file from storage', async () => {
    const fs = await import('node:fs');
    const path = await import('node:path');
    const fullPath = path.join(process.cwd(), 'automa-vault', testWorkflowPath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  });
});
