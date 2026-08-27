import { describe, it, expect } from 'vitest';
import type {
  WorkflowStoreState,
  BrowserStoreState,
  CampaignStoreState,
  StorageStoreState,
  ExecutionStoreState,
  SettingsStoreState,
} from '@automa/types';

describe('Unit: Feature Store Contracts & Reactive Topology', () => {
  it('1. Validates WorkflowStoreState contract', () => {
    const state: WorkflowStoreState = {
      workflow: { name: 'Sample Workflow' },
      workflowId: 'wf_123',
      isDirty: false,
      activeNodeId: 'node_start',
      breakpoints: ['node_click'],
      fsmState: 'IDLE',
      lintIssues: [],
    };

    expect(state.workflowId).toBe('wf_123');
    expect(state.fsmState).toBe('IDLE');
    expect(state.isDirty).toBe(false);
  });

  it('2. Validates BrowserStoreState contract', () => {
    const state: BrowserStoreState = {
      browsers: [],
      selectedBrowserId: 'default',
      onlineBrowserIds: [],
      waterfallResolution: { activeType: 'chromium', executablePath: null, isDetected: true },
      isLoading: false,
      searchQuery: '',
    };

    expect(state.selectedBrowserId).toBe('default');
    expect(state.waterfallResolution.activeType).toBe('chromium');
  });

  it('3. Validates ExecutionStoreState contract and telemetry log buffer', () => {
    const state: ExecutionStoreState = {
      activeJobId: 'job_xyz_99',
      fsmState: 'EXECUTING',
      logs: [
        {
          id: 'log_1',
          timestamp: '12:00:00',
          level: 'info',
          message: 'Executing block click',
          blockId: 'node_click',
        },
      ],
      lastError: null,
      isConsoleOpen: true,
    };

    expect(state.activeJobId).toBe('job_xyz_99');
    expect(state.logs.length).toBe(1);
    expect(state.logs[0].level).toBe('info');
  });

  it('4. Validates StorageStoreState contract', () => {
    const state: StorageStoreState = {
      tables: [{ id: 'tbl_1', name: 'Users Table', rowCount: 50 }],
      activeTableId: 'tbl_1',
      activeTableRows: [{ id: 'row_1', name: 'Alice' }],
      variables: [{ id: 'var_1', key: 'apiUrl', name: 'API URL', value: 'https://example.com' }],
      credentials: [{ id: 'cred_1', key: 'token', name: 'Auth Token' }],
      isLoading: false,
    };

    expect(state.tables.length).toBe(1);
    expect(state.variables.length).toBe(1);
    expect(state.credentials.length).toBe(1);
  });
});
