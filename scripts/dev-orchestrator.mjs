#!/usr/bin/env node

/**
 * Automa Ecosystem Unified Interactive Dev Orchestrator
 * Interactive Checklist TUI (@clack/prompts), Selection Persistence & Multi-Process Manager.
 */

import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import * as p from '@clack/prompts';
import pc from 'picocolors';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const automaDir = path.join(rootDir, '.automa');
const stateFile = path.join(automaDir, '.dev-selection.json');
const logsDir = path.join(automaDir, 'logs');
const allLogFile = path.join(logsDir, 'dev-all.log');
const errorLogFile = path.join(logsDir, 'dev-errors.log');

// --- Logging & File Tracking System ---
const ANSI_REGEX = /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
function stripAnsi(str) {
  return typeof str === 'string' ? str.replace(ANSI_REGEX, '') : String(str);
}

function ensureLogsDir() {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
}

function checkRotateLog(filePath, maxSize = 5 * 1024 * 1024) {
  try {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      if (stats.size > maxSize) {
        const backupPath = `${filePath}.old`;
        if (fs.existsSync(backupPath)) fs.unlinkSync(backupPath);
        fs.renameSync(filePath, backupPath);
      }
    }
  } catch (_) {}
}

const NOISE_PATTERNS = [
  /\[webpack\.Progress\]/,
  /^\$\s+/,
  /^\s*(Compiling|Checking|Finished|Running|Downloading|Downloaded|Updating|Locking)\b/,
  /^\s*(VITE v|ready in \d+|➜\s+Local:|➜\s+Network:|➜\s+press h)\b/,
];

const ERROR_PATTERNS = [
  /\bERROR(\s+in\b|:|\b)/i,
  /\berror\[E\d+\]:/i,
  /\berror:/i,
  /\b(SyntaxError|TypeError|ReferenceError|RangeError|URIError|EvalError|HookWebpackError|AggregateError)\b/,
  /\b(Module\s+build\s+failed|Module\s+not\s+found|Failed\s+to\s+compile|Compilation\s+failed)\b/i,
  /\b(UnhandledPromiseRejection|uncaughtException)\b/,
  /\b(panic|fatal|exception|ERR_[A-Z0-9_]+|Cannot\s+find\s+module)\b/i,
  /\bTS\d{4}:/,
];

const WARN_PATTERNS = [
  /\bWARNING(\s+in\b|:|\b)/i,
  /\b(warn:|warning:)\b/i,
  /\[@vue\/compiler-sfc\]/,
  /\[vite\]\s+warning/i,
  /\b(deprecated|deprecation)\b/i,
];

function isBenignNoise(line) {
  return NOISE_PATTERNS.some((pattern) => pattern.test(line));
}

function classifyLogLevel(cleanLine, isStderr = false) {
  if (isBenignNoise(cleanLine)) {
    return 'INFO';
  }

  for (const pattern of ERROR_PATTERNS) {
    if (pattern.test(cleanLine)) {
      return 'ERROR';
    }
  }

  for (const pattern of WARN_PATTERNS) {
    if (pattern.test(cleanLine)) {
      return 'WARN';
    }
  }

  return isStderr ? 'WARN' : 'INFO';
}

