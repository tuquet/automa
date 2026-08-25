import { spawn, type ChildProcess } from 'node:child_process';
import path from 'node:path';

let daemonProcess: ChildProcess | undefined;
const TEST_PORT = 8766;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

export async function setup(): Promise<void> {
  console.log(`\n[E2E Global Setup] Starting Automa Core Test Daemon on port ${TEST_PORT}...`);
  const corePath = path.join(process.cwd(), 'automa-core');

  daemonProcess = spawn('cargo', ['run', '--quiet', '--bin', 'automa-core', '--', 'serve', '--port', `${TEST_PORT}`], {
    cwd: corePath,
    shell: true,
    stdio: 'pipe',
  });

  daemonProcess.stdout?.on('data', (data) => {
    const text = data.toString().trim();
    if (text) console.log(`[Test Daemon stdout] ${text}`);
  });

  daemonProcess.stderr?.on('data', (data) => {
    const text = data.toString().trim();
    if (text) console.error(`[Test Daemon stderr] ${text}`);
  });

  let isReady = false;
  for (let i = 0; i < 45; i++) {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/health`);
      if (res.ok) {
        const json = await res.json();
        if (json.status === 'ok') {
          isReady = true;
          break;
        }
      }
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  if (!isReady) {
    teardown();
    throw new Error(`[E2E Global Setup] Failed to connect to Automa Core on port ${TEST_PORT} within 45s.`);
  }

  console.log(`[E2E Global Setup] ✔ Automa Core Test Daemon is healthy and ready on ${BASE_URL}\n`);
}

export function teardown(): void {
  if (!daemonProcess || daemonProcess.killed || !daemonProcess.pid) {
    return;
  }

  console.log(`\n[E2E Global Teardown] Terminating Automa Core Test Daemon PID ${daemonProcess.pid}...`);
  try {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', daemonProcess.pid.toString(), '/f', '/t'], {
        stdio: 'ignore',
        shell: true,
      });
    } else {
      daemonProcess.kill('SIGTERM');
    }
  } catch (err) {
    console.warn(`[E2E Global Teardown] Warning when stopping daemon:`, err);
  }
}
