#!/usr/bin/env node

/**
 * Automa Ecosystem - Workspace Setup Wizard
 * Initializes submodules, installs dependencies, and runs environment doctor diagnostics.
 * Resilient to clean repository state (can run before node_modules are installed).
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import process from 'node:process';
import {
  formatDuration,
  pc,
  printWizardBanner,
  refreshRuntimePaths,
  rootDir,
  runProcess,
} from './lib/utils.mjs';

const args = process.argv.slice(2);
const isAll = args.includes('all') || args.includes('--all');
const isSubmodulesOnly = args.includes('submodules') || args.includes('--submodules');
const isPnpmOnly = args.includes('pnpm') || args.includes('--pnpm');
const isRustOnly = args.includes('rust') || args.includes('--rust');
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
          refreshRuntimePaths();
          const version = execSync('cargo --version', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
          return { pass: true, info: version };
        } catch (_) {
          return { pass: false, info: 'cargo not found in PATH (Run `pnpm run setup:rust` or `scoop install rustup`).' };
        }
      },
    },
    {
      name: 'Cloudflare Tunnel CLI (cloudflared)',
      check: () => {
        try {
          const userProfile = process.env.USERPROFILE || '';
          const p1 = `${userProfile}/scoop/apps/cloudflared/current/cloudflared.exe`;
          const p2 = `${userProfile}/scoop/shims/cloudflared.exe`;
          if (fs.existsSync(p1) || fs.existsSync(p2)) {
            return { pass: true, info: 'Installed via Scoop' };
          }
          const version = execSync('cloudflared --version', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
          return { pass: true, info: version };
        } catch (_) {
          return { pass: false, info: 'cloudflared not found (run pnpm run tunnel:setup).' };
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

async function updateSubmodules(totalSteps = 3, stepIndex = 1) {
  console.log(`\n${pc.cyan(`📦 [${stepIndex}/${totalSteps}] Initializing and updating Git Submodules...`)}`);
  const res = await runProcess('git', ['submodule', 'update', '--init', '--recursive'], { cwd: rootDir });
  if (res.success) {
    console.log(`${pc.green('✔')} Git Submodules initialized successfully (${res.duration})`);
  } else {
    console.error(`${pc.red('✘')} Failed to initialize Git Submodules.`);
    process.exit(1);
  }
}

async function installDependencies(totalSteps = 3, stepIndex = 2) {
  console.log(`\n${pc.cyan(`⚡ [${stepIndex}/${totalSteps}] Installing Monorepo dependencies via pnpm...`)}`);
  const res = await runProcess('pnpm', ['install'], { cwd: rootDir });
  if (res.success) {
    console.log(`${pc.green('✔')} Dependencies installed successfully (${res.duration})`);
  } else {
    console.error(`${pc.red('✘')} Failed to install dependencies.`);
    process.exit(1);
  }
}

async function setupRust(totalSteps = 3, stepIndex = 3) {
  console.log(`\n${pc.cyan(`🦀 [${stepIndex}/${totalSteps}] Setting up Rust & Cargo (for automa-core)...`)}`);
  refreshRuntimePaths();

  try {
    const version = execSync('cargo --version', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    console.log(`${pc.green('✔')} Rust & Cargo is already installed: ${pc.dim(version)}`);
    return true;
  } catch (_) {
    // Proceed to Scoop install
  }

  console.log(`  ${pc.yellow('!')} Rust & Cargo not found on system.`);
  console.log(`  ${pc.cyan('⏳')} Installing rustup via Scoop...\n`);

  try {
    execSync('scoop --version', { stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (_) {
    console.log(`  ${pc.red('✖')} Scoop package manager is not installed.`);
    console.log(`  ${pc.yellow('👉')} Please install Scoop first: irm get.scoop.sh | iex`);
    return false;
  }

  const result = await runProcess('scoop', ['install', 'rustup'], { cwd: rootDir });
  refreshRuntimePaths();

  if (result.success) {
    try {
      const version = execSync('cargo --version', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
      console.log(`\n  ${pc.green('✔')} Rust & Cargo installed successfully via Scoop! (${version})`);
      return true;
    } catch (_) {
      console.log(`\n  ${pc.green('✔')} rustup package installed via Scoop.`);
      console.log(`  ${pc.yellow('ℹ')} Note: Run 'rustup-init' or restart terminal if cargo is not immediately visible.`);
      return true;
    }
  }

  console.log(`\n  ${pc.red('✖')} Failed to install rustup via Scoop.`);
  return false;
}

async function main() {
  printWizardBanner('Ecosystem Setup & Initialization Wizard', 'Configure monorepo dependencies, submodules and environment');

  let mode = 'all';
  if (isDoctor) mode = 'doctor';
  else if (isSubmodulesOnly) mode = 'submodules';
  else if (isPnpmOnly) mode = 'pnpm';
  else if (isRustOnly) mode = 'rust';
  else if (isAll) mode = 'all';
  else {
    const p = await getPrompts();
    if (p && process.stdin.isTTY) {
      const choice = await p.select({
        message: 'Setup cái gì? Bạn muốn thực hiện thao tác khởi tạo nào?',
        options: [
          { value: 'all', label: '🚀 Full Setup', hint: 'Submodules + pnpm install + Rust & Cargo (Khuyến nghị)' },
          { value: 'rust', label: '🦀 Rust & Cargo Setup', hint: 'Cài đặt rustup qua Scoop cho automa-core' },
          { value: 'submodules', label: '📦 Submodules Only', hint: 'Chỉ cập nhật git submodule update --init --recursive' },
          { value: 'pnpm', label: '⚡ Dependencies Only', hint: 'Chỉ cài đặt pnpm install cho toàn bộ monorepo' },
          { value: 'doctor', label: '🩺 Doctor & Diagnostics', hint: 'Kiểm tra phiên bản Node, pnpm, git, rust, cloudflared' },
          { value: 'cloudflared', label: '🚇 Cloudflare Tunnel Setup', hint: 'Cài đặt cloudflared qua Scoop và kiểm tra kết nối' },
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
  } else if (mode === 'cloudflared') {
    await runProcess('node', ['scripts/tunnel-wizard.mjs', 'setup'], { cwd: rootDir });
  } else if (mode === 'submodules') {
    await updateSubmodules(1, 1);
  } else if (mode === 'pnpm') {
    await installDependencies(1, 1);
  } else if (mode === 'rust') {
    await setupRust(1, 1);
    await runDoctor();
  } else {
    await updateSubmodules(3, 1);
    await installDependencies(3, 2);
    await setupRust(3, 3);
    await runDoctor();
  }

  console.log(`\n${pc.bold(pc.green(`🎉 Setup hoàn tất (${formatDuration(Date.now() - start)})!`))}\n`);
}

main().catch((err) => {
  console.error('Lỗi thiết lập:', err);
  process.exit(1);
});
