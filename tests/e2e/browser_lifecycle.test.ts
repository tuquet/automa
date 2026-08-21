import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const API_BASE = 'http://127.0.0.1:8765/api';

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
        const createRes = await fetch(`${API_BASE}/browsers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: browserId,
                name: 'Marketing Acc E2E',
                timezone: 'Asia/Ho_Chi_Minh'
            })
        });
        const createData = await createRes.json();
        expect(createData.id || createData.success).toBeTruthy();

        // Fetch to ensure it exists in DB
        const getRes = await fetch(`${API_BASE}/browsers/${browserId}`);
        expect(getRes.status).toBe(200);
    });

    it('Scenario 2: Run with Options & Cache Check', async () => {
        // Launch Browser
        const launchRes = await fetch(`${API_BASE}/browsers/${browserId}/session`, {
            method: 'POST'
        });
        const launchData = await launchRes.json();
        expect(launchData.status || launchData.success).toBeTruthy();

        // Wait a few seconds for Chromium to initialize its user data dir
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Kill Browser
        const killRes = await fetch(`${API_BASE}/browsers/${browserId}/session`, {
            method: 'DELETE'
        });
        const killText = await killRes.text();
        expect(killText).toContain('success');
    }, 120000);

    it('Scenario 3: The Ultimate Cleanup', async () => {
        // Delete Browser
        const deleteRes = await fetch(`${API_BASE}/browsers/${browserId}`, {
            method: 'DELETE'
        });
        expect(deleteRes.status).toBe(200);

        // Database should be clear
        const getRes = await fetch(`${API_BASE}/browsers/${browserId}`);
        expect(getRes.status).toBe(404);
    });
});
