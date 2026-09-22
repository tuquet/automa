#!/usr/bin/env node

/**
 * Automa Ecosystem - Cloudflare SSH Tunnel & Git Relay Wizard
 * Manages local tunnel bridge (127.0.0.1:2222), auto-installs cloudflared via Scoop,
 * and coordinates secure Git Relay push to GitHub via VPS bare repo.
 */

import { execSync, spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import process from 'node:process';
import {
  automaDir,
  formatDuration,
  getPrompts,
  pc,
  printWizardBanner,
  rootDir,
  runProcess,
} from './lib/utils.mjs';

const TUNNEL_HOST = '127.0.0.1';
const TUNNEL_PORT = 2222;
const TUNNEL_HOSTNAME = 'cdn.flowup.io.vn';
const VPS_USER = 'root';
const VPS_REPO_PATH = '/var/repo/automa-ecosystem.git';
const PID_FILE = path.join(automaDir, 'cloudflared.pid');

/**
 * Validate branch argument against command injection and repository invariants
 */
export function validateBranch(branch) {
  if (!branch || typeof branch !== 'string') {
    throw new Error('Branch name is required.');
  }
  const clean = branch.trim();
  if (!/^[a-zA-Z0-9_\-\.\/]+$/.test(clean) || clean.startsWith('-')) {
    throw new Error(`Invalid branch name: "${clean}". Disallowed characters or flag prefix detected.`);
  }
  if (clean === 'main' || clean === 'origin/main' || clean.endsWith('/main')) {
    throw new Error('Pushing directly to branch "main" is strictly FORBIDDEN by repository policy (AGENTS.md).');
  }
  return clean;
}

/**
 * Check if a TCP port is currently listening
 */
export function isPortListening(port = TUNNEL_PORT, host = TUNNEL_HOST, timeoutMs = 500) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host, timeout: timeoutMs });
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      resolve(false);
    });
  });
}

/**
 * Wait for a port to enter the expected state
 */
async function waitForPort(port, expectedState = true, maxWaitMs = 5000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const isListening = await isPortListening(port);
    if (isListening === expectedState) return true;
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}

/**
 * Locate cloudflared executable on the system
 */
export function getCloudflaredPath() {
  const userProfile = process.env.USERPROFILE || '';
  const candidatePaths = [
    path.join(userProfile, 'scoop/apps/cloudflared/current/cloudflared.exe'),
    path.join(userProfile, 'scoop/shims/cloudflared.exe'),
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) return p;
  }

  try {
    const cmd = process.platform === 'win32' ? 'where cloudflared' : 'which cloudflared';
    const found = execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    if (found) return found.split('\n')[0].trim();
  } catch (_) {}

  return null;
}

/**
 * Install cloudflared via Scoop or provide guidance
 */
export async function setupCloudflared() {
  console.log(`\n${pc.bold(pc.cyan('⚙️  Cloudflare Tunnel (cloudflared) Setup'))}\n`);

  const existingPath = getCloudflaredPath();
  if (existingPath) {
    console.log(`  ${pc.green('✔')} cloudflared is already installed: ${pc.dim(existingPath)}`);
    return true;
  }

  console.log(`  ${pc.yellow('!')} cloudflared not found on system.`);
  console.log(`  ${pc.cyan('⏳')} Installing cloudflared via Scoop...\n`);

  try {
    execSync('scoop --version', { stdio: ['pipe', 'pipe', 'pipe'] });
  } catch (_) {
    console.log(`  ${pc.red('✖')} Scoop package manager is not installed.`);
    console.log(`  ${pc.yellow('👉')} Please install Scoop first: irm get.scoop.sh | iex`);
    return false;
  }

  const result = await runProcess('scoop', ['install', 'cloudflared'], { cwd: rootDir });
  if (result.success) {
    console.log(`\n  ${pc.green('✔')} cloudflared installed successfully via Scoop!`);
    return true;
  }

  console.log(`\n  ${pc.red('✖')} Failed to install cloudflared via Scoop.`);
  return false;
}

