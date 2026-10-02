# @automa/types

> **Canonical Type System & Typed OpenAPI SDK for the Automa Ecosystem**

`@automa/types` is the core package providing TypeScript definitions, Finite State Machine (FSM) contracts, and code-generated TypeScript SDK clients derived from the Automa Core OpenAPI specification.

---

## 📦 Package Subpath Exports

The package exposes modular subpath exports optimized for tree-shaking:

| Subpath | Purpose | Source Module |
| :--- | :--- | :--- |
| `@automa/types` | Domain Contracts: Button FSM, Select Dropdowns, Pinia Stores | `src/button.ts`, `src/select.ts`, `src/store.ts` |
| `@automa/types/api` | **Typed OpenAPI SDK Client & DTO Schemas** | Generated via `@hey-api/openapi-ts` from `openapi.json` |
| `@automa/types/ws` | WebSocket Live Control Payloads (Pause, Resume, Kill, Breakpoint) | `src/ws.ts` |
| `@automa/types/ipc` | Inter-Process Communication contracts (VSCE $\leftrightarrow$ Webview) | `src/ipc.ts` |
| `@automa/types/workflow` | Workflow Graph, Blocks, Connections, Variables | `src/workflow.ts` |
| `@automa/types/campaign` | Campaign Matrix, Tasks, Scheduling | `src/campaign.ts` |
| `@automa/types/browser` | Anti-detect Virtual Browser configurations | `src/browser.ts` |
| `@automa/types/job` | Runtime Execution Job State & Logs | `src/job.ts` |

---

## 🚀 Usage Guide

### 1. Invoking Backend APIs via Typed SDK (`@automa/types/api`)

Direct raw `fetch()` calls or hardcoded URLs are strictly prohibited. Always use the typed client:

```typescript
import { client, getBrowsers, createBrowser, executeCampaign } from '@automa/types/api';

// Configure Base URL and authentication passphrase
client.setConfig({
  baseUrl: 'http://127.0.0.1:8765',
});

// Execute requests with full TypeScript IntelliSense
const { data, error } = await getBrowsers({
  query: {
    limit: 20,
    offset: 0,
    search: 'Chrome-AntiDetect',
  },
});

if (error) {
  console.error('API Error:', error.message);
} else {
  console.log('Browsers:', data);
}
```

### 2. Using Button & Select Contracts

```typescript
import type { AutomaButtonId, ButtonFsmState } from '@automa/types';
import type { AutomaSelectId } from '@automa/types';

const saveBtnId: AutomaButtonId = 'btn.workflow.save';
const browserSelectId: AutomaSelectId = 'select.campaign.browser';
```

### 3. Listening to WebSocket Control Messages (`@automa/types/ws`)

```typescript
import type { WsClientMessage, WsServerEvent } from '@automa/types/ws';

const pauseCommand: WsClientMessage = {
  type: 'PAUSE_JOB',
  jobId: 'job-1234',
};
```

---

## 🔄 Code Generation Pipeline

Do not manually edit files inside `src/api/`. All DTO and endpoint schemas must be synchronized from the Rust backend:

```bash
# Full synchronization from monorepo root:
pnpm run sync:api

# Or generate locally within the package:
pnpm run generate:api
pnpm run build
```
