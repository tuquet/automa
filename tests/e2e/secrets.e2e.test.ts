import { describe, it, expect } from 'vitest';
import { encryptSecret } from '@automa/types/api';
import { E2E_BASE_URL } from './helpers/testDaemon';

describe('E2E: Secrets & Passphrase Encryption', () => {
  it('1. Encrypt secret with explicit master passphrase', async () => {
    const res = await encryptSecret({
      baseUrl: E2E_BASE_URL,
      body: {
        plaintext: 'ghp_super_secret_personal_access_token_12345',
        passphrase: 'master_passphrase_e2e',
      },
    });

    expect(res.response.status).toBe(200);
    expect(res.data?.encryptedSecret).toBeDefined();
    expect(typeof res.data?.encryptedSecret).toBe('string');
    expect(res.data?.encryptedSecret.length).toBeGreaterThan(10);
  });
});
