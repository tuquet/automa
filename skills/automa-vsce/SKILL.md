---
name: automa-vsce
description: Architecture, UI/UX, Panel systems (automa-vsce:panel), Custom Editor Previews (automa-vsce:preview), and development standards for the Automa VS Code Extension (automa-vsce). Activate when working on 3-panel sidebar (AUTOMATIONS, BROWSERS, STORAGE), Standalone Webview Panels (TablePanel, WelcomePanel), Custom Text Editors (*.workflow.json, *.campaign.json, *.browser.json), Webview Vue UI and IPC bridges, WebSocket live breakpoint debugging (/api/v1/ws), JSON schema intellisense, or Vitest unit tests.
---

# Automa VS Code Extension (`automa-vsce`)

Comprehensive architecture, UI/UX, and implementation guide for the `automa-vsce` submodule.

---

## 1. 🎯 Scope & Responsibilities

`automa-vsce` acts as a **Thin Client** IDE layer connecting to the local Automa Core Rust Daemon (`http://127.0.0.1:8765`).

### Primary Concepts & Architectural Pillars:
1. **`automa-vsce:panel` — Panel & Webview View Architecture**:
   - Standalone Webview Panels (`TablePanel`, `WelcomePanel`, Standalone Studio Modal).
   - Sidebar Webview Views (`BrowsersWebviewProvider` at `automa.browsers`).
   - Sidebar Tree Data Providers (`WorkspaceTreeDataProvider`, `StorageTreeDataProvider`, `LogsTreeDataProvider`).
   - 📖 **Deep Dive Reference**: [`skills/automa-vsce/references/panel-architecture.md`](references/panel-architecture.md)
2. **`automa-vsce:preview` — Preview & Custom Editor Architecture**:
   - Document-bound Custom Text Editors (`vscode.CustomTextEditorProvider`, `BaseCustomEditorProvider`).
   - Visual Editors: `WorkflowEditorProvider` (`*.workflow.json`), `CampaignEditorProvider` (`*.campaign.json`), `BrowserEditorProvider` (`*.browser.json`), `LogEditorProvider` (`*.automa-log.json`).
   - Bidirectional Document Sync (`TextDocument` $\leftrightarrow$ Vue Webview with native Undo/Redo `Ctrl+Z`, `Ctrl+Y`, Dirty Indicator `●`, Save `Ctrl+S`).
   - Source $\leftrightarrow$ Preview Toggle & Side-by-Side Split View (`ViewColumn.Beside`).
   - Live 2-Way Breakpoint Debugging (`WebSocketService` `/api/v1/ws`, Pause/Resume/Kill, step highlight).
   - 📖 **Deep Dive Reference**: [`skills/automa-vsce/references/preview-custom-editor.md`](references/preview-custom-editor.md)
3. **IPC Protocol & Strict Typing**:
   - Zero-Mock Typed SDK consumption (`@automa/types/api`).
   - Real-time WebSocket commands (`@automa/types/ws`).
   - 📖 **Deep Dive Reference**: [`skills/automa-vsce/references/ipc-and-types.md`](references/ipc-and-types.md)

---

## 2. 🏛️ Core Architectural Comparison: `Panel` vs `Preview`

| Dimension | `automa-vsce:panel` | `automa-vsce:preview` |
| :--- | :--- | :--- |
| **VS Code API Base** | `vscode.WebviewPanel` / `WebviewViewProvider` / `TreeDataProvider` | `vscode.CustomTextEditorProvider` / `BaseCustomEditorProvider` |
| **Document Binding** | **Unbound / Database-bound** (SQLite queries via REST API) | **File-bound** (Bound to a `vscode.TextDocument` on disk/buffer) |
| **Primary Targets** | Dynamic Tables, Anti-Detect Browsers, Storage Variables, Welcome Dashboard | Scenario Files (`*.workflow.json`, `*.campaign.json`, `*.browser.json`) |
| **Save & History** | Direct DB Mutation via Typed SDK (`addStorageTableRow()`) | `vscode.WorkspaceEdit` to `TextDocument` (Preserves Undo stack) |
| **Toggle Mode** | Reveal / Hide / Re-open panel | Toggle Source (`showSource`) $\leftrightarrow$ Visual Canvas (`showPreview`) |
| **Typical Location** | Activity Bar Sidebar / Modal Full Tab (`ViewColumn.One`) | Main Editor Area / Side-by-Side Split (`ViewColumn.Beside`) |

---

## 3. 🛡️ Architectural Invariants

