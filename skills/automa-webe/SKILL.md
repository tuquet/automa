---
name: automa-webe
description: Architecture, Standalone Web Studio Canvas (dist/studio), Headless Execution Engine (dist/cli-runner), VueFlow graph authoring rules (Nanoid, handles, loops), and Chromium extension injection protocols for Automa Web Extension (automa-webe). Activate when modifying workflow canvas, VueFlow graph layout, block handlers, generating workflow JSON, or debugging extension runtime adapters.
---

# Automa Web Extension & Studio Architecture (`automa-webe`)

Comprehensive guide for the Web Studio visual editor, Headless Execution Engine, VueFlow workflow authoring, and Chromium extension injection protocols.

---

## 1. 🎯 Scope & Dual Build Targets

`apps/webe` provides the visual workflow studio and headless browser automation engine.

### 2 Reusable Build Artifacts:
1. **Headless Execution Engine (`dist/cli-runner`)**:
   - Build command: `pnpm run build:runner` (`vite.runner.config.mjs`).
   - Sideloaded into headless/headful Chromium instances by `apps/core` to execute DOM automation blocks.
2. **Standalone Web Studio Canvas (`dist/studio`)**:
   - Build command: `pnpm run build:studio` (`vite.studio.config.mjs`).
   - Served by `apps/core` at `http://127.0.0.1:8765/studio/` as a full standalone SPA (and deployable to Vercel via `pnpm run deploy:studio`).

---

## 2. 🛡️ Architectural Invariants

- **Zero Code Duplication**: Backend daemons (`apps/core`) MUST consume `dist/cli-runner` and `dist/studio`. Duplicating canvas/runner source code is FORBIDDEN.
- **Workspace Dependencies**: Web Studio and Runner consume `@automa/ui` (`packages/ui`) and `@automa/types` (`packages/types`) via PNPM workspace dependencies.
- **Native Browser APIs**: Uses native `chrome.*` / `browser.*` through `src/lib/browser-compat.js` (aliased via Vite; never use `webextension-polyfill` directly).
- **MV3 Offscreen Resilience**:
  - Workflow execution in Chrome MV3 runs inside an Offscreen Document (`offscreen.html`).
  - Message dispatchers MUST implement retry-with-backoff (min 5 attempts, 300ms interval) to handle browser startup races on `about:blank`.
- **Idempotent Background Worker**:
  - Guard SSE connection loops with singleton flags (`isWorkerDaemonInitialized`) to prevent duplicate task execution.
- **Static Imports in Hot Paths**: Dynamic `await import(...)` in service worker entry points is FORBIDDEN to prevent chunk loading latency.

---

## 3. 🧩 VueFlow Workflow Authoring & JSON Generation Rules

When authoring or generating Automa workflow JSON:

### 1. Node IDs & Edges
- **Node ID**: Every block node MUST use unique nanoid-compatible IDs (never generic `n1`, `node_1`).
- **Handles**: Dây nối (edges) MUST declare explicit `sourceHandle` and `targetHandle` matching the block definition.
- **Looping**: Loop variable interpolation syntax: `{{loopData.<loopId>.data}}`. The final block of a loop cycle MUST have an edge pointing back to the `loop-data` block ID.
- **Conditionals**: Edge from Match 1 MUST use `sourceHandle: 'cond1'`, fallback/error MUST use `sourceHandle: 'fallback'`.

### 2. Variable Interpolation in JavaScript Blocks
- **FORBIDDEN**: Never use mustache `{{}}` inside JS blocks (causes V8 syntax errors).
- **REQUIRED**: Use internal accessor: `const val = automaRefData('variables', 'var_name');`.
- **Async Completion**: Call `automaNextBlock(data)` to resolve and pass payload to next block.

### 3. Iframes
- Insert `switch-frame` (type: `switch-to-iframe`) with `data.selector` before targeting elements inside an iframe, and call `switch-frame` (type: `main-frame`) when done.

### 4. Micro-Workflows Modularization
- Split complex workflows into micro-workflows linked via `execute-workflow` blocks (`executeId: "<sub_workflow_id>"`).

---

## 4. 💉 Chromium Extension Injection & Lifecycle Protocols

Programmatic interaction with Automa's Chrome Extension via Puppeteer/CDP:

### 1. Stable Temp Page
- Never use primary UI tabs (`newtab.html`, `index.html`) as communication pages; execution context is destroyed on navigation.
- Use static pages (`popup.html`, `options.html`) as stable communication targets.

### 2. Async Error Wrapping
- Wrap `page.evaluate()` and `page.close()` in Node.js `try...catch` / `.catch(() => {})`.
- Wrap asynchronous Chrome APIs inside a `Promise` in `evaluate()` and resolve on callback.

### 3. Service Worker Awakening
- Never block indefinitely waiting for MV3 Service Worker. Actively open a static extension page (e.g. `popup.html`) to force Chromium to wake the worker.

### 4. Storage Source of Truth
- Runtime state source of truth is `browser.storage.local`. Observe `chrome.storage.onChanged` for two-way synchronization.

---

## 5. 💻 Canvas Host Bridge & Two-Way IPC Protocol

```javascript
export function initHostBridge(store) {
  // Listen for workflow injections from VS Code or Tauri Host
  window.addEventListener('message', (event) => {
    const { type, data } = event.data || {};
    if (type === 'automa:set-workflow' || type === 'setWorkflow') {
      store.loadWorkflow(data);
    }
  });

  // Notify host when user edits nodes or connections
  store.onWorkflowChange((updatedWorkflow) => {
    if (window.acquireVsCodeApi) {
      window.acquireVsCodeApi().postMessage({
        type: 'automa:workflow-changed',
        data: updatedWorkflow
      });
    } else {
      window.parent.postMessage({
        type: 'automa:workflow-changed',
        data: updatedWorkflow
      }, '*');
    }
  });
}
```

---

## 6. 🔧 Verification & Builds

- **Build Runner**: `pnpm run build:runner`
- **Build Studio**: `pnpm run build:studio`
- **Build Extension**: `pnpm run build`
