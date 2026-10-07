import { describe, it, expect } from 'vitest';
import WebSocket from 'ws';
import type {
  Workflow,
  AutomaWsEvent,
  AutomaWsCommand,
  StorageVariable,
  StorageCredential,
  StorageTable,
  WorkflowStorageItem,
} from '@automa/types';
import {
  encryptSecret,
  getSystemMetrics,
  getHealth,
  getAppSettings,
  patchAppSettings,
  lintWorkflow,
  type LintIssue,
  getStorageWorkflows,
  saveWorkflow,
  getWorkflow,
  getStorageVariables,
  addStorageVariable,
  deleteStorageVariable,
  getStorageCredentials,
  addStorageCredential,
  deleteStorageCredential,
  getStorageTables,
  addStorageTable,
  deleteStorageTable,
  getStorageTableRows,
  addStorageTableRow,
  createStorageWorkflow,
  getStorageWorkflow,
  updateStorageWorkflow,
  importStorageWorkflow,
  deleteStorageWorkflow,
  submitJob,
  getJobStatus,
  killJob,
  getJobHistory,
  getJobExecutionLogs,
  deleteJobHistoryItem,
  clearAllJobHistory,
  appendJobLog,
  getCampaigns,
  createCampaign,
  deleteCampaign,
  importBrowsersCsv,
  importBrowserCookies,
  getBrowserCookies,
  deleteBrowser,
  sideloadBrowserExtension,
  type Cookie,
  getBrowserDetail,
  createBrowser,
} from '@automa/types/api';
import { E2E_BASE_URL, isDaemonOnline } from './helpers/testDaemon';

const daemonReady = await isDaemonOnline();

