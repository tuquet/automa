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
        const createRes = await fetch(`${API_BASE}/v1/browser`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: browserId,
                name: 'Marketing Acc E2E',
                timezone: 'Asia/Ho_Chi_Minh'
            })
        });
        const createData = await createRes.json();
        expect(createData.success).toBe(true);

        // Fetch to ensure it exists in DB
        const getRes = await fetch(`${API_BASE}/v1/browser/${browserId}`);
        expect(getRes.status).toBe(200);

        // Check if the physical directory was created
        // Wait, physical directory is ONLY created when the browser LAUNCHES!
        // We will assert this in Scenario 2.
    });

    it('Scenario 2: Run with Options & Cache Check', async () => {
        // Launch Browser
        const launchRes = await fetch(`${API_BASE}/v1/browser/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ browserId })
        });
        const launchData = await launchRes.json();
        expect(launchData.status).toBe('success');

        // Wait a few seconds for Chromium to initialize its user data dir
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Check physical directory exists
        expect(fs.existsSync(browserDir)).toBe(true);

        // Kill Browser
        const killRes = await fetch(`${API_BASE}/v1/browser/stop`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ browserId })
        });
        const killData = await killRes.json();
        expect(killData.status).toBe('success');
    }, 120000);

    it('Scenario 3: Smart Export', async () => {
        // Get Export ZIP
        const exportRes = await fetch(`${API_BASE}/v1/browser/${browserId}/export`);
        expect(exportRes.status).toBe(200);

        const arrayBuffer = await exportRes.arrayBuffer();
        expect(arrayBuffer.byteLength).toBeGreaterThan(100); // Should be a valid zip

        // Save it locally for a sec
        const zipPath = path.join(os.tmpdir(), `${browserId}.zip`);
        fs.writeFileSync(zipPath, Buffer.from(arrayBuffer));
        expect(fs.existsSync(zipPath)).toBe(true);

        // Delete the downloaded zip
        fs.unlinkSync(zipPath);
    });

    it('Scenario 4: The Ultimate Cleanup', async () => {
        // Delete Browser
        const deleteRes = await fetch(`${API_BASE}/v1/browser/${browserId}`, {
            method: 'DELETE'
        });
        const deleteData = await deleteRes.json();
        expect(deleteData.success).toBe(true);

        // Database should be clear
        const getRes = await fetch(`${API_BASE}/v1/browser/${browserId}`);
        expect(getRes.status).toBe(404);

        // Physical folder MUST be deleted!
        expect(fs.existsSync(browserDir)).toBe(false);
    });
});
