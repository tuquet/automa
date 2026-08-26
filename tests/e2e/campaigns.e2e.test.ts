import { describe, it, expect } from 'vitest';
import {
  executeCampaign,
  getCampaignMatrixStatus,
  abortCampaign,
} from '@automa/types/api';
import { E2E_BASE_URL } from './helpers/testDaemon';

describe('E2E: Matrix Campaign Execution & Orchestration', () => {
  const testCampaignId = `camp_e2e_${Date.now()}`;

  it('1. Execute campaign and allocate matrix grid slots', async () => {
    const res = await executeCampaign({
      baseUrl: E2E_BASE_URL,
      body: {
        campaignId: testCampaignId,
        runNow: true,
        useGrid: true,
      },
    });

    expect(res.response?.status).toBe(200);
    expect(res.data?.campaignId).toBe(testCampaignId);
    expect(res.data?.status).toBe('running');
    expect(res.data?.allocatedSlots.length).toBeGreaterThan(0);
    expect(res.data?.allocatedSlots[0].slotIndex).toBe(0);
  });

  it('2. Query real-time matrix grid status', async () => {
    const res = await getCampaignMatrixStatus({
      baseUrl: E2E_BASE_URL,
      path: { id: testCampaignId },
    });

    expect(res.response?.status).toBe(200);
    expect(res.data?.campaignId).toBe(testCampaignId);
    expect(res.data?.status).toBe('active');
    expect(Array.isArray(res.data?.activeSlots)).toBe(true);
  });

  it('3. Abort running campaign', async () => {
    const res = await abortCampaign({
      baseUrl: E2E_BASE_URL,
      path: { id: testCampaignId },
    });

    expect(res.response?.status).toBe(200);
  });
});
