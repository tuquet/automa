#!/usr/bin/env node

/**
 * Automa Ecosystem - Contracts & Sync Wizard
 * Full 4-step Contract-First synchronization coordinator:
 * 1. Export OpenAPI spec from Rust source / live daemon
 * 2. Validate strict schema annotations
 * 3. Generate TypeScript SDK (@hey-api)
 * 4. Build @automa/types SDK client
 */

import process from 'node:process';
import {
  formatDuration,
  getPrompts,
  pc,
  printWizardBanner,
  rootDir,
  runProcess,
} from './lib/utils.mjs';

const SYNC_TARGETS = [
  {
    id: 'all',
    label: '🔄 Full API Contract Pipeline (OpenAPI + Schema + SDK)',
    hint: 'Đồng bộ toàn diện Spec, sinh mã SDK và build @automa/types',
    steps: [
      { name: '1. Export OpenAPI Spec', cmd: 'node', args: ['scripts/export-openapi.mjs'] },
      { name: '2. Strict Schema Validation', cmd: 'node', args: ['scripts/enforce-strict-schema.mjs'] },
      { name: '3. Generate TypeScript SDK Client', cmd: 'pnpm', args: ['-F', '@automa/types', 'run', 'generate:api'] },
      { name: '4. Build @automa/types Distribution', cmd: 'pnpm', args: ['-F', '@automa/types', 'run', 'build'] },
    ],
  },
  {
    id: 'openapi',
    label: '📄 Chỉ xuất OpenAPI Spec (openapi.json)',
    hint: 'Trích xuất openapi.json từ backend live hoặc cargo export',
    steps: [
      { name: 'Export OpenAPI Spec', cmd: 'node', args: ['scripts/export-openapi.mjs'] },
    ],
  },
];

const args = process.argv.slice(2);
const requestedTarget = args[0]?.replace(/^--/, '');

async function resolveTarget() {
  if (requestedTarget) {
    const found = SYNC_TARGETS.find((t) => t.id === requestedTarget);
    if (found) return found;
    if (requestedTarget === 'dry-run') {
      console.log('Sync targets valid: ' + SYNC_TARGETS.map((t) => t.id).join(', '));
      process.exit(0);
    }
  }

  const p = await getPrompts();
  if (!process.stdin.isTTY || !p) {
    return SYNC_TARGETS[0]; // Default to All
  }

  const selected = await p.select({
    message: 'Sync cái gì? Đồng bộ phần nào?',
    options: SYNC_TARGETS.map((t) => ({
      value: t.id,
      label: t.label,
      hint: t.hint,
    })),
  });

  if (p.isCancel(selected)) {
    p.cancel('Đã hủy sync.');
    process.exit(0);
  }

  return SYNC_TARGETS.find((t) => t.id === selected) || SYNC_TARGETS[0];
}

async function main() {
  printWizardBanner('Contracts & Sync Wizard', 'Keep OpenAPI, TypeScript SDK and Applications in sync');

  const target = await resolveTarget();
  console.log(`\n${pc.bold(pc.cyan(`Khởi chạy quy trình: ${target.label}`))}\n`);

  const startTime = Date.now();
  let allSuccess = true;

  for (const step of target.steps) {
    console.log(`${pc.bold(pc.yellow(`▶ Đang chạy: ${step.name}...`))}`);
    console.log(`${pc.dim(`$ ${step.cmd} ${step.args.join(' ')}`)}\n`);

    const res = await runProcess(step.cmd, step.args, { cwd: rootDir });
    if (res.success) {
      console.log(`\n${pc.green('✔')} ${step.name} hoàn tất (${res.duration})\n`);
    } else {
      console.error(`\n${pc.red('✘')} ${step.name} thất bại (Exit code: ${res.code})\n`);
      allSuccess = false;
      break;
    }
  }

  const totalDuration = formatDuration(Date.now() - startTime);
  if (allSuccess) {
    console.log(`${pc.bold(pc.green(`🎉 ĐỒNG BỘ CONTRACT THÀNH CÔNG (${totalDuration})!`))}\n`);
    process.exit(0);
  } else {
    console.error(`${pc.bold(pc.red(`💥 QUY TRÌNH ĐỒNG BỘ THẤT BẠI (${totalDuration})!`))}\n`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Lỗi sync wizard:', err);
  process.exit(1);
});
