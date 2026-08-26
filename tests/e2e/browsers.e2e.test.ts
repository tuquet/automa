import { describe, it, expect } from 'vitest';
import {
  createBrowser,
  getBrowsers,
  getBrowserDetail,
  updateBrowser,
  importBrowserCookies,
  getBrowserCookies,
  deleteBrowser,
  type BrowserResponse,
} from '@automa/types/api';
import { E2E_BASE_URL } from './helpers/testDaemon';

describe('E2E: Browser Profiles & Cookies Management', () => {
  const testBrowserId = `e2e_browser_${Date.now()}`;

  it('1. Create a new browser profile', async () => {
    const res = await createBrowser({
      baseUrl: E2E_BASE_URL,
      body: {
        id: testBrowserId,
        name: 'E2E Automated Profile',
        timezone: 'Asia/Ho_Chi_Minh',
      },
    });

    expect(res.response?.status).toBe(200);
    expect(res.data).toBeDefined();
  });

  it('2. List all browsers and find created profile', async () => {
    const res = await getBrowsers({
      baseUrl: E2E_BASE_URL,
    });

    expect(res.response?.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    const found = res.data?.some((b: BrowserResponse) => b.id === testBrowserId);
    expect(found).toBe(true);
  });

  it('3. Query specific browser details', async () => {
    const res = await getBrowserDetail({
      baseUrl: E2E_BASE_URL,
      path: { id: testBrowserId },
    });

    expect(res.response?.status).toBe(200);
    expect(res.data?.id).toBe(testBrowserId);
    expect(res.data?.name).toBe('E2E Automated Profile');
  });

  it('4. Update browser profile settings', async () => {
    const res = await updateBrowser({
      baseUrl: E2E_BASE_URL,
      path: { id: testBrowserId },
      body: {
        name: 'E2E Automated Profile (Updated)',
        timezone: 'America/New_York',
      },
    });

    expect(res.response?.status).toBe(200);
  });

  it('5. Import and export browser session cookies', async () => {
    // Import cookies (body is an Array of Cookie objects)
    const importRes = await importBrowserCookies({
      baseUrl: E2E_BASE_URL,
      path: { id: testBrowserId },
      body: [
        {
          name: 'session_token',
          value: 'xyz_e2e_123',
          domain: '.google.com',
          path: '/',
        },
      ],
    });
    expect(importRes.response?.status).toBe(200);

    // Export cookies
    const exportRes = await getBrowserCookies({
      baseUrl: E2E_BASE_URL,
      path: { id: testBrowserId },
    });
    expect(exportRes.response?.status).toBe(200);
    expect(Array.isArray(exportRes.data)).toBe(true);
  });

  it('6. Delete browser profile and verify 404 cleanup', async () => {
    const deleteRes = await deleteBrowser({
      baseUrl: E2E_BASE_URL,
      path: { id: testBrowserId },
    });
    expect(deleteRes.response?.status).toBe(200);

    const getRes = await getBrowserDetail({
      baseUrl: E2E_BASE_URL,
      path: { id: testBrowserId },
    });
    expect(getRes.response?.status).toBe(404);
  });
});
