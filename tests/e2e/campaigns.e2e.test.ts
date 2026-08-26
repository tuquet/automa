import { describe, it, expect } from 'vitest';
import {
  executeCampaign,
  getCampaignMatrixStatus,
  abortCampaign,
  createStorageCampaign,
  getStorageCampaigns,
  getStorageCampaign,
  updateStorageCampaign,
  importStorageCampaign,
  deleteStorageCampaign,
} from '@automa/types/api';
import { E2E_BASE_URL } from './helpers/testDaemon';

describe('E2E: Matrix Campaign Execution & Orchestration', () => {
  const testCampaignId = `camp_e2e_${Date.now()}`;
  const dbCampaignId = `camp_db_${Date.now()}`;

  it('1. Create and store campaign in central SQLite DB', async () => {
    const res = await createStorageCampaign({
      baseUrl: E2E_BASE_URL,
      body: {
        id: dbCampaignId,
        name: 'E2E Matrix Fleet',
        description: 'Multi-browser marketing fleet',
        data: {
          members: [
            { browserId: 'browser_1', workflowId: 'wf_1' },
            { browserId: 'browser_2', workflowId: 'wf_2' },
          ],
          settings: { concurrency_mode: 'parallel' },
        },
        cron: '0 8 * * *',
        version: '1.0.0',
      },
    });

    expect(res.response?.status).toBe(200);
    expect(res.data?.id).toBe(dbCampaignId);
    expect(res.data?.name).toBe('E2E Matrix Fleet');
    expect(res.data?.cron).toBe('0 8 * * *');
  });

  it('2. List campaigns from storage database', async () => {
    const res = await getStorageCampaigns({
      baseUrl: E2E_BASE_URL,
    });

    expect(res.response?.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    const found = res.data?.find((c) => c.id === dbCampaignId);
    expect(found).toBeDefined();
  });

  it('3. Get campaign details by ID from storage', async () => {
    const res = await getStorageCampaign({
      baseUrl: E2E_BASE_URL,
      path: { id: dbCampaignId },
    });

    expect(res.response?.status).toBe(200);
    expect(res.data?.id).toBe(dbCampaignId);
    expect(res.data?.name).toBe('E2E Matrix Fleet');
  });

  it('4. Update campaign in SQLite DB', async () => {
    const res = await updateStorageCampaign({
      baseUrl: E2E_BASE_URL,
      path: { id: dbCampaignId },
      body: {
        name: 'E2E Matrix Fleet Updated',
        cron: '0 9 * * *',
      },
    });

    expect(res.response?.status).toBe(200);
    expect(res.data?.name).toBe('E2E Matrix Fleet Updated');
    expect(res.data?.cron).toBe('0 9 * * *');
  });

  it('5. Import external campaign JSON into SQLite DB', async () => {
    const importId = `camp_imported_${Date.now()}`;
    const res = await importStorageCampaign({
      baseUrl: E2E_BASE_URL,
      body: {
        id: importId,
        campaign: {
          name: 'Imported Fleet Campaign',
          members: [{ browserId: 'b_alpha' }, { browserId: 'b_beta' }, { browserId: 'b_gamma' }],
        },
      },
    });

    expect(res.response?.status).toBe(200);
    expect(res.data?.id).toBe(importId);
    expect(res.data?.name).toBe('Imported Fleet Campaign');
  });

  it('6. Execute campaign natively resolved from SQLite DB', async () => {
    const res = await executeCampaign({
      baseUrl: E2E_BASE_URL,
      body: {
        campaignId: dbCampaignId,
        runNow: true,
        useGrid: true,
      },
    });

    expect(res.response?.status).toBe(200);
    expect(res.data?.campaignId).toBe(dbCampaignId);
    expect(res.data?.status).toBe('running');
    expect(res.data?.totalJobs).toBe(2); // 2 members from DB
    expect(res.data?.allocatedSlots.length).toBe(2);
  });

  it('7. Query real-time matrix grid status', async () => {
    const res = await getCampaignMatrixStatus({
      baseUrl: E2E_BASE_URL,
      path: { id: dbCampaignId },
    });

    expect(res.response?.status).toBe(200);
    expect(res.data?.campaignId).toBe(dbCampaignId);
    expect(res.data?.status).toBe('active');
    expect(Array.isArray(res.data?.activeSlots)).toBe(true);
  });

  it('8. Abort running campaign', async () => {
    const res = await abortCampaign({
      baseUrl: E2E_BASE_URL,
      path: { id: dbCampaignId },
    });

    expect(res.response?.status).toBe(200);
  });

  it('9. Delete campaign from SQLite DB', async () => {
    const res = await deleteStorageCampaign({
      baseUrl: E2E_BASE_URL,
      path: { id: dbCampaignId },
    });

    expect(res.response?.status).toBe(200);
    expect(res.data?.success).toBe(true);

    const getRes = await getStorageCampaign({
      baseUrl: E2E_BASE_URL,
      path: { id: dbCampaignId },
    });
    expect(getRes.error).toBeDefined();
  });
});
