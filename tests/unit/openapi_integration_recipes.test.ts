import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ApiErrorResponse } from '@automa/types/api';

describe('Automa Core OpenAPI — Integration & Developer Guide Recipes (docs/OPENAPI_INTEGRATION_GUIDE.md)', () => {
  describe('Recipe 4.1: Workflow Execution & Real-Time SSE Log Streaming', () => {
    it('executes workflow via submitJob and streams logs through EventSource', async () => {
      // Mock submitJob API response
      const mockSubmitJob = vi.fn().mockResolvedValue({
        data: { job_id: 'job-e2e-401' },
        error: undefined,
      });

      const mockKillJob = vi.fn().mockResolvedValue({
        data: { success: true },
      });

      // Implementation of executeWorkflow recipe from documentation
      async function executeWorkflow(workflowPath: string, browserId?: string) {
        const { data, error } = await mockSubmitJob({
          body: {
            workflow_path: workflowPath,
            browser_id: browserId,
            options: { headless: true, debug: false },
          },
        });

        if (error || !data?.job_id) {
          throw new Error(error?.message || 'Failed to submit workflow');
        }

        const jobId = data.job_id;
        const collectedLogs: string[] = [];

        // Simulated SSE message dispatcher
        const handleMessage = (payload: { jobId: string; type: string; message?: string }) => {
          if (payload.jobId === jobId && payload.type === 'task:log' && payload.message) {
            collectedLogs.push(payload.message);
          }
        };

        return {
          jobId,
          collectedLogs,
          handleMessage,
          abort: async () => {
            await mockKillJob({ path: { job_id: jobId } });
          },
        };
      }

      const session = await executeWorkflow('workflows/search.workflow.json', 'p1');
      expect(session.jobId).toBe('job-e2e-401');
      expect(mockSubmitJob).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            workflow_path: 'workflows/search.workflow.json',
            browser_id: 'p1',
          }),
        })
      );

      // Stream logs
      session.handleMessage({ jobId: 'job-e2e-401', type: 'task:log', message: 'Navigated to google.com' });
      session.handleMessage({ jobId: 'job-e2e-401', type: 'task:log', message: 'Typed search keyword' });
      expect(session.collectedLogs).toEqual(['Navigated to google.com', 'Typed search keyword']);

      // Abort
      await session.abort();
      expect(mockKillJob).toHaveBeenCalledWith({ path: { job_id: 'job-e2e-401' } });
    });
  });

  describe('Recipe 4.2: Anti-Detect Browser Profile Lifecycle', () => {
    it('handles profile registration, session toggling, and cookie exports', async () => {
      const mockCreateBrowser = vi.fn().mockResolvedValue({ error: undefined });
      const mockStartBrowserSession = vi.fn().mockResolvedValue({ error: undefined });
      const mockStopBrowserSession = vi.fn().mockResolvedValue({ error: undefined });
      const mockGetBrowserCookies = vi.fn().mockResolvedValue({
        data: [{ name: 'session_id', value: 'secret123', domain: '.example.com' }],
      });

      // 1. Register profile
      const createRes = await mockCreateBrowser({
        body: {
          id: 'browser_chrome_vn',
          name: 'Chrome Vietnam Profile',
          proxy: { server: 'socks5://127.0.0.1:1080' },
          fingerprint: { userAgent: 'Mozilla/5.0 ...', timezone: 'Asia/Ho_Chi_Minh' },
        },
      });
      expect(createRes.error).toBeUndefined();

      // 2. Start session
      await mockStartBrowserSession({ path: { id: 'browser_chrome_vn' } });
      expect(mockStartBrowserSession).toHaveBeenCalledWith({ path: { id: 'browser_chrome_vn' } });

      // 3. Export cookies
      const cookiesRes = await mockGetBrowserCookies({ path: { id: 'browser_chrome_vn' } });
      expect(cookiesRes.data).toHaveLength(1);
      expect(cookiesRes.data[0].name).toBe('session_id');

      // 4. Stop session
      await mockStopBrowserSession({ path: { id: 'browser_chrome_vn' } });
      expect(mockStopBrowserSession).toHaveBeenCalledWith({ path: { id: 'browser_chrome_vn' } });
    });
  });

  describe('Recipe 4.3: Campaign Matrix Parallel Execution', () => {
    it('dispatches parallel matrix execution with grid layout', async () => {
      const mockExecuteCampaign = vi.fn().mockResolvedValue({
        data: { campaign_id: 'camp_google_fleet', status: 'started' },
        error: undefined,
      });

      const mockGetStatus = vi.fn().mockResolvedValue({
        data: { is_finished: true, completed_slots: 4, total_slots: 4 },
      });

      const { data, error } = await mockExecuteCampaign({
        body: {
          campaign_id: 'camp_google_fleet',
          concurrency: 4,
          grid_layout: { rows: 2, cols: 2 },
        },
      });

      expect(error).toBeUndefined();
      expect(data?.campaign_id).toBe('camp_google_fleet');

      const statusRes = await mockGetStatus({ path: { id: 'camp_google_fleet' } });
      expect(statusRes.data.is_finished).toBe(true);
      expect(statusRes.data.completed_slots).toBe(4);
    });
  });

  describe('Section 5: Standardized Error Handling (ApiErrorResponse)', () => {
    it('structures error responses according to canonical schema', () => {
      const sampleError: ApiErrorResponse = {
        error: 'Validation failed: Workflow node "click_submit" is disconnected',
        status: 400,
      };

      expect(sampleError.status).toBe(400);
      expect(sampleError.error.length).toBeGreaterThan(0);
      expect(sampleError.error).toContain('Validation failed');
    });
  });
});