function appendLog(taskName, level, rawLine) {
  const clean = stripAnsi(rawLine).trim();
  if (!clean) return;

  ensureLogsDir();
  checkRotateLog(allLogFile);
  checkRotateLog(errorLogFile);

  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${taskName}] [${level}] ${clean}\n`;

  try {
    fs.appendFileSync(allLogFile, logEntry, 'utf8');

    // Catch all Problems (Errors and Warnings) in dev-errors.log while filtering out noisy progress bars
    const isProblem = (level === 'ERROR' || level === 'WARN') && !isBenignNoise(clean);

    if (isProblem) {
      fs.appendFileSync(errorLogFile, logEntry, 'utf8');
    }
  } catch (_) {}
}

function initLogSession(tasks) {
  ensureLogsDir();

  // Backup previous session logs to .prev
  try {
    if (fs.existsSync(allLogFile)) {
      fs.copyFileSync(allLogFile, `${allLogFile}.prev`);
    }
    if (fs.existsSync(errorLogFile)) {
      fs.copyFileSync(errorLogFile, `${errorLogFile}.prev`);
    }
  } catch (_) {}

  // Rewrite fresh for the new dev session
  const header = `======================================================\n🚀 Dev Session Started: ${new Date().toISOString()}\nActive Services: ${tasks.map((t) => t.name).join(', ')}\n======================================================\n`;
  try {
    fs.writeFileSync(allLogFile, header, 'utf8');
    fs.writeFileSync(errorLogFile, '', 'utf8'); // Start completely clean
  } catch (_) {}
}

// --- Task Definitions ---
const TASKS = [
  {
    id: 'core',
    name: 'CORE',
    label: '🦀 Automa Core',
    hint: 'Rust Daemon Engine & REST API (port :8765)',
    color: pc.cyan,
    cmd: process.platform === 'win32' ? 'cargo.exe' : 'cargo',
    args: ['watch', '-x', 'run'],
    cwd: path.join(rootDir, 'automa-core'),
    description: 'Rust Daemon on port 8765',
    url: 'http://127.0.0.1:8765/swagger-ui',
  },
  {
    id: 'vsce',
    name: 'VSCE',
    label: '🧩 Automa VSCE',
    hint: 'VS Code Extension TS compiler + Webview Watcher',
    color: pc.green,
    cmd: process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
    args: ['-F', 'vscode-automa', 'run', 'watch'],
    cwd: rootDir,
    description: 'VS Code Extension TS & Webview Watcher',
  },
  {
    id: 'studio',
    name: 'STUDIO',
    label: '🎨 Automa Studio',
    hint: 'Vue Flow Standalone Canvas Editor (port :5173)',
    color: pc.magenta,
    cmd: process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
    args: ['-F', 'automa', 'run', 'dev:studio'],
    cwd: rootDir,
    description: 'Automa Studio Standalone Canvas',
    url: 'http://localhost:5173',
  },
  {
    id: 'desk',
    name: 'DESK',
    label: '🖥️  Automa Desk',
    hint: 'Tauri v2 + Vue 3.5 Desktop Application (port :1420)',
    color: pc.blue,
    cmd: process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
    args: ['-F', '@automa/desk', 'run', 'dev'],
    cwd: rootDir,
    description: 'Automa Desk Tauri v2 Companion App',
    url: 'http://localhost:1420',
  },
  {
    id: 'runner',
    name: 'RUNNER',
    label: '⚡ Automa Runner',
    hint: 'Headless CLI Runner build watcher',
    color: pc.yellow,
    cmd: process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
    args: ['-F', 'automa', 'run', 'dev:runner'],
    cwd: rootDir,
    description: 'Automa CLI Runner Watcher',
  },
  {
    id: 'docs',
    name: 'DOCS',
    label: '📖 Scalar API Docs',
    hint: 'Live Interactive API Reference (port :8767)',
    color: pc.magenta,
    cmd: 'node',
    args: ['scripts/serve-docs.mjs'],
    cwd: rootDir,
    description: 'Scalar OpenAPI Live Documentation Server',
    url: 'http://127.0.0.1:8767',
  },
];

// --- State Persistence ---
function loadSavedSelection() {
  try {
    if (fs.existsSync(stateFile)) {
      const data = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
      if (Array.isArray(data.selected) && data.selected.length > 0) {
        return data.selected.filter((id) => TASKS.some((t) => t.id === id));
      }
    }
  } catch (_) {
    // Ignore corrupt state
  }
  return ['core', 'vsce']; // Default fallback
}

function saveSelection(selectedIds) {
  try {
    if (!fs.existsSync(automaDir)) {
      fs.mkdirSync(automaDir, { recursive: true });
    }
    fs.writeFileSync(stateFile, JSON.stringify({ selected: selectedIds, updatedAt: new Date().toISOString() }, null, 2));
  } catch (_) {
    // Ignore write failure
  }
}

// --- CLI Flag Resolution ---
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const isAll = args.includes('--all');
const isLast = args.includes('--last');
const isCore = args.includes('--core');
const isDesk = args.includes('--desk');
const isVsce = args.includes('--vsce');
const isStudio = args.includes('--studio');
const isRunner = args.includes('--runner');

async function resolveSelectedTasks() {
  // Direct CLI Flags bypass interactive prompt
  if (isAll) return TASKS.map((t) => t.id);
  if (isLast) return loadSavedSelection();
  if (isCore) return ['core'];
  if (isDesk) return ['core', 'desk'];
  if (isVsce) return ['core', 'vsce'];
  if (isStudio) return ['core', 'studio'];
  if (isRunner) return ['core', 'runner'];

  // If non-interactive environment (CI, pipe), use last saved or default
  if (!process.stdin.isTTY) {
    return loadSavedSelection();
  }

  // Interactive Checklist TUI using @clack/prompts
  console.clear();
  p.intro(pc.bold(pc.cyan('🚀 AUTOMA ECOSYSTEM DEV ORCHESTRATOR')));

  const previousSelection = loadSavedSelection();

  const selected = await p.multiselect({
    message: 'Chọn các dịch vụ bạn muốn khởi chạy đồng thời:',
    options: TASKS.map((t) => ({
      value: t.id,
      label: `${t.label} ${pc.dim(`— ${t.hint}`)}`,
      hint: previousSelection.includes(t.id) ? pc.green('★ Lần trước') : undefined,
    })),
    initialValues: previousSelection,
    required: true,
  });

  if (p.isCancel(selected)) {
    p.cancel('Đã hủy khởi chạy.');
    process.exit(0);
  }

  saveSelection(selected);
  return selected;
}

// --- Execution & Process Management ---
let childProcesses = [];
let activeTasks = [];
let isShuttingDown = false;

function openBrowser(url) {
  if (!url) return;
  const startCmd = process.platform === 'win32' ? 'start' : process.platform === 'darwin' ? 'open' : 'xdg-open';
  spawn(startCmd, [url], { shell: true, stdio: 'ignore' });
}

function pipeOutput(proc, name, color) {
  const prefix = `${color(`[${name}]`)} `;

  const processChunk = (chunk, isStderr = false) => {
    const rawLines = chunk.toString().split('\n');
    const filteredLines = rawLines.filter((line, idx, arr) => idx < arr.length - 1 || line.trim().length > 0);

    filteredLines.forEach((line) => {
      const clean = stripAnsi(line).trim();
      const level = classifyLogLevel(clean, isStderr);
      appendLog(name, level, line);
    });

    return filteredLines.map((line) => `${prefix}${line}`).join('\n');
  };

  proc.stdout?.on('data', (data) => {
    const formatted = processChunk(data, false);
    if (formatted) console.log(formatted);
  });

  proc.stderr?.on('data', (data) => {
    const formatted = processChunk(data, true);
    if (formatted) console.error(formatted);
  });
}

function killProcess(proc) {
  try {
    if (proc && !proc.killed) {
      if (process.platform === 'win32' && proc.pid) {
        spawn('taskkill', ['/pid', String(proc.pid), '/f', '/t'], { stdio: 'ignore' });
      } else {
        proc.kill('SIGTERM');
      }
    }
  } catch (_) {
    // Ignored
  }
}

function startTasks(taskList) {
  childProcesses = [];
  taskList.forEach((task) => {
    console.log(`${task.color(`[${task.name}]`)} Khởi chạy: ${task.description}...`);
    appendLog(task.name, 'INFO', `Khởi chạy tiến trình: ${task.cmd} ${task.args.join(' ')}`);

    const proc = spawn(task.cmd, task.args, {
      cwd: task.cwd,
      shell: true,
      stdio: ['inherit', 'pipe', 'pipe'],
      env: { ...process.env, FORCE_COLOR: '1' },
    });

    pipeOutput(proc, task.name, task.color);

    proc.on('close', (code) => {
      if (!isShuttingDown) {
        const msg = `Tiến trình dừng với mã ${code}.`;
        console.log(`${task.color(`[${task.name}]`)} ${msg}`);
        appendLog(task.name, code === 0 ? 'INFO' : 'ERROR', msg);
      }
    });

    proc.on('error', (err) => {
      const msg = `Lỗi tiến trình: ${err.message}`;
      console.error(`${pc.red(`[${task.name}] ${msg}`)}`);
      appendLog(task.name, 'ERROR', msg);
    });

    childProcesses.push({ task, proc });
  });
}

function restartAll() {
  console.log(`\n${pc.yellow('🔄 Đang khởi động lại tất cả các tiến trình...')}\n`);
  appendLog('SYSTEM', 'INFO', 'Người dùng yêu cầu khởi động lại tất cả các tiến trình.');
  childProcesses.forEach(({ proc }) => killProcess(proc));
  setTimeout(() => {
    startTasks(activeTasks);
  }, 1000);
}

function cleanup() {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\n${pc.yellow('🛑 Đang dọn dẹp và dừng tất cả tiến trình con...')}`);
  appendLog('SYSTEM', 'INFO', 'Đang dừng phiên làm việc Dev Orchestrator.');
  childProcesses.forEach(({ proc }) => killProcess(proc));
  setTimeout(() => {
    process.exit(0);
  }, 600);
}

