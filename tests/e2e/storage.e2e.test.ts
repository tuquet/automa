import { describe, it, expect } from 'vitest';
import {
  addStorageVariable,
  getStorageVariables,
  deleteStorageVariable,
  addStorageCredential,
  getStorageCredentials,
  deleteStorageCredential,
  addStorageTable,
  getStorageTables,
  addStorageTableRow,
  getStorageTableRows,
  deleteStorageTable,
  createStorageWorkflow,
  getStorageWorkflows,
  getStorageWorkflow,
  updateStorageWorkflow,
  deleteStorageWorkflow,
  importStorageWorkflow,
  type StorageVariable,
  type StorageCredential,
  type StorageTable,
  type WorkflowStorageItem,
} from '@automa/types/api';
import { E2E_BASE_URL } from './helpers/testDaemon';

describe('E2E: Vault Storage (Variables, AES Credentials & SQLite Tables)', () => {
  const testVarName = `var_${Date.now()}`;
  const testCredName = `cred_${Date.now()}`;
  const testTableName = `table_${Date.now()}`;

  describe('Variables Management', () => {
    it('1. Create global variable', async () => {
      const res = await addStorageVariable({
        baseUrl: E2E_BASE_URL,
        body: {
          name: testVarName,
          key: testVarName,
          value: { content: 'Hello Automa E2E' },
        },
      });

      expect(res.response?.status).toBe(200);
      expect(res.data?.name).toBe(testVarName);
    });

    it('2. Query variables and verify existence', async () => {
      const res = await getStorageVariables({
        baseUrl: E2E_BASE_URL,
      });

      expect(res.response?.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
      const found = res.data?.some((v: StorageVariable) => v.name === testVarName);
      expect(found).toBe(true);
    });

    it('3. Delete variable', async () => {
      const res = await deleteStorageVariable({
        baseUrl: E2E_BASE_URL,
        path: { id: testVarName },
      });

      expect(res.response?.status).toBe(200);
    });
  });

  describe('Credentials Management (AES Encryption)', () => {
    it('1. Create encrypted credential', async () => {
      const res = await addStorageCredential({
        baseUrl: E2E_BASE_URL,
        body: {
          name: testCredName,
          key: testCredName,
          value: 'super_secret_password_123',
        },
      });

      expect(res.response?.status).toBe(200);
      expect(res.data?.name).toBe(testCredName);
    });

    it('2. List credentials and verify existence', async () => {
      const res = await getStorageCredentials({
        baseUrl: E2E_BASE_URL,
      });

      expect(res.response?.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
      const found = res.data?.some((c: StorageCredential) => c.name === testCredName);
      expect(found).toBe(true);
    });

    it('3. Delete credential', async () => {
      const res = await deleteStorageCredential({
        baseUrl: E2E_BASE_URL,
        path: { id: testCredName },
      });

      expect(res.response?.status).toBe(200);
    });
  });

  describe('SQLite Tables & Rows Management', () => {
    it('1. Create dynamic table', async () => {
      const res = await addStorageTable({
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

      expect(res.response?.status).toBe(200);
      expect(res.data?.name).toBe(testTableName);
    });

    it('2. List tables and verify table is registered', async () => {
      const res = await getStorageTables({
        baseUrl: E2E_BASE_URL,
      });

      expect(res.response?.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
      const found = res.data?.some((t: StorageTable) => t.name === testTableName || t.id === testTableName);
      expect(found).toBe(true);
    });

    it('3. Insert row into table', async () => {
      const res = await addStorageTableRow({
        baseUrl: E2E_BASE_URL,
        path: { id: testTableName },
        body: {
          data: {
            user_email: 'tester@automa.local',
            status: 'active',
          },
        },
      });

      expect(res.response?.status).toBe(200);
    });

    it('4. Query table rows', async () => {
      const res = await getStorageTableRows({
        baseUrl: E2E_BASE_URL,
        path: { id: testTableName },
      });

      expect(res.response?.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
    });

    it('5. Delete table and cascade rows', async () => {
      const res = await deleteStorageTable({
        baseUrl: E2E_BASE_URL,
        path: { id: testTableName },
      });

      expect(res.response?.status).toBe(200);
    });
  });

  describe('Workflows Management (SQLite Database-First)', () => {
    const testWfId = `wf_e2e_${Date.now()}`;
    const testImportedWfId = `wf_imported_${Date.now()}`;

    it('1. Create workflow in SQLite DB', async () => {
      const res = await createStorageWorkflow({
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

      expect(res.response?.status).toBe(200);
      expect(res.data?.id).toBe(testWfId);
      expect(res.data?.name).toBe('E2E Test Workflow');
    });

    it('2. List workflows from SQLite DB', async () => {
      const res = await getStorageWorkflows({
        baseUrl: E2E_BASE_URL,
      });

      expect(res.response?.status).toBe(200);
      expect(Array.isArray(res.data)).toBe(true);
      const found = res.data?.some((w: WorkflowStorageItem) => w.id === testWfId);
      expect(found).toBe(true);
    });

    it('3. Get workflow by ID from SQLite DB', async () => {
      const res = await getStorageWorkflow({
        baseUrl: E2E_BASE_URL,
        path: { id: testWfId },
      });

      expect(res.response?.status).toBe(200);
      expect(res.data?.id).toBe(testWfId);
      expect(res.data?.name).toBe('E2E Test Workflow');
    });

    it('4. Update workflow in SQLite DB', async () => {
      const res = await updateStorageWorkflow({
        baseUrl: E2E_BASE_URL,
        path: { id: testWfId },
        body: {
          name: 'Updated E2E Workflow',
          version: '1.1.0',
        },
      });

      expect(res.response?.status).toBe(200);
      expect(res.data?.name).toBe('Updated E2E Workflow');
      expect(res.data?.version).toBe('1.1.0');
    });

    it('5. Import workflow into SQLite DB', async () => {
      const res = await importStorageWorkflow({
        baseUrl: E2E_BASE_URL,
        body: {
          id: testImportedWfId,
          workflow: {
            name: 'Imported Workflow Test',
            nodes: [{ id: 'n1', type: 'trigger', label: 'trigger' }],
          },
        },
      });

      expect(res.response?.status).toBe(200);
      expect(res.data?.id).toBe(testImportedWfId);
      expect(res.data?.name).toBe('Imported Workflow Test');
    });

    it('6. Delete workflow from SQLite DB', async () => {
      const res = await deleteStorageWorkflow({
        baseUrl: E2E_BASE_URL,
        path: { id: testWfId },
      });

      expect(res.response?.status).toBe(200);

      const delImported = await deleteStorageWorkflow({
        baseUrl: E2E_BASE_URL,
        path: { id: testImportedWfId },
      });
      expect(delImported.response?.status).toBe(200);
    });
  });
});
