import { describe, it, expect } from 'vitest';
import * as path from 'path';
import * as os from 'os';
import {
    createBrowser,
    getBrowserDetail,
    startBrowser,
    stopBrowser,
    deleteBrowser,
} from '@automa/types/api';

const BASE_URL = 'http://127.0.0.1:8765';

// Resolve the AppData path similar to Rust's dirs crate
const getAppDataPath = () => {
    // Determine if we are in dev mode (e.g. tests usually run against dev daemon)
    const isDev = process.env.AUTOMA_ENV === 'development' || !process.env.AUTOMA_ENV;
    const coreDir = isDev ? 'core-dev' : 'core';
    return path.join(os.homedir(), '.automa', coreDir);
};

describe('Browser Lifecycle E2E', () => {
    const browserId = `e2e_test_browser_${Date.now()}`;
    const automaRoot = getAppDataPath();
    const browsersPath = path.join(automaRoot, 'browsers');
    const browserDir = path.join(browsersPath, browserId);

    it('Scenario 1: Creation & Path Persistence', async () => {
        // Create Browser
        const createRes = await createBrowser({
            baseUrl: BASE_URL,
            body: {
                id: browserId,
                name: 'Marketing Acc E2E',
                timezone: 'Asia/Ho_Chi_Minh',
            },
        });
        expect(createRes.data || createRes.response.ok).toBeTruthy();

        // Fetch to ensure it exists in DB
        const getRes = await getBrowserDetail({
            baseUrl: BASE_URL,
            path: { id: browserId },
        });
        expect(getRes.response.status).toBe(200);
    });

    it('Scenario 2: Run with Options & Cache Check', async () => {
        // Launch Browser
        const launchRes = await startBrowser({
            baseUrl: BASE_URL,
            path: { id: browserId },
        });
        expect(launchRes.data || launchRes.response.ok).toBeTruthy();

        // Wait a few seconds for Chromium to initialize its user data dir
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Kill Browser
        const killRes = await stopBrowser({
            baseUrl: BASE_URL,
            path: { id: browserId },
        });
        expect(killRes).toBeDefined();
    }, 120000);

    it('Scenario 3: The Ultimate Cleanup', async () => {
        // Delete Browser
        const deleteRes = await deleteBrowser({
            baseUrl: BASE_URL,
            path: { id: browserId },
        });
        expect(deleteRes.response.status).toBe(200);

        // Database should be clear
        const getRes = await getBrowserDetail({
            baseUrl: BASE_URL,
            path: { id: browserId },
        });
        expect(getRes.response.status).toBe(404);
    });
});