function showRecentErrors() {
  try {
    if (fs.existsSync(errorLogFile)) {
      const content = fs.readFileSync(errorLogFile, 'utf8');
      const lines = content.split('\n').filter(Boolean).slice(-15);
      console.log(`\n${pc.bold(pc.red('🚨 15 Lỗi & Cảnh báo gần nhất:'))}`);
      if (lines.length === 0) {
        console.log(pc.green('  (Chưa có lỗi nào được ghi nhận)'));
      } else {
        lines.forEach((l) => console.log(`  ${pc.dim(l)}`));
      }
      console.log(`\n${pc.dim(`Xem toàn bộ tại: ${errorLogFile}\n`)}`);
    } else {
      console.log(pc.green('\n✔ Chưa có file log lỗi (Tất cả dịch vụ đều ổn định)'));
    }
  } catch (err) {
    console.error(pc.red(`Không thể đọc file lỗi: ${err.message}`));
  }
}

function showLogPaths() {
  console.log(`\n${pc.bold(pc.cyan('📂 Thư mục & File Log Dev Tracking:'))}`);
  console.log(`  • Toàn bộ Log  : ${pc.bold(allLogFile)}`);
  console.log(`  • Log Lỗi/Warn : ${pc.bold(errorLogFile)}\n`);
}

