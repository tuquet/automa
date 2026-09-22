#!/usr/bin/env node

/**
 * Automa Ecosystem - Master CLI Wizard
 * Single entry point providing an interactive pipeline experience for Dev, Build, Test, Lint, Sync & Setup.
 */

import process from 'node:process';
import {
  getPrompts,
  pc,
  printWizardBanner,
  rootDir,
  runProcess,
} from './lib/utils.mjs';

const WIZARD_ACTIONS = [
  {
    value: 'dev',
    label: '🚀 1. Dev Orchestrator',
    hint: 'Khởi chạy đa dịch vụ đồng thời (Core, VSCE, Studio, Desk, Docs)',
    script: 'scripts/dev-orchestrator.mjs',
  },
  {
    value: 'build',
    label: '📦 2. Build Pipeline',
    hint: 'Biên dịch từng module hoặc đóng gói toàn bộ monorepo',
    script: 'scripts/build-wizard.mjs',
  },
  {
    value: 'test',
    label: '🧪 3. Test Matrix',
    hint: 'Chạy kiểm thử 4 tầng: Unit, E2E API, Strict Schema',
    script: 'scripts/test-all.mjs',
  },
  {
    value: 'lint',
    label: '✨ 4. Lint & Code Quality',
    hint: 'Kiểm tra Biome, Style Debt, Schema annotations và Auto-fix',
    script: 'scripts/lint-wizard.mjs',
  },
  {
    value: 'sync',
    label: '🔄 5. Contracts & Sync',
    hint: 'Đồng bộ OpenAPI spec, Bruno collection và TypeScript SDK',
    script: 'scripts/sync-api.mjs',
  },
  {
    value: 'setup',
    label: '⚙️  6. Ecosystem Setup & Doctor',
    hint: 'Cài đặt dependencies pnpm và kiểm tra sức khỏe môi trường',
    script: 'scripts/setup-ecosystem.mjs',
  },
  {
    value: 'tunnel',
    label: '🚇 7. Cloudflare Tunnel & Git Relay',
    hint: 'Cầu nối proxy SSH & đẩy mã nguồn an toàn lên GitHub',
    script: 'scripts/tunnel-wizard.mjs',
  },
];

async function main() {
  const p = await getPrompts();

  if (!process.stdin.isTTY || !p) {
    printWizardBanner('Master Ecosystem Hub', 'Unified Monorepo Pipeline Orchestrator');
    console.log(`${pc.bold(pc.cyan('Danh sách các Wizard Pipelines có sẵn:'))}\n`);
    WIZARD_ACTIONS.forEach((a) => {
      console.log(`  • ${pc.bold(a.label.padEnd(26))}: ${a.hint}`);
      console.log(`    ${pc.dim(`$ node ${a.script}`)}`);
    });
    console.log(`\n${pc.yellow('Mẹo: Chạy `pnpm run setup` để cài đặt đầy đủ dependencies trước khi dùng TUI tương tác.')}\n`);
    process.exit(0);
  }

  console.clear();
  printWizardBanner('Master Ecosystem Hub', 'Unified Monorepo Pipeline Orchestrator');

  const action = await p.select({
    message: 'Bạn muốn thực hiện tác vụ nào trong Automa Ecosystem?',
    options: WIZARD_ACTIONS.map((a) => ({
      value: a.value,
      label: a.label,
      hint: a.hint,
    })),
  });

  if (p.isCancel(action)) {
    p.cancel('Tạm biệt!');
    process.exit(0);
  }

  const selectedAction = WIZARD_ACTIONS.find((a) => a.value === action);
  if (!selectedAction) process.exit(0);

  // Execute sub-wizard seamlessly inheriting terminal stdio
  console.log(`\n${pc.dim(`→ Chuyển tiếp tới: ${selectedAction.label}...`)}\n`);
  const res = await runProcess('node', [selectedAction.script], { cwd: rootDir, stdio: 'inherit' });
  process.exit(res.code);
}

main().catch((err) => {
  console.error('Lỗi master wizard:', err);
  process.exit(1);
});
