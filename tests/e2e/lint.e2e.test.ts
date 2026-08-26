import { describe, it, expect } from 'vitest';
import { lintWorkflow, type LintIssue } from '@automa/types/api';
import { E2E_BASE_URL } from './helpers/testDaemon';

describe('E2E: Workflow AST Static Linter', () => {
  it('1. Lint valid workflow graph with nodes and edges', async () => {
    const res = await lintWorkflow({
      baseUrl: E2E_BASE_URL,
      body: {
        nodes: [
          { id: 'node_start', type: 'BlockBasic' },
          { id: 'node_click', type: 'BlockEventClick' },
        ],
        edges: [
          { source: 'node_start', target: 'node_click' },
        ],
      },
    });

    expect(res.response?.status).toBe(200);
    expect(res.data?.valid).toBe(true);
    expect(res.data?.issues.length).toBe(0);
  });

  it('2. Lint invalid workflow graph missing node ID', async () => {
    const res = await lintWorkflow({
      baseUrl: E2E_BASE_URL,
      body: {
        nodes: [
          { label: 'Missing ID Node' },
        ],
        edges: [],
      },
    });

    expect(res.response?.status).toBe(200);
    expect(res.data?.valid).toBe(false);
    const errorIssue = res.data?.issues.find((i: LintIssue) => i.severity === 'error');
    expect(errorIssue).toBeDefined();
    expect(errorIssue?.message).toContain('missing required property \'id\'');
  });
});
