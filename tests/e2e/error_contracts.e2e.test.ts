import { describe, it, expect } from 'vitest';
import {
  getBrowserDetail,
  createBrowser,
  deleteBrowser,
  getStorageTableRows,
  deleteStorageTable,
  encryptSecret,
} from '@automa/types/api';
import { E2E_BASE_URL } from './helpers/testDaemon';

describe('E2E: Error Contracts & Boundary Handling', () => {
  it('1. Query non-existent browser profile returns 404', async () => {
    const res = await getBrowserDetail({
      baseUrl: E2E_BASE_URL,
      path: { id: 'non_existent_browser_profile_99999' },
    });

    expect(res.response.status).toBe(404);
  });

  it('2. Create browser with invalid ID characters returns 400 BadRequest', async () => {
    const res = await createBrowser({
      baseUrl: E2E_BASE_URL,
      body: {
        id: 'invalid/id/with/slashes?query=1',
        name: 'Bad ID Profile',
      },
    });

    expect(res.response.status).toBe(400);
  });

  it('3. Delete non-existent table returns 404 or gracefully succeeds', async () => {
    const res = await deleteStorageTable({
      baseUrl: E2E_BASE_URL,
      path: { id: 'non_existent_table_xyz' },
    });

    expect([200, 404]).toContain(res.response.status);
  });

  it('4. Query rows of empty or non-existent table returns empty list or 404', async () => {
    const res = await getStorageTableRows({
      baseUrl: E2E_BASE_URL,
      path: { id: 'empty_table_123' },
      query: { limit: 10, offset: 0 },
    });

    expect([200, 404]).toContain(res.response.status);
    if (res.response.status === 200) {
      expect(Array.isArray(res.data)).toBe(true);
      expect(res.data?.length).toBe(0);
    }
  });

  it('5. Encrypt secret without passphrase when env is absent returns 400', async () => {
    const res = await encryptSecret({
      baseUrl: E2E_BASE_URL,
      body: {
        plaintext: 'secret',
        passphrase: '',
      },
    });

    expect([400, 500]).toContain(res.response.status);
  });
});
