import { describe, it, expect } from 'vitest';
import {
  getSystemMetrics,
  getHealth,
  addStorageVariable,
  deleteStorageVariable,
} from '@automa/types/api';
import { E2E_BASE_URL } from './helpers/testDaemon';

describe('E2E: Concurrency, Load & Thread Safety', () => {
  it('1. Execute 25 concurrent health and metrics queries', async () => {
    const promises = Array.from({ length: 25 }, async (_, i) => {
      if (i % 2 === 0) {
        const res = await getHealth({ baseUrl: E2E_BASE_URL });
        expect(res.response.status).toBe(200);
      } else {
        const res = await getSystemMetrics({ baseUrl: E2E_BASE_URL });
        expect(res.response.status).toBe(200);
      }
    });

    await Promise.all(promises);
  });

  it('2. Execute 15 concurrent Storage Variable creations and cleanups', async () => {
    const timestamp = Date.now();
    const createdIds: string[] = [];

    const createPromises = Array.from({ length: 15 }, async (_, i) => {
      const varKey = `concurrent_var_${timestamp}_${i}`;
      createdIds.push(varKey);

      const res = await addStorageVariable({
        baseUrl: E2E_BASE_URL,
        body: {
          name: varKey,
          key: varKey,
          value: `Concurrent value ${i}`,
        },
      });

      expect(res.response.status).toBe(200);
    });

    await Promise.all(createPromises);

    // Concurrent delete
    const deletePromises = createdIds.map(async (id) => {
      const res = await deleteStorageVariable({
        baseUrl: E2E_BASE_URL,
        path: { id },
      });
      expect(res.response.status).toBe(200);
    });

    await Promise.all(deletePromises);
  });
});
