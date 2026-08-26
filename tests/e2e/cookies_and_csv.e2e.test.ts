import { describe, it, expect } from 'vitest';
import {
  importBrowsersCsv,
  importBrowserCookies,
  getBrowserCookies,
  deleteBrowser,
  sideloadBrowserExtension,
  type Cookie,
} from '@automa/types/api';
import { E2E_BASE_URL } from './helpers/testDaemon';

describe('E2E: Browser CSV Import, Cookies & Extensions', () => {
  const profileId = `csv_prof_${Date.now()}`;

  it('1. Import browser profiles via CSV batch string', async () => {
    const csvContent = `id,name,user_agent,timezone\n${profileId},CSV Imported Profile,CustomAgent/1.0,Asia/Ho_Chi_Minh`;
    const res = await importBrowsersCsv({
      baseUrl: E2E_BASE_URL,
      body: { csv_string: csvContent },
    });

    expect(res.response?.status).toBe(200);
    expect(res.data?.status).toBe('success');
  });

  it('2. Import and persist cookies for the browser profile', async () => {
    const res = await importBrowserCookies({
      baseUrl: E2E_BASE_URL,
      path: { id: profileId },
      body: [
        {
          name: 'session_token',
          value: 'xyz987654321',
          domain: '.example.com',
          path: '/',
        },
      ],
    });

    expect(res.response?.status).toBe(200);
  });

  it('3. Read back cookies for the browser profile', async () => {
    const res = await getBrowserCookies({
      baseUrl: E2E_BASE_URL,
      path: { id: profileId },
    });

    expect(res.response?.status).toBe(200);
    expect(Array.isArray(res.data)).toBe(true);
    expect(res.data?.some((c: Cookie) => c.name === 'session_token')).toBe(true);
  });

  it('4. Sideload extension into browser profile', async () => {
    const res = await sideloadBrowserExtension({
      baseUrl: E2E_BASE_URL,
      path: { id: profileId },
      body: {
        extension_path: '/dummy/extension/path',
      },
    });

    expect(res.response?.status).toBe(200);
    expect(res.data?.status).toBe('success');
  });

  it('5. Cleanup imported browser profile', async () => {
    const res = await deleteBrowser({
      baseUrl: E2E_BASE_URL,
      path: { id: profileId },
    });

    expect(res.response?.status).toBe(200);
  });
});
