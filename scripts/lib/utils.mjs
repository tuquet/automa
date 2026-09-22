import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const rootDir = path.resolve(__dirname, '../..');
export const automaDir = path.join(rootDir, '.automa');
export const logsDir = path.join(automaDir, 'logs');
export const appsDir = path.join(rootDir, 'apps');
export const packagesDir = path.join(rootDir, 'packages');

export const homeDir = process.env.USERPROFILE || process.env.HOME || '';

// Process-Scoped Runtime Path Priority for Scoop (Node.js LTS & Current, pnpm, rustup/cargo, cloudflared)
export function refreshRuntimePaths() {
  if (process.platform !== 'win32' || !homeDir) return;

  const scoopPnpmDir = path.join(homeDir, 'scoop/apps/pnpm/current');
  const scoopNodeDir = path.join(homeDir, 'scoop/apps/nodejs/current');
  const scoopNodeLtsDir = path.join(homeDir, 'scoop/apps/nodejs-lts/current');
  const scoopCloudflaredDir = path.join(homeDir, 'scoop/apps/cloudflared/current');
  const scoopShimsDir = path.join(homeDir, 'scoop/shims');
  const scoopCargoDir = path.join(homeDir, 'scoop/apps/rustup/current/.cargo/bin');
  const scoopPersistCargoDir = path.join(homeDir, 'scoop/persist/rustup/.cargo/bin');
  const scoopRustDir = path.join(homeDir, 'scoop/apps/rust/current/bin');
  const userCargoDir = path.join(homeDir, '.cargo/bin');

  const priorityDirs = [
    scoopPnpmDir,
    scoopNodeDir,
    scoopNodeLtsDir,
    scoopCloudflaredDir,
    scoopShimsDir,
    scoopCargoDir,
    scoopPersistCargoDir,
    scoopRustDir,
    userCargoDir,
  ].filter((d) => fs.existsSync(d));

  if (priorityDirs.length > 0) {
    const currentPaths = (process.env.PATH || '')
      .split(path.delimiter)
      .filter((p) => p && !priorityDirs.includes(p));
    process.env.PATH = [...priorityDirs, ...currentPaths].join(path.delimiter);
  }
}

/**
 * Resilient picocolors loader with zero-dependency fallback for bootstrap scripts
 */
let pcModule;
try {
  const mod = await import('picocolors');
  pcModule = mod.default || mod;
} catch (_) {
  const wrap = (code, end = 0) => (s) => `\x1b[${code}m${s}\x1b[${end}m`;
  pcModule = {
    bold: wrap(1, 22),
    dim: wrap(2, 22),
    italic: wrap(3, 23),
    underline: wrap(4, 24),
    reset: wrap(0, 0),
    green: wrap(32, 39),
    yellow: wrap(33, 39),
    red: wrap(31, 39),
    cyan: wrap(36, 39),
    magenta: wrap(35, 39),
    white: wrap(37, 39),
    gray: wrap(90, 39),
  };
}
export const pc = pcModule;

/**
 * Resilient dynamic loader for @clack/prompts
 */
export async function getPrompts() {
  try {
    const mod = await import('@clack/prompts');
    return mod.default || mod;
  } catch (_) {
    return null;
  }
}

/**
 * Canonical Applications and Packages in Automa Monorepo
 */
export const CANONICAL_MODULES = [
  {
    id: 'core',
    name: 'apps/core',
    type: 'app',
    lang: 'Rust',
    description: 'Rust Daemon Engine & REST API (port :8765)',
    path: path.join(appsDir, 'core'),
    port: 8765,
  },
  {
    id: 'webe',
    name: '@automa/webe',
    type: 'app',
    lang: 'Vue / TS',
    description: 'Web Extension, Studio Canvas & CLI Runner',
    path: path.join(appsDir, 'webe'),
  },
  {
    id: 'vsce',
    name: 'vscode-automa',
    type: 'app',
    lang: 'TypeScript',
    description: 'VS Code Extension & Webview Panes',
    path: path.join(appsDir, 'vsce'),
  },
  {
    id: 'desk',
    name: '@automa/desk',
    type: 'app',
    lang: 'Tauri v2 / Vue',
    description: 'Desktop OS App (Tauri v2, port :1420)',
    path: path.join(appsDir, 'desk'),
    port: 1420,
  },
  {
    id: 'vault',
    name: 'apps/vault',
    type: 'app',
    lang: 'JSON Schema',
    description: 'Workspace Scenarios, Anti-detect Profiles & Fleets',
    path: path.join(appsDir, 'vault'),
  },
  {
    id: 'ui',
    name: '@automa/ui',
    type: 'package',
    lang: 'Vue 3 / Shadcn',
    description: 'Atomic Shadcn-Vue UI Design System',
    path: path.join(packagesDir, 'automa-ui'),
  },
  {
    id: 'types',
    name: '@automa/types',
    type: 'package',
    lang: 'TypeScript',
    description: 'Typed OpenAPI Client SDK',
    path: path.join(packagesDir, 'automa-types'),
  },
  {
    id: 'polyfill',
    name: 'webextension-polyfill',
    type: 'package',
    lang: 'JavaScript',
    description: 'WebExtension & VS Code compatibility polyfill',
    path: path.join(packagesDir, 'webextension-polyfill'),
  },
];

const MAX_BUFFER_CHARS = 200_000;

/**
 * Ensure logs directory exists
 */
export function ensureLogsDir() {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
}

/**
 * Formats duration in seconds
 */
export function formatDuration(ms) {
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Run an async child process with duration measurement and cross-platform safety
 */
export function runProcess(command, args = [], options = {}) {
  refreshRuntimePaths();
  return new Promise((resolve) => {
    const startTime = Date.now();
    const cwd = options.cwd || rootDir;
    const stdio = options.stdio || 'inherit';

    const child = spawn(command, args, {
      cwd,
      stdio,
      shell: true,
      env: { ...process.env, FORCE_COLOR: '1', ...options.env },
    });

    let stdoutData = '';
    let stderrData = '';

    if (stdio === 'pipe') {
      child.stdout?.on('data', (d) => {
        stdoutData = (stdoutData + d.toString()).slice(-MAX_BUFFER_CHARS);
      });
      child.stderr?.on('data', (d) => {
        stderrData = (stderrData + d.toString()).slice(-MAX_BUFFER_CHARS);
      });
    }

    child.on('close', (code) => {
      const durationMs = Date.now() - startTime;
      resolve({
        success: code === 0,
        code: code ?? 1,
        durationMs,
        duration: formatDuration(durationMs),
        stdout: stdoutData,
        stderr: stderrData,
      });
    });

    child.on('error', (err) => {
      const durationMs = Date.now() - startTime;
      resolve({
        success: false,
        code: 1,
        durationMs,
        duration: formatDuration(durationMs),
        error: err,
        stdout: stdoutData,
        stderr: stderrData,
      });
    });
  });
}

/**
 * Print a standard wizard banner
 */
export function printWizardBanner(title, subtitle = '') {
  console.log(`\n${pc.bold(pc.cyan('===================================================================='))}`);
  console.log(`  ${pc.bold(pc.magenta('🧙 AUTOMA WIZARD:'))} ${pc.bold(pc.white(title))}`);
  if (subtitle) {
    console.log(`  ${pc.dim(subtitle)}`);
  }
  console.log(`${pc.bold(pc.cyan('===================================================================='))}\n`);
}
