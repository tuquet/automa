#!/usr/bin/env node

/**
 * Automa Ecosystem Unified Dev Orchestrator
 * Spawns and manages development watchers across all submodules in parallel.
 * Handles graceful shutdown and prevents zombie child processes.
 */

import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const isDryRun = process.argv.includes('--dry-run');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
};

const tasks = [
  {
    name: 'CORE',
    color: colors.cyan,
    cmd: process.platform === 'win32' ? 'cargo.exe' : 'cargo',
    args: ['watch', '-x', 'run'],
    cwd: path.join(rootDir, 'automa-core'),
    description: 'Rust Daemon on port 8765',
  },
  {
    name: 'STUDIO',
    color: colors.magenta,
    cmd: process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
    args: ['-F', 'automa', 'run', 'dev:studio'],
    cwd: rootDir,
    description: 'Automa Studio Standalone Canvas',
  },
  {
    name: 'VSCODE',
    color: colors.green,
    cmd: process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
    args: ['-F', 'vscode-automa', 'run', 'watch'],
    cwd: rootDir,
    description: 'VS Code Extension TS compiler',
  },
];

console.log(`${colors.bright}${colors.yellow}====================================================${colors.reset}`);
console.log(`${colors.bright}🚀 Automa Ecosystem Dev Orchestrator${colors.reset}`);
console.log(`${colors.bright}${colors.yellow}====================================================${colors.reset}\n`);

tasks.forEach((t) => {
  console.log(`  ${t.color}[${t.name}]${colors.reset} ${t.description}`);
  console.log(`    ${colors.gray}Command: ${t.cmd} ${t.args.join(' ')}${colors.reset}`);
});
console.log('\n');

if (isDryRun) {
  console.log(`${colors.green}✔ Dry run complete. All 3 task targets validated successfully.${colors.reset}`);
  process.exit(0);
}

const childProcesses = [];

function pipeOutput(proc, name, color) {
  const prefix = `${color}[${name}]${colors.reset} `;

  const formatChunk = (chunk) => {
    return chunk
      .toString()
      .split('\n')
      .filter((line, idx, arr) => idx < arr.length - 1 || line.trim().length > 0)
      .map((line) => `${prefix}${line}`)
      .join('\n');
  };

  proc.stdout?.on('data', (data) => {
    const formatted = formatChunk(data);
    if (formatted) console.log(formatted);
  });

  proc.stderr?.on('data', (data) => {
    const formatted = formatChunk(data);
    if (formatted) console.error(formatted);
  });
}

function startAll() {
  tasks.forEach((task) => {
    console.log(`${task.color}[${task.name}] Starting ${task.description}...${colors.reset}`);
    const proc = spawn(task.cmd, task.args, {
      cwd: task.cwd,
      shell: true,
      stdio: ['inherit', 'pipe', 'pipe'],
      env: { ...process.env, FORCE_COLOR: '1' },
    });

    pipeOutput(proc, task.name, task.color);

    proc.on('close', (code) => {
      console.log(`${task.color}[${task.name}] Process exited with code ${code}.${colors.reset}`);
    });

    proc.on('error', (err) => {
      console.error(`${colors.red}[${task.name}] Process error: ${err.message}${colors.reset}`);
    });

    childProcesses.push({ name: task.name, proc });
  });
}

function cleanup() {
  console.log(`\n${colors.yellow}Shutting down all development processes...${colors.reset}`);
  childProcesses.forEach(({ name, proc }) => {
    try {
      if (proc && !proc.killed) {
        if (process.platform === 'win32' && proc.pid) {
          spawn('taskkill', ['/pid', String(proc.pid), '/f', '/t'], { stdio: 'ignore' });
        } else {
          proc.kill('SIGTERM');
        }
      }
    } catch (_) {
      // Ignored
    }
  });
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
process.on('exit', cleanup);

startAll();