function showHotkeysBar() {
  const hotkeys = [
    `${pc.bold('r')} Restart`,
    `${pc.bold('c')} Clear`,
    `${pc.bold('e')} Lỗi gần nhất`,
    `${pc.bold('l')} File logs`,
    `${pc.bold('o')} Mở browser`,
    `${pc.bold('q')} Thoát`,
  ];
  console.log(`\n${pc.dim('────────────────────────────────────────────────────────────────────────────')}`);
  console.log(`  ${pc.cyan('Hotkeys:')} ${hotkeys.join(pc.dim('  │  '))}`);
  console.log(`${pc.dim('────────────────────────────────────────────────────────────────────────────')}\n`);
}

function setupHotkeys() {
  if (process.stdin.isTTY) {
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }

    process.stdin.on('keypress', (str, key) => {
      if (key.ctrl && key.name === 'c') {
        cleanup();
        return;
      }
      if (key.name === 'q') {
        cleanup();
        return;
      }
      if (key.name === 'r') {
        restartAll();
        return;
      }
      if (key.name === 'c') {
        console.clear();
        showHotkeysBar();
        return;
      }
      if (key.name === 'e') {
        showRecentErrors();
        return;
      }
      if (key.name === 'l') {
        showLogPaths();
        return;
      }
      if (key.name === 'o') {
        console.log(`\n${pc.cyan('🌐 Đang mở các dashboard trên trình duyệt...')}${pc.reset('')}`);
        activeTasks.forEach((t) => {
          if (t.url) {
            console.log(`  → ${t.label}: ${t.url}`);
            openBrowser(t.url);
          }
        });
      }
    });
  }
}

// --- Main Bootstrap ---
async function main() {
  const selectedIds = await resolveSelectedTasks();
  activeTasks = TASKS.filter((t) => selectedIds.includes(t.id));

  if (activeTasks.length === 0) {
    console.log(`${pc.yellow('Không có task nào được chọn. Đang thoát.')}`);
    process.exit(0);
  }

  if (isDryRun) {
    console.log(`\n${pc.green(`✔ [DRY RUN] Đã xác thực thành công ${activeTasks.length} task:`)}`);
    activeTasks.forEach((t) => {
      console.log(`  ${t.color(`[${t.name}]`)} ${t.label} → ${pc.dim(`${t.cmd} ${t.args.join(' ')}`)}`);
    });
    console.log(`\n${pc.dim(`Logs target: ${logsDir}`)}`);
    process.exit(0);
  }

  initLogSession(activeTasks);
  p.outro(pc.green(`Khởi chạy ${activeTasks.length} dịch vụ: ${activeTasks.map((t) => t.name).join(', ')}`));
  showHotkeysBar();

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('exit', cleanup);

  setupHotkeys();
  startTasks(activeTasks);
}

main().catch((err) => {
  console.error(`${pc.red}Lỗi khởi chạy Dev Orchestrator:${pc.reset('')}`, err);
  process.exit(1);
});

