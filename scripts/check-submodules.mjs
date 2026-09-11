#!/usr/bin/env node

/**
 * Automa Submodule Pointer Drift Checker
 * Detects when submodules have new commits that haven't been staged/updated in root git index.
 * Supports auto-sync with `node scripts/check-submodules.mjs --sync`
 * Supports machine output with `node scripts/check-submodules.mjs --json`
 */

import { execSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { pc, rootDir } from './lib/utils.mjs';

const isSyncMode = process.argv.includes('--sync');
const isStrictMode = process.argv.includes('--strict');
const isJsonMode = process.argv.includes('--json');

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
  const submodules = getSubmodules();
  const results = [];
  const drifts = [];

  for (const sub of submodules) {
    const subHead = getSubmoduleHead(sub);
    const rootCommit = getRootSubmoduleCommit(sub);

    if (!subHead) {
      results.push({ sub, status: 'uninitialized', subHead: null, rootCommit });
      continue;
    }

    if (rootCommit && subHead !== rootCommit) {
      drifts.push({ sub, subHead, rootCommit });
      results.push({ sub, status: 'drift', subHead, rootCommit });
    } else {
      results.push({ sub, status: 'synced', subHead, rootCommit });
    }
  }

  if (isJsonMode) {
    console.log(JSON.stringify({ submodules: results, driftCount: drifts.length }, null, 2));
    if (isStrictMode && drifts.length > 0) process.exit(1);
    return;
  }

  console.log(`${pc.bold(pc.cyan('===================================================='))}`);
  console.log(`${pc.bold('🔍 Automa Submodule Pointer Drift Checker')}`);
  console.log(`${pc.bold(pc.cyan('===================================================='))}\n`);

  for (const item of results) {
    if (item.status === 'uninitialized') {
      console.log(`  ${pc.yellow('⚠️')}  ${item.sub}: Directory or git submodule not initialized.`);
    } else if (item.status === 'drift') {
      console.log(`  ${pc.red('❌')} ${pc.bold(item.sub)} is ${pc.red('OUT OF SYNC')}:`);
      console.log(`     Root Pointer:     ${pc.dim(item.rootCommit?.slice(0, 8))}`);
      console.log(`     Submodule HEAD:   ${pc.yellow(item.subHead?.slice(0, 8))}`);
    } else {
      console.log(`  ${pc.green('✔')}  ${item.sub} is in sync (${pc.dim(item.subHead?.slice(0, 8))})`);
    }
  }

  console.log('\n');

  if (drifts.length > 0) {
    if (isSyncMode) {
      console.log(`${pc.yellow('🔄 Auto-syncing drifted submodule pointers to root git staging...')}`);
      for (const { sub } of drifts) {
        execSync(`git add ${sub}`, { cwd: rootDir });
        console.log(`  ${pc.green('✔')} Staged ${sub} pointer in root git index.`);
      }
      console.log(`\n${pc.bold(pc.green('Done! Run \'git commit -m "chore(submodules): update submodules pointers"\' to commit at root.'))}\n`);
    } else {
      console.log(`${pc.bold(pc.yellow(`Notice: ${drifts.length} submodule(s) have new commits not yet recorded in root repo.`))}`);
      console.log(`${pc.dim('Run \'pnpm run sync:submodules\' to automatically stage the updated pointers.')}\n`);
      if (isStrictMode) {
        process.exit(1);
      }
    }
  } else {
    console.log(`${pc.green('✔ All submodule pointers are 100% in sync with root repository.')}\n`);
  }
}

checkAll();