/**
 * Start the Cloudflare Tunnel bridge in the background
 */
export async function startTunnel(detached = true) {
  console.log(`\n${pc.bold(pc.cyan('🚇 Starting Cloudflare SSH Tunnel Bridge...'))}\n`);

  const alreadyActive = await isPortListening(TUNNEL_PORT);
  if (alreadyActive) {
    console.log(`  ${pc.green('✔')} Tunnel is already listening at ${TUNNEL_HOST}:${TUNNEL_PORT}\n`);
    return true;
  }

  let binPath = getCloudflaredPath();
  if (!binPath) {
    console.log(`  ${pc.yellow('!')} cloudflared not found. Running setup first...`);
    const installed = await setupCloudflared();
    if (!installed) return false;
    binPath = getCloudflaredPath() || 'cloudflared';
  }

  if (!fs.existsSync(automaDir)) {
    fs.mkdirSync(automaDir, { recursive: true });
  }

  console.log(`  ${pc.cyan('➜')} Target: ${pc.bold(TUNNEL_HOSTNAME)} -> ${TUNNEL_HOST}:${TUNNEL_PORT}`);

  if (detached) {
    const child = spawn(binPath, ['access', 'tcp', '--hostname', TUNNEL_HOSTNAME, '--url', `${TUNNEL_HOST}:${TUNNEL_PORT}`], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    });
    child.unref();
    if (child.pid) {
      fs.writeFileSync(PID_FILE, child.pid.toString(), 'utf-8');
    }

    const isReady = await waitForPort(TUNNEL_PORT, true, 8000);
    if (isReady) {
      console.log(`  ${pc.green('✔')} Tunnel bridge successfully started!`);
      console.log(`  ${pc.dim(`  Listening on ${TUNNEL_HOST}:${TUNNEL_PORT}`)}\n`);
      return true;
    }

    console.log(`  ${pc.red('✖')} Tunnel process started, but port ${TUNNEL_PORT} did not open in time.\n`);
    return false;
  }

  // Foreground mode
  return runProcess(binPath, ['access', 'tcp', '--hostname', TUNNEL_HOSTNAME, '--url', `${TUNNEL_HOST}:${TUNNEL_PORT}`]);
}

/**
 * Stop the Cloudflare Tunnel bridge
 */
export async function stopTunnel() {
  console.log(`\n${pc.bold(pc.cyan('🛑 Stopping Cloudflare SSH Tunnel Bridge...'))}\n`);

  const isListening = await isPortListening(TUNNEL_PORT);
  if (!isListening) {
    console.log(`  ${pc.yellow('ℹ')} Port ${TUNNEL_PORT} is not currently listening.\n`);
    return true;
  }

  if (fs.existsSync(PID_FILE)) {
    try {
      const pid = Number.parseInt(fs.readFileSync(PID_FILE, 'utf-8').trim(), 10);
      if (pid && !Number.isNaN(pid)) {
        process.kill(pid);
        fs.unlinkSync(PID_FILE);
      }
    } catch (_) {}
  }

  if (process.platform === 'win32') {
    try {
      execSync('taskkill /F /IM cloudflared.exe', { stdio: ['pipe', 'pipe', 'pipe'] });
    } catch (_) {}
  }

  const stopped = await waitForPort(TUNNEL_PORT, false, 3000);
  if (stopped) {
    console.log(`  ${pc.green('✔')} Tunnel bridge stopped and port ${TUNNEL_PORT} released.\n`);
    return true;
  }

  console.log(`  ${pc.yellow('!')} Tunnel process signaled to close.\n`);
  return true;
}

/**
 * Comprehensive 4-Tier Tunnel & Relay Healthcheck
 */
