#!/usr/bin/env node

/**
 * Automa Ecosystem - Lint & Quality Wizard
 * Modular linter, style-debt checker, schema validator, and auto-fixer.
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

const LINT_TARGETS = [
  {
    id: 'all',
    label: '✨ Tất cả Packages (Turborepo Lint + Style Debt Check)',
    hint: 'Chạy Biome check trên toàn bộ monorepo & kiểm tra style technical debt',
    steps: [
      { name: 'Turborepo Biome Check', cmd: 'turbo', args: ['run', 'lint'] },
      { name: 'Style Debt Linter', cmd: 'node', args: ['scripts/lint-style-debt.mjs'] },
    ],
  },
  {
    id: 'fix',
    label: '🔧 Auto-Fix All (Biome Auto-Fix & Format)',
    hint: 'Tự động sửa lỗi formatting và linter có thể sửa an toàn',
    steps: [
      { name: 'Turborepo Biome Fix', cmd: 'turbo', args: ['run', 'lint:fix'] },
      { name: 'Turborepo Format', cmd: 'turbo', args: ['run', 'format'] },
    ],
  },
  {
    id: 'webe',
    label: '🌐 Chỉ Lint Automa Webe (Extension & Studio)',
    hint: 'Chạy linter cho apps/webe',
    steps: [
      { name: 'Webe Lint', cmd: 'pnpm', args: ['-F', '@automa/webe', 'run', 'lint'] },
    ],
  },
  {
    id: 'ui',
    label: '🎨 Chỉ Lint Packages UI (@automa/ui)',
    hint: 'Kiểm tra components trong packages/ui',
    steps: [
      { name: 'UI Lint', cmd: 'pnpm', args: ['-F', '@automa/ui', 'run', 'lint'] },
    ],
  },
  {
    id: 'style',
    label: '🔍 Style Technical Debt Scanner',
    hint: 'Kiểm tra token màu sắc, typography, font-size, layout modals',
    steps: [
      { name: 'Style Debt Scanner', cmd: 'node', args: ['scripts/lint-style-debt.mjs'] },
    ],
  },
  {
    id: 'schema',
    label: '📐 Strict OpenAPI & DTO Schema Linter',
    hint: 'Kiểm tra utoipa annotations và types trong automa-core/src/api',
    steps: [
      { name: 'Strict Schema Linter', cmd: 'node', args: ['scripts/enforce-strict-schema.mjs'] },
    ],
  },
];

const args = process.argv.slice(2);
const requestedTarget = args[0]?.replace(/^--/, '');

async function resolveTarget() {
  if (requestedTarget) {
    const found = LINT_TARGETS.find((t) => t.id === requestedTarget);
    if (found) return found;
    if (requestedTarget === 'dry-run') {
      console.log('Lint targets valid: ' + LINT_TARGETS.map((t) => t.id).join(', '));
      process.exit(0);
    }
  }

  const p = await getPrompts();
  if (!process.stdin.isTTY || !p) {
    return LINT_TARGETS[0]; // Default to All
  }

  const selected = await p.select({
    message: 'Lint cái gì? Lint bao nhiêu module?',
    options: LINT_TARGETS.map((t) => ({
      value: t.id,
      label: t.label,
      hint: t.hint,
    })),
  });

  if (p.isCancel(selected)) {
    p.cancel('Đã hủy lint.');
    process.exit(0);
  }

  return LINT_TARGETS.find((t) => t.id === selected) || LINT_TARGETS[0];
}

async function main() {
  printWizardBanner('Lint & Code Quality Wizard', 'Select modules to inspect or auto-fix');

  const target = await resolveTarget();
  console.log(`\n${pc.bold(pc.cyan(`Khởi chạy kiểm tra: ${target.label}`))}\n`);

  const startTime = Date.now();
  let allSuccess = true;

  for (const step of target.steps) {
    console.log(`${pc.bold(pc.yellow(`▶ Đang chạy: ${step.name}...`))}`);
    console.log(`${pc.dim(`$ ${step.cmd} ${step.args.join(' ')}`)}\n`);

    const res = await runProcess(step.cmd, step.args, { cwd: rootDir });
    if (res.success) {
      console.log(`\n${pc.green('✔')} ${step.name} hoàn tất (${res.duration})\n`);
    } else {
      console.error(`\n${pc.red('✘')} ${step.name} phát hiện vi phạm (Exit code: ${res.code})\n`);
      allSuccess = false;
      break;
    }
  }

  const totalDuration = formatDuration(Date.now() - startTime);
  if (allSuccess) {
    console.log(`${pc.bold(pc.green(`🎉 KIỂM TRA CHẤT LƯỢNG ĐẠT 100% (${totalDuration})!`))}\n`);
    process.exit(0);
  } else {
    console.error(`${pc.bold(pc.red(`💥 PHÁT HIỆN LỖI LINTER / STYLE (${totalDuration})! Vui lòng sửa các lỗi trên.`))}\n`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Lỗi lint wizard:', err);
  process.exit(1);
});
