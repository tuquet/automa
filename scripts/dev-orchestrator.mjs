#!/usr/bin/env node

/**
 * Automa Ecosystem Unified Interactive Dev Orchestrator
 * Interactive Checklist TUI (@clack/prompts), Selection Persistence & Multi-Process Manager.
 */

import { spawn } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import * as p from '@clack/prompts';
import * as Sentry from '@sentry/node';
import pc from 'picocolors';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const automaDir = path.join(rootDir, '.automa');
const stateFile = path.join(automaDir, '.dev-selection.json');
const logsDir = path.join(automaDir, 'logs');
const allLogFile = path.join(logsDir, 'dev-all.log');
const errorLogFile = path.join(logsDir, 'dev-errors.log');

// --- Sentry Dev Diagnostics Initialization ---
const SENTRY_DSN = process.env.SENTRY_DSN || '';
Sentry.init({
  dsn: SENTRY_DSN || undefined,
  environment: process.env.NODE_ENV || 'development',
  release: 'automa-ecosystem@dev',
  tracesSampleRate: 1.0,
});

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

function getLocalTimestamp(date = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const padMs = (n) => String(n).padStart(3, '0');

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  const ms = padMs(date.getMilliseconds());

  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absOffsetHours = pad(Math.floor(Math.abs(offsetMinutes) / 60));
  const absOffsetMinutes = pad(Math.abs(offsetMinutes) % 60);

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${ms}${sign}${absOffsetHours}:${absOffsetMinutes}`;
}

const MAX_BREADCRUMBS = 8;
const serviceBreadcrumbs = new Map();

function addBreadcrumb(taskName, level, message) {
  if (!serviceBreadcrumbs.has(taskName)) {
    serviceBreadcrumbs.set(taskName, []);
  }
  const list = serviceBreadcrumbs.get(taskName);
  list.push({
    time: getLocalTimestamp(),
    level,
    message,
  });
  if (list.length > MAX_BREADCRUMBS) {
    list.shift();
  }

  Sentry.addBreadcrumb({
    category: taskName,
    message,
    level: level.toLowerCase() === 'error' ? 'error' : level.toLowerCase() === 'warn' ? 'warning' : 'info',
    timestamp: Date.now() / 1000,
  });
}

function captureSentryDiagnostic(taskName, level, rawMessage) {
  const clean = stripAnsi(rawMessage).trim();
  if (!clean || isBenignNoise(clean)) return;

  const eventId = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  const timestamp = getLocalTimestamp();
  const breadcrumbs = serviceBreadcrumbs.get(taskName) || [];

  // Categorize error for dev readability
  let category = 'Runtime Exception';
  if (/panic/i.test(clean)) category = 'Rust Panic';
  else if (/TypeError|ReferenceError|SyntaxError/i.test(clean)) category = 'JavaScript Exception';
  else if (/EADDRINUSE|address already in use/i.test(clean)) category = 'Port Collision (:8765/:1420/:5173)';
  else if (/Module not found|Cannot find module/i.test(clean)) category = 'Module Resolution';
  else if (/TS\d{4}|typecheck/i.test(clean)) category = 'TypeScript Compiler Diagnostic';
  else if (/build failed|compilation failed/i.test(clean)) category = 'Build / Compiler Failure';
  else if (level === 'WARN') category = 'Compiler / Deprecation Warning';

  // Send to Sentry (if DSN provided)
  Sentry.withScope((scope) => {
    scope.setTag('service', taskName);
    scope.setTag('category', category);
    scope.setExtra('recent_breadcrumbs', breadcrumbs);
    if (level === 'ERROR') {
      Sentry.captureMessage(`[${taskName}] ${clean}`, 'error');
    } else {
      Sentry.captureMessage(`[${taskName}] ${clean}`, 'warning');
    }
  });

  // Human-friendly structured Sentry Event Card for dev-errors.log
  const breadcrumbLines = breadcrumbs.length > 0
    ? breadcrumbs.map((b, idx) => `   ${idx + 1}. [${b.time.split('T')[1] || b.time}] [${b.level}] ${b.message}`).join('\n')
    : '   (No previous breadcrumbs)';

  const icon = level === 'ERROR' ? '🚨' : '⚠️';
  const card = [
    '┌────────────────────────────────────────────────────────────────────────────────────────',
    `│ ${icon} SENTRY DIAGNOSTIC [${level}] [ID: ${eventId}] ${timestamp}`,
    `│ 🏷️  Service  : ${taskName}`,
    `│ ⚡ Category : ${category}`,
    `│ 💬 Message  : ${clean}`,
    '├────────────────────────────────────────────────────────────────────────────────────────',
    '│ 📜 Preceding Breadcrumbs (Context):',
    breadcrumbLines,
    '└────────────────────────────────────────────────────────────────────────────────────────\n',
  ].join('\n');

  try {
    ensureLogsDir();
    checkRotateLog(errorLogFile);
    fs.appendFileSync(errorLogFile, card, 'utf8');
  } catch (_) {}
}

function appendLog(taskName, level, rawLine) {
  const clean = stripAnsi(rawLine).trim();
  if (!clean) return;

  ensureLogsDir();
  checkRotateLog(allLogFile);

  const timestamp = getLocalTimestamp();
  const logEntry = `[${timestamp}] [${taskName}] [${level}] ${clean}\n`;

  try {
    // 1. All events stream into dev-all.log
    fs.appendFileSync(allLogFile, logEntry, 'utf8');

    // 2. Track breadcrumbs
    addBreadcrumb(taskName, level, clean);

    // 3. Unified Sentry Diagnostic Card into dev-errors.log (Single Method)
    const isProblem = (level === 'ERROR' || level === 'WARN') && !isBenignNoise(clean);
    if (isProblem) {
      captureSentryDiagnostic(taskName, level, clean);
    }
  } catch (_) {}
}

function initLogSession(tasks) {
  ensureLogsDir();

  // Clean up legacy sentry-errors.log if it exists
  const legacySentryLog = path.join(logsDir, 'sentry-errors.log');
  const legacySentryLogPrev = path.join(logsDir, 'sentry-errors.log.prev');
  try {
    if (fs.existsSync(legacySentryLog)) fs.unlinkSync(legacySentryLog);
    if (fs.existsSync(legacySentryLogPrev)) fs.unlinkSync(legacySentryLogPrev);
  } catch (_) {}

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
  const header = `======================================================\n🚀 Dev Session Started: ${getLocalTimestamp()}\nActive Services: ${tasks.map((t) => t.name).join(', ')}\n======================================================\n`;
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
    hint: 'Vue Flow Standalone Canvas Editor (:8765/studio)',
    color: pc.magenta,
    cmd: process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
    args: ['-F', 'automa', 'run', 'dev:studio'],
    cwd: rootDir,
    description: 'Automa Studio Standalone Canvas',
    url: 'http://127.0.0.1:8765/studio/',
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
const isOpen = args.includes('--open') || args.includes('-o');

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
  try {
    if (process.platform === 'win32') {
      spawn('rundll32.exe', ['url.dll,FileProtocolHandler', url], { stdio: 'ignore', detached: true }).unref();
    } else if (process.platform === 'darwin') {
      spawn('open', [url], { stdio: 'ignore', detached: true }).unref();
    } else {
      spawn('xdg-open', [url], { stdio: 'ignore', detached: true }).unref();
    }
  } catch (_) {
    try {
      if (process.platform === 'win32') {
        spawn('cmd.exe', ['/c', 'start', '""', url], { stdio: 'ignore', detached: true }).unref();
      }
    } catch (_) {}
  }
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
      stdio: ['ignore', 'pipe', 'pipe'],
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
      const content = fs.readFileSync(errorLogFile, 'utf8').trim();
      console.log(`\n${pc.bold(pc.red('🚨 Sentry Diagnostics & Lỗi gần nhất (dev-errors.log):'))}\n`);
      if (!content) {
        console.log(pc.green('  (Chưa có lỗi nào được ghi nhận)'));
      } else {
        const events = content.split('┌──────').filter(Boolean);
        const latest = events.slice(-5).map((e) => `┌──────${e}`).join('');
        console.log(latest || content);
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
  console.log(`  • Toàn bộ Log   : ${pc.bold(allLogFile)}`);
  console.log(`  • Log Lỗi Sentry: ${pc.bold(errorLogFile)}\n`);
}

function showHotkeysBar() {
  const hotkeys = [
    `${pc.bold('r')} Restart`,
    `${pc.bold('c')} Clear`,
    `${pc.bold('e')} Lỗi Sentry`,
    `${pc.bold('l')} File logs`,
    `${pc.bold('o')} Mở browser`,
    `${pc.bold('q')} Thoát`,
  ];
  console.log(`\n${pc.dim('────────────────────────────────────────────────────────────────────────────')}`);
  console.log(`  ${pc.cyan('Hotkeys:')} ${hotkeys.join(pc.dim('  │  '))}`);
  console.log(`${pc.dim('────────────────────────────────────────────────────────────────────────────')}`);

  const activeUrls = activeTasks.filter((t) => t.url);
  if (activeUrls.length > 0) {
    console.log(pc.bold(pc.green('  🌐 URL Trực tiếp (Ctrl + Click để mở):')));
    activeUrls.forEach((t) => {
      console.log(`    • ${pc.bold(t.label.padEnd(20))}: ${pc.cyan(pc.underline(t.url))}`);
    });
    console.log(`${pc.dim('────────────────────────────────────────────────────────────────────────────')}\n`);
  } else {
    console.log('');
  }
}

function setupHotkeys() {
  try {
    process.stdin.resume();
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    process.stdin.setEncoding('utf8');
  } catch (_) {}

  const handleKey = (rawStr) => {
    const key = (rawStr || '').trim().toLowerCase();
    if (key === 'q' || rawStr === '\u0003') {
      cleanup();
    } else if (key === 'r') {
      restartAll();
    } else if (key === 'c') {
      console.clear();
      showHotkeysBar();
    } else if (key === 'e' || key === 's') {
      showRecentErrors();
    } else if (key === 'l') {
      showLogPaths();
    } else if (key === 'o') {
      console.log(`\n${pc.cyan('🌐 Đang mở các dashboard trên trình duyệt...')}${pc.reset('')}`);
      activeTasks.forEach((t) => {
        if (t.url) {
          console.log(`  → ${t.label}: ${t.url}`);
          openBrowser(t.url);
        }
      });
    }
  };

  process.stdin.on('data', (chunk) => {
    const str = typeof chunk === 'string' ? chunk : chunk.toString();
    handleKey(str);
  });
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

  if (isOpen) {
    setTimeout(() => {
      activeTasks.forEach((t) => {
        if (t.url) {
          openBrowser(t.url);
        }
      });
    }, 2500);
  }
}

main().catch((err) => {
  console.error(`${pc.red}Lỗi khởi chạy Dev Orchestrator:${pc.reset('')}`, err);
  process.exit(1);
});

