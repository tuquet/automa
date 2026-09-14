#!/usr/bin/env node

/**
 * Automa Ecosystem - Build Pipeline Wizard
 * Multi-target build orchestrator for Canonical Monorepo Modules.
 */

import path from 'node:path';
import process from 'node:process';
import {
  formatDuration,
  getPrompts,
  pc,
  printWizardBanner,
  rootDir,
  runProcess,
} from './lib/utils.mjs';

const TARGETS = [
  {
    id: 'all',
    label: '📦 Tất cả Packages (Turborepo Full Build)',
    hint: 'Biên dịch toàn bộ packages & submodules',
    cmd: 'pnpm',
    args: ['run', 'build'],
    cwd: rootDir,
  },
  {
    id: 'core',
    label: '🦀 Automa Core (Rust Cargo Release)',
    hint: 'Biên dịch daemon engine automa-core (release mode)',
    cmd: 'cargo',
    args: ['build', '--release', '--manifest-path', 'automa-core/Cargo.toml'],
    cwd: rootDir,
  },
  {
    id: 'studio',
    label: '🎨 Automa Studio (Web Canvas -> dist/studio)',
    hint: 'Biên dịch Web Studio Canvas độc lập',
    cmd: 'pnpm',
    args: ['run', 'build:studio'],
    cwd: rootDir,
  },
  {
    id: 'runner',
    label: '⚡ Automa Runner (Headless Engine -> dist/cli-runner)',
    hint: 'Biên dịch Headless Execution Engine',
    cmd: 'pnpm',
    args: ['run', 'build:runner'],
    cwd: rootDir,
  },
  {
    id: 'vsce',
    label: '🧩 Automa VSCE (VS Code Extension)',
    hint: 'Biên dịch TypeScript và đóng gói VSIX cho VS Code',
    cmd: 'pnpm',
    args: ['-F', 'vscode-automa', 'run', 'build'],
    cwd: rootDir,
  },
  {
    id: 'desk',
    label: '🖥️  Automa Desk (Tauri v2 Desktop App)',
    hint: 'Biên dịch ứng dụng Desktop OS (Vue 3.5 + Tauri)',
    cmd: 'pnpm',
    args: ['run', 'build:desk'],
    cwd: rootDir,
  },
  {
    id: 'types',
    label: '🏷️  Automa Types (@automa/types DTOs & Contracts)',
    hint: 'Biên dịch TypeScript definitions & schemas',
    cmd: 'pnpm',
    args: ['-F', '@automa/types', 'run', 'build'],
    cwd: rootDir,
  },
  {
    id: 'ui',
    label: '✨ Automa UI (@automa/ui Shadcn Components)',
    hint: 'Biên dịch thư viện UI Design System',
    cmd: 'pnpm',
    args: ['-F', '@automa/ui', 'run', 'build'],
    cwd: rootDir,
  },
];

const args = process.argv.slice(2);
const requestedTarget = args[0]?.replace(/^--/, '');

async function resolveBuildTarget() {
  if (requestedTarget) {
    const found = TARGETS.find((t) => t.id === requestedTarget);
    if (found) return [found];
    if (requestedTarget === 'dry-run') {
      console.log('Build targets valid: ' + TARGETS.map((t) => t.id).join(', '));
      process.exit(0);
    }
  }

  const p = await getPrompts();
  if (!process.stdin.isTTY || !p) {
    return [TARGETS[0]]; // Default to All
  }

  const selected = await p.multiselect({
    message: 'Build cái gì? Chọn các mục bạn muốn biên dịch:',
    options: TARGETS.map((t) => ({
      value: t.id,
      label: t.label,
      hint: t.hint,
    })),
    required: true,
  });

  if (p.isCancel(selected)) {
    p.cancel('Đã hủy build.');
    process.exit(0);
  }

  return TARGETS.filter((t) => selected.includes(t.id));
}

async function main() {
  printWizardBanner('Build Pipeline Wizard', 'Select and compile monorepo targets');

  const selectedTargets = await resolveBuildTarget();
  console.log(`\n${pc.bold(pc.cyan(`Khởi chạy biên dịch ${selectedTargets.length} mục tiêu:`))}`);
  selectedTargets.forEach((t) => console.log(`  • ${t.label}`));
  console.log('');

  const startTime = Date.now();
  let allSuccess = true;

  for (const target of selectedTargets) {
    console.log(`\n${pc.bold(pc.yellow(`▶ Đang build: ${target.label}...`))}`);
    console.log(`${pc.dim(`$ ${target.cmd} ${target.args.join(' ')}`)}\n`);

    const res = await runProcess(target.cmd, target.args, { cwd: target.cwd });
    if (res.success) {
      console.log(`\n${pc.green('✔')} ${target.label} hoàn tất thành công (${res.duration})`);
    } else {
      console.error(`\n${pc.red('✘')} ${target.label} thất bại (Exit code: ${res.code})`);
      allSuccess = false;
      break;
    }
  }

  const totalDuration = formatDuration(Date.now() - startTime);
  if (allSuccess) {
    console.log(`\n${pc.bold(pc.green(`🎉 TOÀN BỘ BUILD THÀNH CÔNG (${totalDuration})!`))}\n`);
    process.exit(0);
  } else {
    console.error(`\n${pc.bold(pc.red(`💥 BUILD THẤT BẠI (${totalDuration})! Vui lòng kiểm tra log lỗi bên trên.`))}\n`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Lỗi build wizard:', err);
  process.exit(1);
});
