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
      execSync('taskkill /F /IM specter.exe', { stdio: 'ignore' });
      execSync('taskkill /F /IM tuquet.exe', { stdio: 'ignore' });
      execSync('taskkill /F /IM automa.exe', { stdio: 'ignore' });
    } else {
      execSync(`fuser -k ${port}/tcp`, { stdio: 'ignore' });
    }
  } catch {}
}

async function ensurePortIsFree(port: number): Promise<void> {
  killProcessOnPort(port);
  for (let i = 0; i < 5; i++) {
    const isFree = await new Promise<boolean>((resolve) => {
      const tester = net.createServer();
      tester.once('error', () => resolve(false));
      tester.once('listening', () => tester.close(() => resolve(true)));
      tester.listen(port, '127.0.0.1');
    });
    if (isFree) return;
    await new Promise((r) => setTimeout(r, 200));
  }
}

function resolveBinaryPath(corePath: string): string | undefined {
  const exe = process.platform === 'win32' ? '.exe' : '';
  const candidates = [
    path.join(corePath, 'target', 'debug', `specter${exe}`),
    path.join(corePath, 'target', 'release', `specter${exe}`),
    path.join(corePath, 'target', 'debug', `tuquet${exe}`),
    path.join(corePath, 'target', 'release', `tuquet${exe}`),
    path.join(corePath, 'target', 'debug', `automa${exe}`),
    path.join(corePath, 'target', 'release', `automa${exe}`),
  ];
  return candidates.find(fs.existsSync);
}

export async function setup(): Promise<void> {
  // Ponytail: Skip daemon startup when running unit tests
  if (process.argv.some((a) => a.includes('unit') || a.includes('tests/unit'))) {
    return;
  }

  await ensurePortIsFree(TEST_PORT);

  const corePath = fs.existsSync(path.resolve(process.cwd(), '../cli'))
    ? path.resolve(process.cwd(), '../cli')
    : path.resolve(process.cwd(), '../tuquet-automa-runner');

  const exePath = resolveBinaryPath(corePath);
  if (!exePath) {
    console.warn(`[E2E Global Setup] Binary not found under ${path.join(corePath, 'target')}. Build via 'cargo build' first.`);
    return;
  }

  console.log(`[E2E Global Setup] Starting Test Daemon: ${exePath}`);
  const exeName = path.basename(exePath).toLowerCase();
  const spawnArgs = exeName.startsWith('specter') || exeName.startsWith('tuquet')
    ? ['runner', 'start', '--port', `${TEST_PORT}`]
    : ['server', '--port', `${TEST_PORT}`];

  daemonProcess = spawn(exePath, spawnArgs, {
    cwd: corePath,
    stdio: 'ignore',
    env: { ...process.env, AUTOMA_PORT: `${TEST_PORT}`, AUTOMA_NO_CTRLC_SHUTDOWN: '1' },
  });

  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`${BASE_URL}/api/v1/health`);
      if (res.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
}

export function teardown(): void {
  if (daemonProcess?.pid) {
    try {
      if (process.platform === 'win32') {
        execSync(`taskkill /PID ${daemonProcess.pid} /F`, { stdio: 'ignore' });
      } else {
        daemonProcess.kill('SIGTERM');
      }
    } catch {}
  }
  killProcessOnPort(TEST_PORT);
}
