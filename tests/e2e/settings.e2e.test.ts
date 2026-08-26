import { describe, it, expect } from 'vitest';
import {
  getAppSettings,
  patchAppSettings,
  updateAppSettings,
} from '@automa/types/api';
import { E2E_BASE_URL } from './helpers/testDaemon';

describe('E2E: Application Settings & Grid Matrix Configuration (/api/v1/system/settings)', () => {
  it('1. Retrieve default application settings', async () => {
    const res = await getAppSettings({
      baseUrl: E2E_BASE_URL,
    });

    expect(res.response?.status).toBe(200);
    expect(res.data?.grid).toBeDefined();
    expect(res.data?.grid.matrix).toBeDefined();
    expect(res.data?.grid.display).toBeDefined();
    expect(res.data?.browser).toBeDefined();
  });

  it('2. Patch partial grid matrix configuration', async () => {
    const res = await patchAppSettings({
      baseUrl: E2E_BASE_URL,
      body: {
        grid: {
          enabled: true,
          matrix: { columns: 4, rows: 3 },
          behavior: {
            auto_recycle_slots: false,
            enforce_cdp_bounds: true,
            scale_factor: 1.0,
          },
        },
      },
    });

    expect(res.response?.status).toBe(200);
    expect(res.data?.grid.matrix.columns).toBe(4);
    expect(res.data?.grid.matrix.rows).toBe(3);
    expect(res.data?.grid.behavior.auto_recycle_slots).toBe(false);
  });

  it('3. Update full application settings and verify persistence', async () => {
    const current = await getAppSettings({ baseUrl: E2E_BASE_URL });
    const settings = current.data!;

    const res = await updateAppSettings({
      baseUrl: E2E_BASE_URL,
      body: {
        ...settings,
        browser: {
          ...settings.browser,
          default_type: 'firefox',
        },
        runner: {
          ...settings.runner,
          timeout_ms: 45000,
        },
      },
    });

    expect(res.response?.status).toBe(200);
    expect(res.data?.browser.default_type).toBe('firefox');
    expect(res.data?.runner.timeout_ms).toBe(45000);
  });
});
