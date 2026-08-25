import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';

describe('API Jobs E2E', () => {
  let daemonProcess: ChildProcess;
  const PORT = 8766;
  const BASE_URL = `http://127.0.0.1:${PORT}`;

  beforeAll(async () => {
    console.log(`Starting rust daemon on port ${PORT}...`);
    const corePath = path.join(process.cwd(), 'automa-core');
    daemonProcess = spawn('cargo', ['run', '--bin', 'automa-core', '--', 'serve', '--port', `${PORT}`], {
      cwd: corePath,
      shell: true,
      stdio: 'pipe'
    });

    daemonProcess.stdout?.on('data', (data) => console.log(`[daemon] ${data.toString().trim()}`));
    daemonProcess.stderr?.on('data', (data) => console.error(`[daemon] ${data.toString().trim()}`));

    let isReady = false;
    for (let i = 0; i < 30; i++) {
      try {
        const res = await fetch(`${BASE_URL}/api/v1/health`);
        if (res.ok || res.status === 404) {
          isReady = true;
          break;
        }
      } catch (e) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    if (!isReady) {
      daemonProcess.kill();
      throw new Error('Daemon did not start in time');
    }
  }, 60000);

  afterAll(() => {
    if (daemonProcess && !daemonProcess.killed) {
      console.log('Killing rust daemon...');
      try {
        spawn("taskkill", ["/pid", daemonProcess.pid!.toString(), '/f', '/t']);
      } catch (e) {
        daemonProcess.kill();
      }
    }
  });

  let jobId = '';

  it('should create a job via POST /api/v1/jobs', async () => {
    const workflowPath = path.join(process.cwd(), 'automa-vault', 'google.com', 'workflows', 'search.workflow.json');
    const payload = {
      workflowPath,
      options: {
        headless: true
      }
    };

    const res = await fetch(`${BASE_URL}/api/v1/jobs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const text = await res.text();
    if (!res.ok) {
      console.log('Failed job creation status:', res.status, text);
    }
    const data = JSON.parse(text) as any;
    expect(data).toBeDefined();
    expect(data.jobId || data.id || data.job_id).toBeDefined();
    jobId = data.jobId || data.id || data.job_id || '1';
  }, 120000);

  it('should update job status via PATCH /api/v1/jobs/{job_id}/status', async () => {
    expect(jobId).not.toBe('');

    const res = await fetch(`${BASE_URL}/api/v1/jobs/${jobId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'completed' })
    });

    expect(res.ok).toBe(true);
  }, 30000);
});
