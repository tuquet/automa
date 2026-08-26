# `automa-vsce:panel` — Panel & Webview View Architecture

Comprehensive architectural guide, design patterns, lifecycle rules, and implementation standards for **Panels** in `automa-vsce`.

---

## 1. 🎯 Definition & Mental Model

In `automa-vsce`, a **Panel** is any standalone, modal, or sidebar UI surface that renders interactive interfaces, data managers, or tree hierarchies without directly acting as a file document editor.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         AUTOMA-VSCE PANELS                               │
├──────────────────────────┬─────────────────────────┬─────────────────────┤
│ 1. Standalone Panels     │ 2. Sidebar Webviews     │ 3. Sidebar Trees    │
│ (vscode.WebviewPanel)    │ (WebviewViewProvider)   │ (TreeDataProvider)  │
├──────────────────────────┼─────────────────────────┼─────────────────────┤
│ • TablePanel             │ • BrowsersWebviewProvider│ • WorkspaceTree...  │
│ • WelcomePanel           │   (automa.browsers)     │   (automa.workspace)│
│ • Standalone Studio Modal│ • DashboardWebview...   │ • StorageTree...    │
│                          │                         │   (automa.storage)  │
│                          │                         │ • LogsTree...       │
│                          │                         │   (automa.logs)     │
└──────────────────────────┴─────────────────────────┴─────────────────────┘
```

---

## 2. 🏛️ Panel Categories & Concrete Implementations

### Category 1: Standalone Webview Panels (`vscode.WebviewPanel`)
Occupies an independent full editor tab or modal column (`vscode.ViewColumn.One` or `ViewColumn.Active`).

- **`TablePanel` (`src/panels/TablePanel.ts`)**:
  - Purpose: Full-featured database viewer and schema editor for SQLite dynamic tables (`/api/v1/storage/tables`).
  - View Type: `automa.tableEditor`.
  - Capabilities: Visual table grid, search filter, insert new row modal, dynamic column creation, cascade deletion.
- **`WelcomePanel` (`src/panels/WelcomePanel.ts`)**:
  - Purpose: Onboarding, quick links, ecosystem health status, system metrics summary.
  - View Type: `automa.welcome`.

#### 📌 Singleton Panel Pattern & Lifecycle Template
```typescript
import * as vscode from "vscode";
import { VIEW_TYPES } from "../core/constants";
import { WebviewHtmlResolver } from "../core/webview/WebviewHtmlResolver";

export const TablePanel = {
  currentPanel: undefined as vscode.WebviewPanel | undefined,

  async show(context: vscode.ExtensionContext, tableItem: { itemId: string; label: string }) {
    // 1. Reveal existing panel if already open (Prevent duplicate tabs)
    if (TablePanel.currentPanel) {
      TablePanel.currentPanel.reveal(vscode.ViewColumn.One);
      return;
    }

    // 2. Create new WebviewPanel with memory retention
    const panel = vscode.window.createWebviewPanel(
      VIEW_TYPES.TABLE_EDITOR,
      `Table: ${tableItem.label}`,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true, // Keep Vue state alive when tab is backgrounded
        localResourceRoots: [context.extensionUri],
      }
    );
    TablePanel.currentPanel = panel;

    // 3. Cleanup on disposal
    panel.onDidDispose(() => {
      TablePanel.currentPanel = undefined;
    });

    // 4. Resolve HTML with Secure Nonce and CSP
    const htmlResolver = new WebviewHtmlResolver(context);
    panel.webview.html = htmlResolver.resolveHtml(panel.webview, {
      viewType: "table",
      payload: {
        tableId: tableItem.itemId,
        tableName: tableItem.label,
      },
    });

    // 5. Setup Typed IPC Message Listener
    panel.webview.onDidReceiveMessage(async (message) => {
      // IPC Command Routing
    });
  },
};
```

---

### Category 2: Sidebar Webview Views (`vscode.WebviewViewProvider`)
Embedded directly inside the 3-Panel Activity Bar sidebar.

- **`BrowsersWebviewProvider` (`src/providers/BrowsersWebviewProvider.ts`)**:
  - View ID: `automa.browsers` (configured in `package.json` with `"type": "webview"`).
  - Purpose: Anti-detect browser fleet management, proxy configuration, user-agent setup, live status indicators, cookie import/export, and instant browser spawning/killing.
- **`DashboardWebviewProvider` (`src/providers/DashboardWebviewProvider.ts`)**:
  - View ID: `automa.dashboard`.
  - Purpose: System telemetry monitoring (CPU, RAM, active runners), daemon health indicator.

#### 📌 WebviewViewProvider Pattern
```typescript
import * as vscode from "vscode";
import { WebviewHtmlResolver } from "../core/webview/WebviewHtmlResolver";

