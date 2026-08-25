#!/usr/bin/env node

/**
 * Automa Submodule Pointer Drift Checker
 * Detects when submodules have new commits that haven't been staged/updated in root git index.
 * Supports auto-sync with `node scripts/check-submodules.mjs --sync`
 */

import { execSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

const isSyncMode = process.argv.includes('--sync');
const isStrictMode = process.argv.includes('--strict');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function getSubmodules() {
  try {
    const raw = execSync('git config --file .gitmodules --get-regexp path', {
      cwd: rootDir,
      encoding: 'utf-8',
    });
    return raw
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => line.split(' ')[1].trim());
  } catch (_) {
    return ['automa-core', 'automa-webe', 'automa-vsce', 'automa-desk', 'automa-vault'];
  }
}

function getSubmoduleHead(submodulePath) {
  try {
    return execSync('git rev-parse HEAD', {
      cwd: path.join(rootDir, submodulePath),
      encoding: 'utf-8',
    }).trim();
  } catch (_) {
    return null;
  }
}

function getRootSubmoduleCommit(submodulePath) {
  try {
    const raw = execSync(`git ls-tree HEAD ${submodulePath}`, {
      cwd: rootDir,
      encoding: 'utf-8',
    }).trim();
    if (!raw) return null;
    const parts = raw.split(/\s+/);
    return parts[2] || null;
  } catch (_) {
    return null;
  }
}

function checkAll() {
  console.log(`${colors.bright}${colors.cyan}====================================================${colors.reset}`);
  console.log(`${colors.bright}🔍 Automa Submodule Pointer Drift Checker${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}====================================================${colors.reset}\n`);

  const submodules = getSubmodules();
  const drifts = [];

  for (const sub of submodules) {
    const subHead = getSubmoduleHead(sub);
    const rootCommit = getRootSubmoduleCommit(sub);

    if (!subHead) {
      console.log(`  ${colors.yellow}⚠️  ${sub}: Directory or git submodule not initialized.${colors.reset}`);
      continue;
    }

    if (rootCommit && subHead !== rootCommit) {
      drifts.push({ sub, subHead, rootCommit });
      console.log(`  ${colors.red}❌ ${sub}${colors.reset} is OUT OF SYNC:`);
      console.log(`     Root Pointer:     ${colors.gray}${rootCommit.slice(0, 8)}${colors.reset}`);
      console.log(`     Submodule HEAD:   ${colors.yellow}${subHead.slice(0, 8)}${colors.reset}`);
    } else {
      console.log(`  ${colors.green}✔  ${sub}${colors.reset} is in sync (${colors.gray}${subHead.slice(0, 8)}${colors.reset})`);
    }
  }

  console.log('\n');

  if (drifts.length > 0) {
    if (isSyncMode) {
      console.log(`${colors.yellow}🔄 Auto-syncing drifted submodule pointers to root git staging...${colors.reset}`);
      for (const { sub } of drifts) {
        execSync(`git add ${sub}`, { cwd: rootDir });
        console.log(`  ${colors.green}✔ Staged ${sub} pointer in root git index.${colors.reset}`);
      }
      console.log(`\n${colors.bright}${colors.green}Done! Run 'git commit -m "chore(submodules): update submodules pointers"' to commit at root.${colors.reset}\n`);
    } else {
      console.log(`${colors.bright}${colors.yellow}Notice: ${drifts.length} submodule(s) have new commits not yet recorded in root repo.${colors.reset}`);
      console.log(`${colors.gray}Run 'pnpm run sync:submodules' to automatically stage the updated pointers.${colors.reset}\n`);
      if (isStrictMode) {
        process.exit(1);
      }
    }
  } else {
    console.log(`${colors.green}✔ All submodule pointers are 100% in sync with root repository.${colors.reset}\n`);
  }
}

checkAll();
