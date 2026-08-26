import { spawn, execSync, type ChildProcess } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import net from 'node:net';

let daemonProcess: ChildProcess | undefined;
const TEST_PORT = 8766;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

function killProcessOnPort(port: number): void {
  try {
    if (process.platform === 'win32') {
      try {
        execSync('taskkill /F /IM automa-core.exe', { stdio: 'ignore' });
      } catch {}
      try {
        const output = execSync('netstat -ano -p tcp', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
        const lines = output.trim().split('\n');
        for (const line of lines) {
          const trimmed = line.trim().toUpperCase();
          if (trimmed.includes(`:${port}`) && trimmed.includes('LISTEN')) {
            const parts = line.trim().split(/\s+/);
            const pid = parts[parts.length - 1];
            if (pid && pid !== '0' && pid !== `${process.pid}`) {
              try {
                execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
              } catch {}
            }
          }
        }
      } catch {}
    } else {
      try {
        execSync(`fuser -k ${port}/tcp`, { stdio: 'ignore' });
      } catch {}
    }
  } catch {}
}

async function ensurePortIsFree(port: number): Promise<void> {
  for (let i = 0; i < 15; i++) {
    killProcessOnPort(port);
    const isFree = await new Promise<boolean>((resolve) => {
      const tester = net.createServer();
      tester.once('error', () => resolve(false));
      tester.once('listening', () => {
        tester.close(() => resolve(true));
      });
      tester.listen(port, '127.0.0.1');
    });

    if (isFree) {
      await new Promise((r) => setTimeout(r, 500));
      return;
    }
    await new Promise((r) => setTimeout(r, 500));
  }
}

export async function setup(): Promise<void> {
  // Pre-cleanup any dangling process on TEST_PORT and wait until port is truly free
  await ensurePortIsFree(TEST_PORT);

  console.log(`\n[E2E Global Setup] Starting Automa Core Test Daemon on port ${TEST_PORT}...`);
  const corePath = path.join(process.cwd(), 'automa-core');

  const exeExt = process.platform === 'win32' ? '.exe' : '';
  const exePath = path.join(corePath, 'target', 'debug', `automa-core${exeExt}`);

  console.log(`[E2E Global Setup] Ensuring fresh automa-core binary is built...`);
  execSync('cargo build --quiet --bin automa-core', { cwd: corePath, stdio: 'inherit' });

  daemonProcess = spawn(exePath, ['--port', `${TEST_PORT}`], {
    cwd: corePath,
    stdio: 'inherit',
    env: {
      ...process.env,
      AUTOMA_PORT: `${TEST_PORT}`,
      AUTOMA_NO_CTRLC_SHUTDOWN: '1',
    },
  });

  daemonProcess.on('exit', (code, signal) => {
    console.log(`[Test Daemon Process Exited] code=${code} signal=${signal}`);
  });

  let isReady = false;
  for (let i = 0; i < 45; i++) {
    if (daemonProcess && daemonProcess.exitCode !== null) {
      teardown();
      throw new Error(`[E2E Global Setup] Test daemon exited prematurely with code ${daemonProcess.exitCode}`);
    }
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
  if (daemonProcess && daemonProcess.pid) {
    console.log(`\n[E2E Global Teardown] Terminating Automa Core Test Daemon PID ${daemonProcess.pid}...`);
    try {
      if (process.platform === 'win32') {
        try {
          execSync(`taskkill /PID ${daemonProcess.pid} /F`, { stdio: 'ignore' });
        } catch {}
      } else {
        try {
          daemonProcess.kill('SIGTERM');
        } catch {}
      }
    } catch {}
  }
  killProcessOnPort(TEST_PORT);
}