export class BrowsersWebviewProvider implements vscode.WebviewViewProvider {
  private _view?: vscode.WebviewView;

  constructor(private readonly context: vscode.ExtensionContext) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.context.extensionUri],
    };

    const resolver = new WebviewHtmlResolver(this.context);
    webviewView.webview.html = resolver.resolveHtml(webviewView.webview, {
      viewType: "browsers",
    });

    webviewView.webview.onDidReceiveMessage(async (msg) => {
      // Handle browser management commands
    });
  }

  public postMessage(message: unknown) {
    this._view?.webview.postMessage(message);
  }
}
```

---

### Category 3: Sidebar Tree Data Providers (`vscode.TreeDataProvider`)
Native VS Code tree views that display hierarchical and flat-list items.

- **`WorkspaceTreeDataProvider` (`src/providers/WorkspaceTreeDataProvider.ts`)**:
  - View ID: `automa.workspace` (`AUTOMATIONS`).
  - Sections: Workflows (`*.workflow.json`), Campaigns (`*.campaign.json`), Packages (`*.package.json`).
  - **Flat List Tagging Invariant**: Deep nested folder hierarchies (4-level chevrons) are FORBIDDEN. Display flat lists with namespace badges `[parent/namespace] • v1.0.0 • 8 blocks`.
- **`StorageTreeDataProvider` (`src/providers/StorageTreeDataProvider.ts`)**:
  - View ID: `automa.storage` (`STORAGE`).
  - Sections: `Tables`, `Variables`, `Secrets` (Encrypted Credentials).
  - **Terminology Invariant**: Term `Vault` is replaced by `Storage` across all UI labels and tree headers.
- **`LogsTreeDataProvider` (`src/providers/LogsTreeDataProvider.ts`)**:
  - View ID: `automa.logs` (`LOGS`).
  - Historical execution logs loaded from SQLite `/api/v1/history`.

---

## 3. 🛡️ Invariants & Rules for Panels

1. **SQLite Database-First**:
   - 100% of data rendered in Panels (Tables, Variables, Credentials, Browsers, History) MUST be queried from **Automa Core REST API (`/api/v1/...`)** backed by SQLite.
   - Folder scanning or file globbing for JSON scenario files is strictly FORBIDDEN.
2. **Zero-Mock & Typed SDK**:
   - Always consume typed SDK functions (`@automa/types/api`) such as `getStorageTableRows()`, `addStorageTableRow()`, `getBrowsers()`, `createBrowser()`.
   - Never mock responses or use raw `fetch()` with hardcoded URLs.
3. **Memory & Lifecycle Safety**:
   - Always set `retainContextWhenHidden: true` in `WebviewOptions` to preserve Vue component state across tab switches.
   - Always register `panel.onDidDispose(() => { currentPanel = undefined; })` to prevent memory leaks and zombie references.
4. **Strict Semantic CSS Tokens**:
   - Use VS Code theme variables: `--vscode-panel-border`, `--vscode-sideBarSectionHeader-border`, `--vscode-editor-background`, `--vscode-foreground`.
   - `--vscode-widget-border` is strictly FORBIDDEN.
5. **Visual Form Mode Primary**:
   - Modal/dialog views (e.g. `TableView.vue`, `BrowserManagerView.vue`) MUST default to Visual Form Mode with auto-detected columns and dynamic `+ Add Column`. Raw JSON editor is only a secondary tab.
6. **Webview Testability**:
   - Every interactive element (buttons, inputs, tabs, table cells, modal triggers) MUST have an explicit `data-testid` attribute (e.g. `data-testid="add-row-btn"`, `data-testid="table-search-input"`).
7. **Security & CSP**:
   - All HTML content MUST be resolved via `WebviewHtmlResolver` using a cryptographically secure 32-character nonce and strict Content Security Policy.