export async function runDoctor() {
  console.log(`\n${pc.bold(pc.cyan('🩺 Running Cloudflare Tunnel & Git Relay Doctor...'))}\n`);

  // Tier 1: cloudflared binary
  const binPath = getCloudflaredPath();
  const t1Pass = !!binPath;
  console.log(`  ${t1Pass ? pc.green('✔') : pc.red('✖')} [1/4] Cloudflared CLI: ${t1Pass ? pc.green('Installed') : pc.red('Not Found')} ${pc.dim(binPath || '(run setup)')}`);

  // Tier 2: Port 2222 listening
  const t2Pass = await isPortListening(TUNNEL_PORT);
  console.log(`  ${t2Pass ? pc.green('✔') : pc.yellow('!')} [2/4] Tunnel Port ${TUNNEL_PORT}: ${t2Pass ? pc.green('Active (Listening)') : pc.yellow('Inactive (Not Listening)')}`);

  // Tier 3: VPS SSH auth
  let t3Pass = false;
  if (t2Pass) {
    try {
      const out = execSync(`ssh -o BatchMode=yes -o StrictHostKeyChecking=accept-new -p ${TUNNEL_PORT} ${VPS_USER}@${TUNNEL_HOST} "echo SSH_OK"`, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      t3Pass = out.includes('SSH_OK');
    } catch (_) {}
  }
  console.log(`  ${t3Pass ? pc.green('✔') : pc.red('✖')} [3/4] VPS SSH Authentication: ${t3Pass ? pc.green('Authenticated (root)') : pc.red('Failed / Offline')}`);

  // Tier 4: VPS GitHub Relay & Bare Repo
  let t4Pass = false;
  if (t3Pass) {
    try {
      const out = execSync(`ssh -o BatchMode=yes -p ${TUNNEL_PORT} ${VPS_USER}@${TUNNEL_HOST} "git ls-remote git@github.com:tuquet/automa-ecosystem.git refs/heads/dev"`, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      t4Pass = out.includes('refs/heads/dev');
    } catch (_) {}
  }
  console.log(`  ${t4Pass ? pc.green('✔') : pc.red('✖')} [4/4] VPS GitHub Push Access: ${t4Pass ? pc.green('Verified (Deploy Key Ready)') : pc.red('Failed')}\n`);

  // Git Remote check
  try {
    const remotes = execSync('git remote -v', { cwd: rootDir, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    const hasRelay = remotes.includes('relay');
    console.log(`  ${hasRelay ? pc.green('✔') : pc.yellow('!')} Local Git Remote 'relay': ${hasRelay ? pc.green('Configured') : pc.yellow('Missing (will auto-add)')}\n`);
  } catch (_) {}

  return t1Pass && t2Pass && t3Pass && t4Pass;
}

/**
 * 1-Click Push via Relay (Self-healing: auto-starts tunnel if needed)
 */
export async function pushRelay(rawBranch = 'dev') {
  let branch;
  try {
    branch = validateBranch(rawBranch);
  } catch (err) {
    console.error(`\n  ${pc.red('✖')} ${err.message}\n`);
    return false;
  }

  console.log(`\n${pc.bold(pc.cyan(`🚀 Git Relay Push -> GitHub (${branch})...`))}\n`);

  // 1. Ensure cloudflared is ready
  let bin = getCloudflaredPath();
  if (!bin) {
    console.log(`  ${pc.yellow('➜')} cloudflared missing. Auto-running setup...`);
    const installed = await setupCloudflared();
    if (!installed) return false;
  }

  // 2. Ensure tunnel is active
  const isListening = await isPortListening(TUNNEL_PORT);
  if (!isListening) {
    console.log(`  ${pc.yellow('➜')} Tunnel on port ${TUNNEL_PORT} is inactive. Auto-starting...`);
    const started = await startTunnel(true);
    if (!started) {
      console.log(`  ${pc.red('✖')} Cannot establish tunnel bridge. Aborting push.`);
      return false;
    }
  }

  // 3. Ensure remote 'relay' is configured
  try {
    const remotes = execSync('git remote', { cwd: rootDir, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] });
    if (!remotes.split('\n').map((r) => r.trim()).includes('relay')) {
      const relayUrl = `ssh://${VPS_USER}@${TUNNEL_HOST}:${TUNNEL_PORT}${VPS_REPO_PATH}`;
      console.log(`  ${pc.cyan('➜')} Adding missing git remote 'relay' (${relayUrl})...`);
      execSync(`git remote add relay ${relayUrl}`, { cwd: rootDir });
    }
  } catch (err) {
    console.log(`  ${pc.red('✖')} Failed to configure git remote 'relay': ${err.message}`);
    return false;
  }


  // 5. Execute git push relay <branch>
  console.log(`\n  ${pc.bold(pc.cyan(`➜ Executing: git push relay ${branch}`))}\n`);
  const pushResult = await runProcess('git', ['push', 'relay', branch], { cwd: rootDir });

  if (pushResult.success) {
    console.log(`\n  ${pc.green('✔')} Successfully pushed to GitHub via Relay! (${pushResult.duration})`);

    // Update local tracking ref so git status reflects clean state safely
    try {
      const headSha = execSync('git rev-parse HEAD', { cwd: rootDir, encoding: 'utf-8' }).trim();
      spawnSync('git', ['update-ref', `refs/remotes/origin/${branch}`, headSha], { cwd: rootDir });
    } catch (_) {}

    return true;
  }

  console.log(`\n  ${pc.red('✖')} Git Relay push failed. Check terminal logs above.`);
  return false;
}

/**
 * Interactive Clack Prompts TUI Menu
 */
async function runInteractiveMenu() {
  const prompts = await getPrompts();
  if (!prompts) {
    await runDoctor();
    return;
  }

  printWizardBanner('Cloudflare SSH Tunnel & Git Relay', 'Secure Proxy & Relay Operations for Automa Ecosystem');

  const action = await prompts.select({
    message: 'Chọn hành động với Cloudflare Tunnel / Git Relay:',
    options: [
      { value: 'push', label: '🚀 1-Click Push via Relay', hint: 'Tự động mở tunnel và đẩy code lên GitHub' },
      { value: 'start', label: '🚇 Start Tunnel Bridge', hint: 'Khởi chạy cloudflared access tcp lắng nghe tại 127.0.0.1:2222' },
      { value: 'stop', label: '🛑 Stop Tunnel Bridge', hint: 'Dừng tiến trình và giải phóng cổng 2222' },
      { value: 'status', label: '🩺 Doctor & Healthcheck', hint: 'Kiểm tra 4 tầng: Binary, Cổng 2222, SSH VPS, Quyền GitHub' },
      { value: 'setup', label: '⚙️  Setup Cloudflared', hint: 'Cài đặt cloudflared qua Scoop nếu máy chưa có' },
    ],
  });

  if (prompts.isCancel(action)) {
    prompts.cancel('Hủy thao tác.');
    return;
  }

  switch (action) {
    case 'push':
      await pushRelay('dev');
      break;
    case 'start':
      await startTunnel(true);
      break;
    case 'stop':
      await stopTunnel();
      break;
    case 'status':
      await runDoctor();
      break;
    case 'setup':
      await setupCloudflared();
      break;
  }
}

// CLI Argument Routing
const args = process.argv.slice(2);
const command = args[0]?.toLowerCase();

if (command === 'start' || command === '--start') {
  await startTunnel(true);
} else if (command === 'stop' || command === '--stop') {
  await stopTunnel();
} else if (command === 'status' || command === 'doctor' || command === '--status') {
  await runDoctor();
} else if (command === 'setup' || command === '--setup') {
  await setupCloudflared();
} else if (command === 'push' || command === '--push') {
  const branch = args[1] || 'dev';
  await pushRelay(branch);
} else {
  await runInteractiveMenu();
}
