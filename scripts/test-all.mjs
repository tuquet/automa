#!/usr/bin/env node

/**
 * Automa Ecosystem - Unified Test Matrix Wizard
 * Supports 4-Tier verification, modular suite selection, and interactive TUI.
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

const SUITES = [
  {
    id: 'core',
    tier: 1,
    name: 'Automa Rust Core (Engine, API & State)',
    hint: 'Cargo unit & integration tests trong automa-core',
    cmd: 'cargo',
    args: ['test'],
    cwd: path.join(rootDir, 'apps/core'),
  },
  {
    id: 'webe',
    tier: 1,
    name: 'Automa Web Extension & Studio (Vitest)',
    hint: 'Studio composables, route sync, canvas & AST tests',
    cmd: 'pnpm',
    args: ['-F', '@automa/webe', 'test'],
    cwd: rootDir,
  },
  {
    id: 'ui',
    tier: 1,
    name: 'Automa UI Design System (@automa/ui Vitest)',
    hint: 'Virtual table, shadcn primitives & domain store tests',
    cmd: 'pnpm',
    args: ['-F', '@automa/ui', 'test'],
    cwd: rootDir,
  },
  {
    id: 'e2e',
    tier: 2,
    name: 'Cross-Service E2E API Integration (Port 8766)',
    hint: 'Vitest Blackbox tests qua Generated SDK chống regression',
    cmd: 'pnpm',
    args: ['exec', 'vitest', 'run', '--config', 'vitest.config.ts'],
    cwd: rootDir,
  },
  {
    id: 'schema',
    tier: 3,
    name: 'Strict OpenAPI & JSON Schema Linter',
    hint: 'Kiểm tra 100% tuân thủ utoipa annotations & snake_case',
    cmd: 'node',
    args: ['scripts/enforce-strict-schema.mjs'],
    cwd: rootDir,
  },
];

const args = process.argv.slice(2);
const isBail = args.includes('--bail');
const isList = args.includes('--list');

if (isList) {
  console.log(`\n${pc.bold(pc.cyan('📋 Danh sách các Test Suites trong Automa Ecosystem:'))}\n`);
  SUITES.forEach((s) => {
    console.log(`  • [Tier ${s.tier}] ${pc.bold(s.id.padEnd(8))}: ${s.name} ${pc.dim(`(${s.hint})`)}`);
  });
  console.log('');
  process.exit(0);
}

async function resolveSuites() {
  if (args.includes('--core')) return SUITES.filter((s) => s.id === 'core');
  if (args.includes('--webe')) return SUITES.filter((s) => s.id === 'webe');
  if (args.includes('--ui')) return SUITES.filter((s) => s.id === 'ui');
  if (args.includes('--e2e')) return SUITES.filter((s) => s.id === 'e2e');
  if (args.includes('--schema')) return SUITES.filter((s) => s.id === 'schema');

  if (args.includes('--tier') || args.some((a) => a.startsWith('--tier'))) {
    const tierIdx = args.indexOf('--tier');
    const tierVal = tierIdx !== -1 ? args[tierIdx + 1] : args.find((a) => a.startsWith('--tier='))?.split('=')[1];
    const tierNum = Number.parseInt(tierVal || '1', 10);
    return SUITES.filter((s) => s.tier === tierNum);
  }

  if (args.includes('--all') || args.includes('all')) {
    return SUITES;
  }

  const p = await getPrompts();
  if (!process.stdin.isTTY || !p) {
    return SUITES; // Non-interactive or missing TUI deps defaults to all
  }

  const choice = await p.select({
    message: 'Test cái gì? Test tầng nào trong 4 tầng kiểm thử?',
    options: [
      { value: 'all', label: '🧪 Tất cả Suites (Tier 1 - 3 Toàn Diện)', hint: 'Chạy toàn bộ test suites' },
      { value: 'tier1', label: '⚡ Tier 1: Unit Tests (Nhanh, RAM < 500MB)', hint: 'Rust Core + Webe + UI' },
      { value: 'tier2', label: '🌐 Tier 2: E2E Integration API Tests', hint: 'Kiểm thử blackbox SDK chống daemon' },
      { value: 'tier3', label: '📐 Tier 3: Strict Schema Validator', hint: 'Kiểm tra OpenAPI schema không tải máy' },
      { value: 'core', label: '🦀 Chỉ kiểm thử Automa Core (Cargo test)', hint: 'automa-core Rust tests' },
      { value: 'webe', label: '🌐 Chỉ kiểm thử Automa Webe (Vitest)', hint: 'apps/webe extension & studio tests' },
      { value: 'ui', label: '🎨 Chỉ kiểm thử Automa UI (Vitest)', hint: 'packages/ui component tests' },
    ],
  });

  if (p.isCancel(choice)) {
    p.cancel('Đã hủy kiểm thử.');
    process.exit(0);
  }

  if (choice === 'tier1') return SUITES.filter((s) => s.tier === 1);
  if (choice === 'tier2') return SUITES.filter((s) => s.tier === 2);
  if (choice === 'tier3') return SUITES.filter((s) => s.tier === 3);
  if (choice === 'core') return SUITES.filter((s) => s.id === 'core');
  if (choice === 'webe') return SUITES.filter((s) => s.id === 'webe');
  if (choice === 'ui') return SUITES.filter((s) => s.id === 'ui');
  return SUITES;
}

async function main() {
  printWizardBanner('Unified Test Matrix Wizard', 'Multi-tier regression & integration verification');

  const selectedSuites = await resolveSuites();
  console.log(`\n${pc.bold(pc.cyan(`Khởi chạy ${selectedSuites.length} test suites:`))}`);
  selectedSuites.forEach((s) => console.log(`  • [Tier ${s.tier}] ${s.name}`));
  console.log('');

  const overallStart = Date.now();
  const results = [];

  for (const suite of selectedSuites) {
    console.log(`\n${pc.bold(pc.cyan(`▶ [RUNNING] [Tier ${suite.tier}] ${suite.name}...`))}`);
    console.log(`${pc.dim(`$ ${suite.cmd} ${suite.args.join(' ')} (in ${suite.cwd})`)}\n`);

    const res = await runProcess(suite.cmd, suite.args, { cwd: suite.cwd });
    results.push({ ...suite, ...res });

    if (res.success) {
      console.log(`\n${pc.bold(pc.green(`✔ [PASSED] ${suite.name} (${res.duration})`))}`);
    } else {
      console.error(`\n${pc.bold(pc.red(`✘ [FAILED] ${suite.name} (${res.duration}, exit code: ${res.code})`))}`);
      if (isBail) {
        console.error(pc.red('\n[Bail Mode] Dừng ngay kiểm thử do phát hiện lỗi suite.'));
        break;
      }
    }
  }

  const totalDuration = formatDuration(Date.now() - overallStart);

  // Summary Report
  console.log(`\n${pc.bold(pc.cyan('===================================================================='))}`);
  console.log(`${pc.bold(pc.white(`📊  TEST SUMMARY REPORT (${totalDuration})`))}`);
  console.log(`${pc.bold(pc.cyan('===================================================================='))}`);

  let allPassed = true;
  for (const res of results) {
    const status = res.success ? pc.green('✔ PASSED') : pc.red(`✘ FAILED (${res.code})`);
    console.log(`  ${res.name.padEnd(52)} [${status}]  ${res.duration}`);
    if (!res.success) allPassed = false;
  }
  console.log(`${pc.bold(pc.cyan('===================================================================='))}\n`);

  if (allPassed) {
    console.log(`${pc.bold(pc.green('🎉 ALL SELECTED TEST SUITES PASSED CLEANLY! 🎉'))}\n`);
    process.exit(0);
  } else {
    console.error(`${pc.bold(pc.red('💥 SOME TEST SUITES FAILED! Please review logs above.'))}\n`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Unexpected test runner failure:', err);
  process.exit(1);
});
