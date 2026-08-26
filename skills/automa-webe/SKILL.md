---
name: automa-webe
description: Architecture, Standalone Web Studio Canvas (dist/studio), Headless Execution Engine (dist/cli-runner), MV3 Offscreen worker, and browser DOM automation blocks for Automa Web Extension (automa-webe). Activate when modifying workflow canvas, VueFlow graph layout, block handlers, or extension runtime adapters.
---

# Automa Web Extension & Studio (`automa-webe`)

Architecture and implementation guide for the `automa-webe` submodule.

---

## 1. 🎯 Scope & Dual Build Targets

`automa-webe` provides the core browser automation engine and visual workflow studio.

### 2 Reusable Build Artifacts:
1. **Headless Execution Engine (`dist/cli-runner`)**:
   - Build command: `pnpm run build:runner` (`webpack.runner.config.js`).
   - Sideloaded into headless/headful Chromium instances by `automa-core` to execute DOM automation blocks.
2. **Standalone Web Studio Canvas (`dist/studio`)**:
   - Build command: `pnpm run build:studio` (`webpack.studio.config.js`).
   - Served by `automa-core` at `http://127.0.0.1:8765/studio/` and embedded into `automa-vsce` custom editors via `iframe` with two-way `postMessage` synchronization.

---

## 2. 🛡️ Architectural Invariants

- **Zero Code Duplication**: Other submodules (`automa-core`, `automa-vsce`, `automa-desk`) MUST consume `dist/cli-runner` and `dist/studio`. Duplicating canvas/runner source code is FORBIDDEN.
- **Native Browser APIs**: Uses native `chrome.*` / `browser.*` through `src/lib/browser-compat.js` (aliased via Webpack; never use `webextension-polyfill` directly).
- **MV3 Offscreen Resilience**:
  - Workflow execution in Chrome MV3 runs inside an Offscreen Document (`offscreen.html`).
  - Message dispatchers MUST implement retry-with-backoff (min 5 attempts, 300ms interval) to handle browser startup races on `about:blank`.
- **Idempotent Background Worker**:
  - Guard SSE connection loops with singleton flags (`isWorkerDaemonInitialized`) to prevent duplicate task execution.
- **Static Imports in Hot Paths**: Dynamic `await import(...)` in service worker entry points is FORBIDDEN to prevent Webpack chunk loading latency.

---

## 3. 💻 Canvas Host Bridge & Two-Way IPC Protocol

### Host Bridge (`src/studio/adapters/host-bridge.js`)
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

## 4. 🔧 Verification & Builds

- **Build Runner**: `pnpm run build:runner`
- **Build Studio**: `pnpm run build:studio`
- **Build Extension**: `pnpm run build`