describe.runIf(daemonReady)('E2E: Unified Automa API & Contracts Integration', () => {
  describe('1. Secrets & Encryption', () => {
    it('encrypts secret with explicit master passphrase', async () => {
      const res = await encryptSecret({
        baseUrl: E2E_BASE_URL,
        body: {
          plaintext: 'ghp_super_secret_personal_access_token_12345',
          passphrase: 'master_passphrase_e2e',
        },
      });

      expect(res.response?.status).toBe(200);
      expect(res.data?.encryptedSecret).toBeDefined();
      expect(typeof res.data?.encryptedSecret).toBe('string');
      expect(res.data?.encryptedSecret.length).toBeGreaterThan(10);
    });
  });

  describe('2. System Telemetry & Linter AST', () => {
    it('queries system metrics and health status', async () => {
      const metricsRes = await getSystemMetrics({ baseUrl: E2E_BASE_URL });
      expect(metricsRes.response?.status).toBe(200);

      const healthRes = await getHealth({ baseUrl: E2E_BASE_URL });
      expect(healthRes.response?.status).toBe(200);
      expect(healthRes.data?.status).toBe('ok');
    });

    it('lints valid workflow graph', async () => {
      const res = await lintWorkflow({
        baseUrl: E2E_BASE_URL,
        body: {
          nodes: [
            { id: 'node_start', type: 'BlockBasic', label: 'trigger', data: {} },
            { id: 'node_click', type: 'BlockEventClick', label: 'click-element', data: { selector: '#btn-submit' } },
          ],
          edges: [{ source: 'node_start', target: 'node_click' }],
        },
      });

      expect(res.response?.status).toBe(200);
      expect(res.data?.valid).toBe(true);
      expect(res.data?.issues.length).toBe(0);
    });

    it('rejects invalid workflow graph missing node ID', async () => {
      const res = await lintWorkflow({
        baseUrl: E2E_BASE_URL,
        body: {
          nodes: [{ label: 'Missing ID Node' }],
          edges: [],
        },
      });

      expect(res.response?.status).toBe(200);
      expect(res.data?.valid).toBe(false);
      const errorIssue = res.data?.issues.find((i: LintIssue) => i.severity === 'error');
      expect(errorIssue).toBeDefined();
      expect(errorIssue?.message).toContain("missing required property 'id'");
    });
  });

  describe('3. Application Settings & Grid Matrix Config', () => {
    it('reads and patches application grid settings', async () => {
      const readRes = await getAppSettings({ baseUrl: E2E_BASE_URL });
      expect(readRes.response?.status).toBe(200);

      const patchRes = await patchAppSettings({
        baseUrl: E2E_BASE_URL,
        body: {
          grid: {
            matrix: { columns: 4, rows: 2 },
          },
        },
      });

      expect(patchRes.response?.status).toBe(200);
      expect(patchRes.data?.grid?.matrix?.columns).toBe(4);
      expect(patchRes.data?.grid?.matrix?.rows).toBe(2);
    });
  });

  describe('4. Storage Vault (Variables, Credentials, Tables & Workflows)', () => {
    const timestamp = Date.now();
    const testVarName = `var_e2e_${timestamp}`;
    const testCredName = `cred_e2e_${timestamp}`;
    const testTableName = `tbl_e2e_${timestamp}`;
    const testWfId = `wf_e2e_${timestamp}`;

    it('manages storage variables lifecycle', async () => {
      // Create variable
      const addRes = await addStorageVariable({
        baseUrl: E2E_BASE_URL,
        body: {
          name: testVarName,
          key: testVarName,
          value: { role: 'admin', quota: 100 },
        },
      });
      expect(addRes.response?.status).toBe(200);

      // List variables
      const listRes = await getStorageVariables({ baseUrl: E2E_BASE_URL });
      expect(listRes.response?.status).toBe(200);
      expect(listRes.data?.some((v: StorageVariable) => v.name === testVarName)).toBe(true);

      // Delete variable
      const delRes = await deleteStorageVariable({
        baseUrl: E2E_BASE_URL,
        path: { id: testVarName },
      });
      expect(delRes.response?.status).toBe(200);
    });

    it('manages encrypted credentials lifecycle', async () => {
      // Create credential
      const addRes = await addStorageCredential({
        baseUrl: E2E_BASE_URL,
        body: {
          name: testCredName,
          key: testCredName,
          value: 'super_secret_password_123',
        },
      });
      expect(addRes.response?.status).toBe(200);

      // List credentials
      const listRes = await getStorageCredentials({ baseUrl: E2E_BASE_URL });
      expect(listRes.response?.status).toBe(200);
      expect(listRes.data?.some((c: StorageCredential) => c.name === testCredName)).toBe(true);

      // Delete credential
      const delRes = await deleteStorageCredential({
        baseUrl: E2E_BASE_URL,
        path: { id: testCredName },
      });
      expect(delRes.response?.status).toBe(200);
    });

    it('manages SQLite dynamic tables & rows lifecycle', async () => {
      // Create table
      const addTableRes = await addStorageTable({
        baseUrl: E2E_BASE_URL,
        body: {
          id: testTableName,
          name: testTableName,
          columns: {
            id: 'INTEGER PRIMARY KEY',
            user_email: 'TEXT',
            status: 'TEXT',
          },
        },
      });
      expect(addTableRes.response?.status).toBe(200);

      // Insert row
      const addRowRes = await addStorageTableRow({
        baseUrl: E2E_BASE_URL,
        path: { id: testTableName },
        body: {
          data: { user_email: 'tester@automa.local', status: 'active' },
        },
      });
      expect(addRowRes.response?.status).toBe(200);

      // Query rows
      const queryRowsRes = await getStorageTableRows({
        baseUrl: E2E_BASE_URL,
        path: { id: testTableName },
      });
      expect(queryRowsRes.response?.status).toBe(200);
      expect(Array.isArray(queryRowsRes.data)).toBe(true);

      // Delete table
      const delTableRes = await deleteStorageTable({
        baseUrl: E2E_BASE_URL,
        path: { id: testTableName },
      });
      expect(delTableRes.response?.status).toBe(200);
    });

    it('manages database-first workflows lifecycle', async () => {
      // Create workflow
      const addRes = await createStorageWorkflow({
        baseUrl: E2E_BASE_URL,
        body: {
          id: testWfId,
          name: 'E2E Test Workflow',
          description: 'Automated workflow test',
          data: {
            nodes: [
              { id: 'node_1', type: 'trigger', label: 'trigger' },
              { id: 'node_2', type: 'new-tab', label: 'new-tab', data: { url: 'https://example.com' } },
            ],
            edges: [],
          },
          version: '1.0.0',
          icon: 'play',
        },
      });
      expect(addRes.response?.status).toBe(200);

      // Get workflow by ID
      const getRes = await getStorageWorkflow({
        baseUrl: E2E_BASE_URL,
        path: { id: testWfId },
      });
      expect(getRes.response?.status).toBe(200);
      expect(getRes.data?.name).toBe('E2E Test Workflow');

      // Update workflow
      const updateRes = await updateStorageWorkflow({
        baseUrl: E2E_BASE_URL,
        path: { id: testWfId },
        body: { name: 'Updated E2E Workflow', version: '1.1.0' },
      });
      expect(updateRes.response?.status).toBe(200);
      expect(updateRes.data?.name).toBe('Updated E2E Workflow');

      // Delete workflow
      const delRes = await deleteStorageWorkflow({
        baseUrl: E2E_BASE_URL,
        path: { id: testWfId },
      });
      expect(delRes.response?.status).toBe(200);
    });
  });

  describe('5. Jobs & Execution History Lifecycle', () => {
    const testJobId = `job_hist_${Date.now()}`;

    it('appends and reads execution logs', async () => {
      const appendRes = await appendJobLog({
        baseUrl: E2E_BASE_URL,
        path: { job_id: testJobId },
        body: { type: 'info', message: 'Step 1: Navigating to page' },
      });
      expect(appendRes.response?.status).toBe(200);

      const logsRes = await getJobExecutionLogs({
        baseUrl: E2E_BASE_URL,
        path: { job_id: testJobId },
      });
      expect(logsRes.response?.status).toBe(200);
      expect(logsRes.data).toBeDefined();
    });

    it('queries and deletes job history entries', async () => {
      const historyRes = await getJobHistory({
        baseUrl: E2E_BASE_URL,
        query: { limit: 10 },
      });
      expect(historyRes.response?.status).toBe(200);
      expect(Array.isArray(historyRes.data)).toBe(true);

      const delRes = await deleteJobHistoryItem({
        baseUrl: E2E_BASE_URL,
        path: { job_id: testJobId },
      });
      expect(delRes.response?.status).toBe(200);
    });
  });

  describe('6. Campaigns Orchestration', () => {
    const campaignId = `camp_${Date.now()}`;

    it('creates, lists and deletes campaigns', async () => {
      const createRes = await createCampaign({
        baseUrl: E2E_BASE_URL,
        body: {
          id: campaignId,
          name: 'E2E Matrix Campaign',
          workflow_id: 'test_wf',
          browser_ids: ['default'],
        },
      });
      expect(createRes.response?.status).toBe(200);

      const listRes = await getCampaigns({ baseUrl: E2E_BASE_URL });
      expect(listRes.response?.status).toBe(200);
      expect(listRes.data?.some((c) => c.id === campaignId)).toBe(true);

      const delRes = await deleteCampaign({
        baseUrl: E2E_BASE_URL,
        path: { id: campaignId },
      });
      expect(delRes.response?.status).toBe(200);
    });
  });

  describe('7. Browser CSV Import, Cookies & Extensions', () => {
    const profileId = `csv_prof_${Date.now()}`;

    it('imports profile via CSV and sets cookies', async () => {
      const csvContent = `id,name,user_agent,timezone\n${profileId},CSV Profile,CustomAgent/1.0,Asia/Ho_Chi_Minh`;
      const importRes = await importBrowsersCsv({
        baseUrl: E2E_BASE_URL,
        body: { csv_string: csvContent },
      });
      expect(importRes.response?.status).toBe(200);

      const cookieRes = await importBrowserCookies({
        baseUrl: E2E_BASE_URL,
        path: { id: profileId },
        body: [
          { name: 'session_token', value: 'xyz123', domain: '.example.com', path: '/' },
        ],
      });
      expect(cookieRes.response?.status).toBe(200);

      const readCookiesRes = await getBrowserCookies({
        baseUrl: E2E_BASE_URL,
        path: { id: profileId },
      });
      expect(readCookiesRes.response?.status).toBe(200);
      expect(readCookiesRes.data?.some((c: Cookie) => c.name === 'session_token')).toBe(true);

      // Cleanup
      await deleteBrowser({
        baseUrl: E2E_BASE_URL,
        path: { id: profileId },
      });
    });
  });

  describe('8. Error Contracts & Boundaries', () => {
    it('returns 404 for non-existent browser profile', async () => {
      const res = await getBrowserDetail({
        baseUrl: E2E_BASE_URL,
        path: { id: 'non_existent_profile_99999' },
      });
      expect(res.response?.status).toBe(404);
    });

    it('returns 400 for invalid browser ID characters', async () => {
      const res = await createBrowser({
        baseUrl: E2E_BASE_URL,
        body: { id: 'invalid/id/with/slashes', name: 'Bad Profile' },
      });
      expect(res.response?.status).toBe(400);
    });
  });

  describe('9. WebSocket Telemetry Handshake', () => {
    it('connects to WebSocket and exchanges PING / PONG', async () => {
      const wsUrl = E2E_BASE_URL.replace(/^http/, 'ws') + '/api/v1/ws';
      const ws = new WebSocket(wsUrl);
      const messages: AutomaWsEvent[] = [];

      await new Promise<void>((resolve, reject) => {
        ws.on('message', (data) => {
          const parsed = JSON.parse(data.toString()) as AutomaWsEvent;
          messages.push(parsed);

          if (parsed.type === 'CONNECTED') {
            const pingCmd: AutomaWsCommand = { type: 'PING' };
            ws.send(JSON.stringify(pingCmd));
          } else if (parsed.type === 'PONG') {
            resolve();
          }
        });
        ws.on('error', reject);
      });

      expect(messages.some((m) => m.type === 'CONNECTED')).toBe(true);
      expect(messages.some((m) => m.type === 'PONG')).toBe(true);
      ws.close();
    });
  });
});
