#!/usr/bin/env node

/**
 * Automa Ecosystem - Workspace Setup Wizard
 * Initializes submodules, installs dependencies, and runs environment doctor diagnostics.
 * Resilient to clean repository state (can run before node_modules are installed).
 */

import { execSync } from 'node:child_process';
import process from 'node:process';
import {
  formatDuration,
  pc,
  printWizardBanner,
  rootDir,
  runProcess,
} from './lib/utils.mjs';

const args = process.argv.slice(2);
const isAll = args.includes('all') || args.includes('--all');
const isSubmodulesOnly = args.includes('submodules') || args.includes('--submodules');
const isPnpmOnly = args.includes('pnpm') || args.includes('--pnpm');
const isDoctor = args.includes('doctor') || args.includes('--doctor');

// Dynamic loader for @clack/prompts if node_modules are present
async function getPrompts() {
  try {
    const mod = await import('@clack/prompts');
    return mod.default || mod;
  } catch (_) {
    return null;
  }
}

async function runDoctor() {
  console.log(`\n${pc.bold(pc.cyan('🩺 Running Automa Ecosystem Environment Doctor...'))}\n`);

  const checks = [
    {
      name: 'Node.js Runtime',
      check: () => {
        try {
          const version = execSync('node --version', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
          const major = Number.parseInt(version.slice(1).split('.')[0], 10);
          return {
            pass: major >= 18,
            info: `${version} (Requires >= v18.0.0)`,
          };
        } catch (_) {
          const version = process.version;
          return { pass: true, info: `${version} (process fallback)` };
        }
      },
    },
    {
      name: 'PNPM Package Manager',
      check: () => {
        try {
          const version = execSync('pnpm --version', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
          return { pass: true, info: `v${version}` };
        } catch (_) {
          return { pass: false, info: 'pnpm not found in PATH.' };
        }
      },
    },
    {
      name: 'Git Version Control',
      check: () => {
        try {
          const version = execSync('git --version', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
          return { pass: true, info: version };
        } catch (_) {
          return { pass: false, info: 'git not found in PATH.' };
        }
      },
    },
    {
      name: 'Rust & Cargo (for automa-core)',
      check: () => {
        try {
          const version = execSync('cargo --version', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
          return { pass: true, info: version };
        } catch (_) {
          return { pass: false, info: 'cargo not found in PATH (Optional for frontend-only dev).' };
        }
      },
    },
  ];

  for (const c of checks) {
    const res = c.check();
    if (res.pass) {
      console.log(`  ${pc.green('✔')} ${pc.bold(c.name)}: ${pc.dim(res.info)}`);
    } else {
      console.log(`  ${pc.yellow('⚠️')} ${pc.bold(c.name)}: ${pc.yellow(res.info)}`);
    }
  }
  console.log('');
}

async function updateSubmodules() {
  console.log(`\n${pc.cyan('📦 [1/2] Initializing and updating Git Submodules...')}`);
  const res = await runProcess('git', ['submodule', 'update', '--init', '--recursive'], { cwd: rootDir });
  if (res.success) {
    console.log(`${pc.green('✔')} Git Submodules initialized successfully (${res.duration})`);
  } else {
    console.error(`${pc.red('✘')} Failed to initialize Git Submodules.`);
    process.exit(1);
  }
}

async function installDependencies() {
  console.log(`\n${pc.cyan('⚡ [2/2] Installing Monorepo dependencies via pnpm...')}`);
  const res = await runProcess('pnpm', ['install'], { cwd: rootDir });
  if (res.success) {
    console.log(`${pc.green('✔')} Dependencies installed successfully (${res.duration})`);
  } else {
    console.error(`${pc.red('✘')} Failed to install dependencies.`);
    process.exit(1);
  }
}

async function main() {
  printWizardBanner('Ecosystem Setup & Initialization Wizard', 'Configure monorepo dependencies, submodules and environment');

  let mode = 'all';
  if (isDoctor) mode = 'doctor';
  else if (isSubmodulesOnly) mode = 'submodules';
  else if (isPnpmOnly) mode = 'pnpm';
  else if (isAll) mode = 'all';
  else {
    const p = await getPrompts();
    if (p && process.stdin.isTTY) {
      const choice = await p.select({
        message: 'Setup cái gì? Bạn muốn thực hiện thao tác khởi tạo nào?',
        options: [
          { value: 'all', label: '🚀 Full Setup', hint: 'Tải Submodules + Cài đặt pnpm install (Khuyến nghị)' },
          { value: 'submodules', label: '📦 Submodules Only', hint: 'Chỉ cập nhật git submodule update --init --recursive' },
          { value: 'pnpm', label: '⚡ Dependencies Only', hint: 'Chỉ cài đặt pnpm install cho toàn bộ monorepo' },
          { value: 'doctor', label: '🩺 Doctor & Diagnostics', hint: 'Kiểm tra phiên bản Node, pnpm, git, rust' },
        ],
      });

      if (p.isCancel(choice)) {
        p.cancel('Đã hủy thao tác.');
        process.exit(0);
      }
      mode = choice;
    } else {
      // Automatic default mode when dependencies or TTY are not available
      mode = 'all';
    }
  }

  const start = Date.now();
  if (mode === 'doctor') {
    await runDoctor();
  } else if (mode === 'submodules') {
    await updateSubmodules();
  } else if (mode === 'pnpm') {
    await installDependencies();
  } else {
    await updateSubmodules();
    await installDependencies();
    await runDoctor();
  }

  console.log(`\n${pc.bold(pc.green(`🎉 Setup hoàn tất (${formatDuration(Date.now() - start)})!`))}\n`);
}

main().catch((err) => {
  console.error('Lỗi thiết lập:', err);
  process.exit(1);
});
