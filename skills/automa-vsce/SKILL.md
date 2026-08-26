---
name: automa-vsce
description: Architecture, UI/UX, and development standards for the Automa VS Code Extension (automa-vsce). Activate when working on 3-panel sidebar (AUTOMATIONS, BROWSERS, STORAGE), Custom Text Editors (*.workflow.json, *.campaign.json), Webview Vue UI and IPC bridges, WebSocket live breakpoint debugging (/api/v1/ws), JSON schema intellisense, or Vitest unit tests.
---

# Automa VS Code Extension (`automa-vsce`)

Comprehensive architecture, UI/UX, and implementation guide for the `automa-vsce` submodule.

---

## 1. 🎯 Scope & Responsibilities

`automa-vsce` acts as a **Thin Client** IDE layer connecting to the local Automa Core Rust Daemon (`http://127.0.0.1:8765`).

### Primary Capabilities:
1. **3-Panel Sidebar (GitHub Actions Standard)**:
   - `⚡ AUTOMATIONS` (`automa.workspace`): Workflows (`*.workflow.json`), Campaigns (`*.campaign.json`), Packages (`*.package.json`).
   - `🌐 BROWSERS` (`automa.browsers`): Anti-Detect Browser Profiles (`*.browser.json`).
   - `🔒 STORAGE` (`automa.storage`): Tables, Plaintext Variables, AES-encrypted Credentials.
2. **Custom Text Editors & Visual Studio Canvas**:
   - `*.workflow.json`: Visual Canvas (embedded Web Studio) + Form Parameters + Settings + JSON + Output & Live Logs.
   - `*.campaign.json`: Matrix fleet orchestration & multi-browser scheduling.
3. **Real-time 2-Way Debugging**:
   - WebSocket `/api/v1/ws` connection for live breakpoints (`pauseJob`, `resumeJob`, `killJob`).
4. **JSON Schema Intellisense (`contributes.jsonValidation`)**:
   - Auto-complete, diagnostics, and hover documentation for all `.workflow.json`, `.campaign.json`, and `.browser.json` files.

---

## 2. 🛡️ Architectural Invariants

- **Zero-Mock Backend-First**: NEVER mock API responses in extension code. Consume generated SDK client (`@automa/types/api`).
- **No Raw CLI Spawning**: NEVER use `child_process.spawn("automa run")`. Always dispatch execution jobs via Typed SDK (`submitJob()`).
- **SSE & WebSocket Invariants**:
  - SSE (`/api/events`): 1-way log streaming and execution telemetry.
  - WebSocket (`/api/v1/ws`): 2-way low-latency control commands from `@automa/types/ws`.
- **Flat List Tagging**: Deep nested folders (4 chevron drilldowns) are FORBIDDEN in `AutomaFilesProvider`. Display flat lists with namespace badges `[parent/namespace]`.
- **Visual Form Invariant**: Form mode with dynamic column builder is default. Raw JSON is secondary tab.
- **Strict CSS Tokens**: Use `--vscode-panel-border` and `--vscode-sideBarSectionHeader-border`. NEVER use `--vscode-widget-border`.
- **Webview Testability**: All interactive buttons, inputs, tabs, and table cells MUST have explicit `data-testid`.

---

## 3. 💻 Code Templates & Patterns

### A. Diagnostics Provider (Linter Integration)
```typescript
import * as vscode from 'vscode';

const diagnosticCollection = vscode.languages.createDiagnosticCollection('automa-linter');

export function updateDiagnostics(
  document: vscode.TextDocument, 
  lintErrors: Array<{ line: number; message: string; severity: 'error' | 'warning' }>
) {
  const diagnostics: vscode.Diagnostic[] = lintErrors.map(err => {
    const range = new vscode.Range(err.line, 0, err.line, 100);
    const severity = err.severity === 'error' 
      ? vscode.DiagnosticSeverity.Error 
      : vscode.DiagnosticSeverity.Warning;
    return new vscode.Diagnostic(range, err.message, severity);
  });
  diagnosticCollection.set(document.uri, diagnostics);
}
```

### B. Two-Way WebSocket Debugging Service (`WebSocketService.ts`)
```typescript
import type { AutomaWsCommand, AutomaWsEvent } from "@automa/types/ws";

export class WebSocketService {
  private static instance: WebSocketService;
  private ws: WebSocket | null = null;

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) WebSocketService.instance = new WebSocketService();
    return WebSocketService.instance;
  }

  public pauseJob(jobId: string): boolean {
    return this.send({ type: "PAUSE_JOB", jobId });
  }

  public resumeJob(jobId: string): boolean {
    return this.send({ type: "RESUME_JOB", jobId });
  }

  public send(command: AutomaWsCommand): boolean {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return false;
    this.ws.send(JSON.stringify(command));
    return true;
  }
}
```

---

## 4. 🔧 Testing & Verification

- **Submodule Unit Tests**: Run `pnpm test` in `automa-vsce/` (`npx vitest run`).
- **Webview Build**: Run `pnpm run build:webview` (`vite build --config webview-ui/vite.config.ts`).
- **Lint & Typecheck**: Run `pnpm run lint` (`tsc --noEmit && biome check`). Must achieve 0 errors, 0 warnings.
