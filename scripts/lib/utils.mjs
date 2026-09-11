import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const rootDir = path.resolve(__dirname, '../..');
export const automaDir = path.join(rootDir, '.automa');
export const logsDir = path.join(automaDir, 'logs');
export const packagesDir = path.join(rootDir, 'packages');

// Process-Scoped Runtime Path Priority for Scoop (Node.js LTS & pnpm)
const userProfile = process.env.USERPROFILE || '';
const scoopPnpmDir = path.join(userProfile, 'scoop/apps/pnpm/current');
const scoopNodeDir = path.join(userProfile, 'scoop/apps/nodejs-lts/current');
const scoopShimsDir = path.join(userProfile, 'scoop/shims');

const priorityDirs = [scoopPnpmDir, scoopNodeDir, scoopShimsDir].filter((d) => fs.existsSync(d));
if (priorityDirs.length > 0) {
  const currentPaths = (process.env.PATH || '')
    .split(path.delimiter)
    .filter((p) => p && !priorityDirs.includes(p));
  process.env.PATH = [...priorityDirs, ...currentPaths].join(path.delimiter);
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
 * Canonical Submodules and Packages in Automa Monorepo
 */
export const CANONICAL_MODULES = [
  {
    id: 'core',
    name: 'automa-core',
    type: 'submodule',
    lang: 'Rust',
    description: 'Rust Daemon Engine & REST API (port :8765)',
    path: path.join(rootDir, 'automa-core'),
    port: 8765,
  },
  {
    id: 'webe',
    name: 'automa-webe',
    type: 'submodule',
    lang: 'Vue / TS',
    description: 'Web Extension, Studio Canvas & CLI Runner',
    path: path.join(rootDir, 'automa-webe'),
  },
  {
    id: 'vsce',
    name: 'automa-vsce',
    type: 'submodule',
    lang: 'TypeScript',
    description: 'VS Code Extension & Webview Panes',
    path: path.join(rootDir, 'automa-vsce'),
  },
  {
    id: 'desk',
    name: 'automa-desk',
    type: 'submodule',
    lang: 'Tauri v2 / Vue',
    description: 'Desktop OS App (Tauri v2, port :1420)',
    path: path.join(rootDir, 'automa-desk'),
    port: 1420,
  },
  {
    id: 'vault',
    name: 'automa-vault',
    type: 'submodule',
    lang: 'JSON Schema',
    description: 'Workspace Scenarios, Anti-detect Profiles & Fleets',
    path: path.join(rootDir, 'automa-vault'),
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
    description: 'Canonical Types, DTOs & Generated OpenAPI SDK',
    path: path.join(packagesDir, 'automa-types'),
  },
];

/**
 * Safe file or folder deletion
 */
export function safeRm(targetPath) {
  try {
    if (fs.existsSync(targetPath)) {
      fs.rmSync(targetPath, { recursive: true, force: true });
    }
  } catch (_) {}
}

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
      child.stdout?.on('data', (d) => { stdoutData += d.toString(); });
      child.stderr?.on('data', (d) => { stderrData += d.toString(); });
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