- **SQLite Database-First & Zero Folder Scanning**: All Browsers, Storage Variables, Credentials, Tables, and Execution Jobs are loaded and managed 100% via **Automa Core REST API (`/api/v1/...`)** backed by SQLite. Scanning workspace directories on disk for `.json` files via glob/find commands is FORBIDDEN.
- **Zero-Mock Backend-First**: NEVER mock API responses in extension code. Consume generated SDK client (`@automa/types/api`).
- **No Raw CLI Spawning**: NEVER use `child_process.spawn("automa run")`. Always dispatch execution jobs via Typed SDK (`submitJob()`).
- **SSE & WebSocket Invariants**:
  - SSE (`/api/v1/events`): 1-way log streaming and execution telemetry.
  - WebSocket (`/api/v1/ws`): 2-way low-latency control commands from `@automa/types/ws`.
- **Flat List Tagging**: Deep nested folders (4 chevron drilldowns) are FORBIDDEN in `AutomaFilesProvider`. Display flat lists with namespace badges `[parent/namespace]`.
- **Visual Form Invariant**: Form mode with dynamic column builder is default for data dialogs (`TableView.vue`). Raw JSON is secondary tab.
- **Strict CSS Tokens**: Use `--vscode-panel-border` and `--vscode-sideBarSectionHeader-border`. NEVER use `--vscode-widget-border`.
- **Webview Testability**: All interactive buttons, inputs, tabs, and table cells MUST have explicit `data-testid`.
- **Zero Data Loss Guarantee**: All workflow edits from Preview MUST pass through `WorkflowSanitizer` before saving to `TextDocument`.

---

## 4. 💻 Common Developer Recipes

### Recipe A: Opening a Standalone Webview Panel (`Panel`)
```typescript
import * as vscode from "vscode";
import { TablePanel } from "./panels/TablePanel";

// Triggered from command palette or tree item context menu
export async function openTableCommand(item: StorageItem, context: vscode.ExtensionContext) {
  await TablePanel.show(context, item);
}
```

### Recipe B: Registering a Custom Text Editor Provider (`Preview`)
```typescript
import * as vscode from "vscode";
import { WorkflowEditorProvider } from "./providers/WorkflowEditorProvider";

export function registerCustomEditors(context: vscode.ExtensionContext) {
  WorkflowEditorProvider.register(context);
}
```

### Recipe C: Toggling Visual Preview and Raw JSON Source
```typescript
// Open Visual Preview beside source
await vscode.commands.executeCommand("vscode.openWith", documentUri, "automa.workflowEditor", vscode.ViewColumn.Beside);

// Open Raw JSON Source from preview
await vscode.commands.executeCommand("vscode.openWith", documentUri, "default", vscode.ViewColumn.Active);
```

---

## 5. 🔧 Verification & Quality Standards

1. **Unit & Integration Tests**:
   - Run `pnpm test` in `automa-vsce/` (`vitest run`).
   - Providers, Commands, and Webview IPC must achieve 100% pass rate.
2. **Webview UI Compilation**:
   - Run `pnpm run build:webview` (`vite build --config webview-ui/vite.config.ts`).
3. **Lint & Strict Typing**:
   - Run `pnpm run lint` (`tsc --noEmit && biome check`).
   - 0 errors, 0 warnings required before committing.
4. **Monorepo Ecosystem Verification**:
   - Run `node scripts/test-all.mjs` at repository root.

---

## 6. 📚 Canonical Specifications & Anti-Hallucination Guardrails

- [**2D Matrix Specification Hub**](../../docs/srs/README.md): Master navigation hub connecting Horizontal Standards and 6 Vertical Menu SRS.
- [**SRS Horizontal Buttons & FSM Engine**](../../docs/srs/SRS_HORIZONTAL_BUTTONS.md): 100% of UI buttons MUST follow the documented FSM states (`IDLE`, `VALIDATING`, `DISPATCHING`, `EXECUTING`, `COMPLETED`, `FAILED`, `TERMINATING`) and use defined `btn.*` IDs.
- [**SRS Horizontal Selects & Virtualization**](../../docs/srs/SRS_HORIZONTAL_SELECTS.md): Master specification for remote-driven, virtualized, debounced fuzzy-search dropdowns (`select.*`), FSM states, and SSE cache invalidation.
- [**OpenAPI Integration Guide**](../../docs/OPENAPI_INTEGRATION_GUIDE.md): 100% of backend interactions MUST consume typed methods from `@automa/types/api`. Raw `fetch()` or hallucinated endpoints are strictly FORBIDDEN.
