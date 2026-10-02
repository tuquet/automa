# Automa Core OpenAPI — Integration & Implementation Guide
### Developer Integration & Deployment Guide (Client / SDK Consumers)

> **Objective**: Provide an industry-standard technical developer guide (similar to Stripe, Temporal, and Supabase documentation) enabling frontend developers (`automa-desk`, `automa-vsce`, `automa-webe`) and third-party services to understand, integrate, and deploy with the **Automa Core** OpenAPI using an **Event-Driven Architecture (EDA)** model.

---

## 📑 Table of Contents

1. [Architecture Overview & Contract-First Philosophy](#1--architecture-overview--contract-first-philosophy)
2. [SDK Client Installation & Configuration (`@automa/types/api`)](#2--sdk-client-installation--configuration-automatypesapi)
3. [Protocol Triangle (REST vs SSE vs WebSocket)](#3--protocol-triangle-rest-vs-sse-vs-websocket)
4. [Domain-Specific Implementation Recipes](#4-️-domain-specific-implementation-recipes)
   - [4.1. Workflow Execution & Real-Time Log Streaming](#41-workflow-execution--real-time-log-streaming)
   - [4.2. Virtual Browser Profile Management (Anti-Detect)](#42-virtual-browser-profile-management-anti-detect)
   - [4.3. Parallel Campaign Matrix Execution](#43-parallel-campaign-matrix-execution)
   - [4.4. SQLite Data Management & Secret Encryption (AES-256)](#44-sqlite-data-management--secret-encryption-aes-256)
5. [Standardized Error Handling & `ApiErrorResponse`](#5-️-standardized-error-handling--apierrorresponse)
6. [Reference Code: Vue 3 / Pinia Event-Driven Composable](#6--reference-code-vue-3--pinia-event-driven-composable)
7. [Contract Testing & Automation](#7--contract-testing--automation)

---

## 1. 🎯 Architecture Overview & Contract-First Philosophy

Automa Core operates as a high-performance Rust daemon (`http://127.0.0.1:8765`), acting as the Single Source of Truth for automation orchestration, Chromium process lifecycle, and SQLite storage.

```text
+-------------------------------------------------------------------------------+
|                             CLIENT APPLICATIONS                               |
|   VS Code Extension (automa-vsce) | Desktop App (automa-desk) | Studio (Vue)  |
+---------------------------------------+---------------------------------------+
                                        |
       ┌────────────────────────────────┼────────────────────────────────┐
       │ (1) HTTP REST (RPC Actions)    │ (2) SSE Stream (Logs/Progress) │ (3) WebSocket (2-Way Control)
       ▼                                ▼                                ▼
┌──────────────┐                 ┌──────────────┐                 ┌──────────────┐
│  /api/v1/*   │                 │ /api/v1/events│                │  /api/v1/ws  │
└──────┬───────┘                 └──────┬───────┘                 └──────┬───────┘
       │                                │                                │
+------v--------------------------------v--------------------------------v------+
|                         AUTOMA CORE DAEMON (Port 8765)                         |
|  - SQLite Global Storage (Tables/Vars/Creds)  - Process Manager (Chromium)    |
|  - Headless Execution Dispatcher              - AES-256 PBKDF2 Vault          |
+-------------------------------------------------------------------------------+
```

### 4 Core Invariants:
1. **Contract-First & Single Source of Truth**: All DTOs and endpoints are declared in Rust (`utoipa`) and automatically exported to the OpenAPI 3.1.0 specification (`openapi.json`). Clients **must never write manual `fetch` calls** and should always use the auto-generated `@automa/types/api` SDK. Manual markdown API copy-pasting is strictly prohibited to eliminate documentation drift.
2. **Unified API Trinity**:
   - **Tier 1 (Code-to-Code / Compiler)**: The `@automa/types/api` SDK delivers absolute type safety, autocomplete, and compile-time validation for TypeScript.
   - **Tier 2 (Interactive Explorer / QA)**: **Scalar API Reference** (`pnpm run docs:api` at `http://localhost:8767`) provides a modern interface with `Ctrl+K` quick search, live execution tests, and hot reload.
   - **Tier 3 (Architecture & Blueprints)**: This integration guide and the 2D Matrix specifications in `docs/srs/` focus on architectural principles, workflows, and production recipes.
3. **Zero-Dummy UI**: Every action button (Run, Stop, Pause, Delete, Sideload) must map to a valid `operation_id` in the OpenAPI spec and comprehensively handle `Loading`, `Success`, and `Error` states.
4. **Event-Driven UI Reactions**: Client sends an asynchronous command $\rightarrow$ Receives `200 OK (job_id)` immediately $\rightarrow$ Subscribes to the SSE/WS telemetry stream to update progress in the UI.

---

## 2. 📦 SDK Client Installation & Configuration (`@automa/types/api`)

Any monorepo application or external service can import the typed SDK directly from `@automa/types`:

### Base URL and Client Interceptor Configuration

```typescript
import { client } from '@automa/types/api';

// 1. Configure the Automa Core daemon base address
client.setConfig({
  baseUrl: 'http://127.0.0.1:8765',
});

// 2. (Optional) Add request/response interceptors for telemetry or auth headers
client.interceptors.request.use((request) => {
  request.headers.set('X-Client-App', 'Automa-Desktop-v1.0');
  return request;
});

client.interceptors.response.use((response) => {
  if (!response.ok) {
    console.error(`[API Error] ${response.status} from ${response.url}`);
  }
  return response;
});
```

---

## 3. 🔌 Protocol Triangle (REST vs SSE vs WebSocket)

Use the following guidelines to select the appropriate communication channel:

| Protocol | Endpoint | Direction | Primary Use Cases |
| :--- | :--- | :--- | :--- |
| **HTTP REST** | `/api/v1/...` | Request $\rightarrow$ Response (1-1) | CRUD mutations, saving workflows, profile creation, job dispatch (`submit_job`), health checks. |
| **SSE (Server-Sent Events)** | `/api/v1/events` | Server $\rightarrow$ Client (Unidirectional) | Console log streaming (`task:log`), node progress events (`JOB_PROGRESS`), campaign matrix slot updates. |
| **WebSocket** | `/api/v1/ws` | Client $\leftrightarrow$ Server (Bidirectional) | Low-latency interactive controls: Pause (`PAUSE_JOB`), Resume (`RESUME_JOB`), Terminate (`KILL_JOB`), direct CDP command pass-through. |

---

## 4. 🛠️ Domain-Specific Implementation Recipes

### 4.1. Workflow Execution & Real-Time Log Streaming

#### Operational Flow:
1. User clicks **Run Workflow** (`btn.workflow.run`).
2. Client invokes `submitJob` via REST.
3. Server assigns a `job_id` and starts orchestrating the browser worker.
4. Client opens an SSE connection to `/api/v1/events` to ingest logs and render them in the Output Panel.

```typescript
import { submitJob, killJob } from '@automa/types/api';

// Step 1: Dispatch workflow execution
export async function executeWorkflow(workflowPath: string, browserId?: string) {
  const { data, error } = await submitJob({
    body: {
      workflow_path: workflowPath,
      browser_id: browserId,
      options: {
        headless: false,
        debug: true,
      },
    },
  });

  if (error || !data?.job_id) {
    throw new Error(error?.message || 'Failed to dispatch workflow job');
  }

  const jobId = data.job_id;
  console.log(`[Job Enqueued] ID: ${jobId}`);

  // Step 2: Subscribe to Server-Sent Events stream for telemetry
  const eventSource = new EventSource('http://127.0.0.1:8765/api/v1/events');

  eventSource.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data);
      
      // Filter events matching the current jobId
      if (payload.jobId === jobId) {
        if (payload.type === 'task:log') {
          console.log(`[LOG - Step ${payload.step}]:`, payload.message);
        } else if (payload.type === 'task:completed') {
          console.log('✅ Workflow completed successfully!');
          eventSource.close();
        } else if (payload.type === 'task:error') {
          console.error('❌ Workflow error encountered:', payload.error);
          eventSource.close();
        }
      }
    } catch (e) {
      console.error('Error parsing SSE event:', e);
    }
  };

  return {
    jobId,
    // Abort handler to terminate execution at any time
    abort: async () => {
      await killJob({ path: { job_id: jobId } });
      eventSource.close();
    },
  };
}
```

---

### 4.2. Virtual Browser Profile Management (Anti-Detect)

#### Operational Flow:
Launch an isolated Chromium profile configured with dedicated proxies, custom user agents, and distinct fingerprints.

```typescript
import {
  getBrowsers,
  createBrowser,
  startBrowserSession,
  stopBrowserSession,
  getBrowserCookies,
} from '@automa/types/api';

// 1. Retrieve profiles list and online/offline status
export async function fetchBrowserList() {
  const { data, error } = await getBrowsers();
  if (error) throw error;
  return data; // Array<BrowserResponse>
}

// 2. Register a new Browser Profile
export async function registerNewBrowserProfile(id: string, name: string, proxyUrl?: string) {
  const { error } = await createBrowser({
    body: {
      id,
      name,
      proxy: proxyUrl ? { server: proxyUrl } : undefined,
      fingerprint: {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...',
        timezone: 'Asia/Ho_Chi_Minh',
      },
    },
  });
  if (error) throw error;
}

// 3. Launch and manage session lifecycle
export async function toggleBrowserSession(browserId: string, isRunning: boolean) {
  if (!isRunning) {
    // Start Browser
    await startBrowserSession({ path: { id: browserId } });
  } else {
    // Stop Browser
    await stopBrowserSession({ path: { id: browserId } });
  }
}

// 4. Extract Cookies from Chromium SQLite storage
export async function exportCookies(browserId: string) {
  const { data, error } = await getBrowserCookies({ path: { id: browserId } });
  if (error) throw error;
  return data; // Array<Cookie>
}
```

---

### 4.3. Parallel Campaign Matrix Execution

```typescript
import { executeCampaign, abortCampaign, getCampaignMatrixStatus } from '@automa/types/api';

export async function runMatrixFleet(campaignId: string) {
  // 1. Activate multi-browser allocation matrix
  const { data, error } = await executeCampaign({
    body: {
      campaign_id: campaignId,
      concurrency: 4, // 4 concurrent browsers
      grid_layout: { rows: 2, cols: 2 },
    },
  });

  if (error) throw error;

  // 2. Poll matrix slot telemetry status
  const interval = setInterval(async () => {
    const status = await getCampaignMatrixStatus({ path: { id: campaignId } });
    if (status.data?.is_finished) {
      clearInterval(interval);
      console.log('Matrix Campaign Execution Finished.');
    }
  }, 1000);
}
```

---

### 4.4. SQLite Data Management & Secret Encryption (AES-256)

Automa Core persists data tables and environment variables in local SQLite storage. Sensitive credentials (API keys, passwords) are encrypted before writing:

```typescript
import {
  getStorageTables,
  addStorageTable,
  addStorageTableRow,
  encryptSecret,
  addStorageCredential,
} from '@automa/types/api';

// 1. Create a user data table
export async function createDataTable(tableName: string) {
  const { data, error } = await addStorageTable({
    body: {
      id: tableName.toLowerCase(),
      name: tableName,
      columns: [
        { name: 'email', type: 'string', required: true },
        { name: 'status', type: 'string', required: false },
      ],
    },
  });
  if (error) throw error;
  return data;
}

// 2. Save encrypted credential (AES-256-GCM with PBKDF2)
export async function saveSecureCredential(key: string, secretValue: string, masterPass: string) {
  // Encrypt via core daemon vault
  const { data: encryptedData, error: encError } = await encryptSecret({
    body: {
      plaintext: secretValue,
      passphrase: masterPass,
    },
  });

  if (encError || !encryptedData) throw encError;

  // Store encrypted ciphertext into SQLite
  await addStorageCredential({
    body: {
      id: key,
      name: key,
      encryptedValue: encryptedData.ciphertext,
      iv: encryptedData.iv,
      salt: encryptedData.salt,
    },
  });
}
```

---

## 5. 🛡️ Standardized Error Handling & `ApiErrorResponse`

All endpoints return standard HTTP status codes accompanied by a structured `ApiErrorResponse` payload:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "The specified workflow JSON file does not exist on disk.",
  "details": {
    "path": "workflows/missing.workflow.json",
    "timestamp": 1724665200000
  }
}
```

### Common Error Codes & Recommended UI Action:

| HTTP Status | Error Code | Business Meaning | Recommended UI Reaction |
| :--- | :--- | :--- | :--- |
| `400 Bad Request` | `VALIDATION_FAILED` | Invalid request parameters or missing required fields. | Display inline validation error message below input control. |
| `404 Not Found` | `RESOURCE_NOT_FOUND` | Profile, Workflow, or Data Table not found on disk/db. | Display Toast error notification and automatically refresh list. |
| `429 Too Many Requests` | `MAX_CONCURRENCY` | Concurrency limit reached for system resources. | Transition button to queued state or prompt user to wait. |
| `500 Internal Error` | `DATABASE_ERROR` | SQLite read/write failure or OS-level process error. | Open error modal with details and prompt log inspection. |

---

## 6. 💻 Reference Code: Vue 3 / Pinia Event-Driven Composable

Below is a production-ready composable illustrating the Finite State Machine (FSM), typed OpenAPI invocation, and SSE/WS event streaming:

```typescript
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { submitJob, killJob } from '@automa/types/api';
import type { ButtonExecutionState } from '@automa/types';

export const useWorkflowActionStore = defineStore('workflow-action', () => {
  const buttonState = ref<ButtonExecutionState>('IDLE');
  const activeJobId = ref<string | null>(null);
  const executionLogs = ref<string[]>([]);
  const lastError = ref<string | null>(null);

  const isBusy = computed(() => buttonState.value === 'VALIDATING' || buttonState.value === 'DISPATCHING');
  const isRunning = computed(() => buttonState.value === 'EXECUTING');

  // Trigger button action
  async function triggerRunOrStop(workflowPath: string, browserId?: string) {
    // If executing -> button click acts as STOP
    if (isRunning.value && activeJobId.value) {
      buttonState.value = 'TERMINATING';
      try {
        await killJob({ path: { job_id: activeJobId.value } });
      } catch (err: any) {
        lastError.value = err?.message || 'Failed to terminate job';
      }
      return;
    }

    if (buttonState.value !== 'IDLE') return;

    // Phase 1: Validation
    buttonState.value = 'VALIDATING';
    lastError.value = null;
    executionLogs.value = [];

    if (!workflowPath) {
      lastError.value = 'Invalid workflow path';
      buttonState.value = 'IDLE';
      return;
    }

    // Phase 2: Dispatch request to OpenAPI
    buttonState.value = 'DISPATCHING';
    const { data, error } = await submitJob({
      body: {
        workflow_path: workflowPath,
        browser_id: browserId,
      },
    });

    if (error || !data?.job_id) {
      buttonState.value = 'FAILED';
      lastError.value = error?.message || 'Error occurred while creating session';
      setTimeout(() => { buttonState.value = 'IDLE'; }, 3000);
      return;
    }

    // Phase 3: Transition to Executing state and await telemetry events
    activeJobId.value = data.job_id;
    buttonState.value = 'EXECUTING';
  }

  // Hook for updates from WebSocket or SSE
  function onTelemetryEvent(event: { type: string; jobId: string; message?: string; status?: string }) {
    if (event.jobId !== activeJobId.value) return;

    if (event.type === 'task:log' && event.message) {
      executionLogs.value.push(event.message);
    } else if (event.type === 'task:completed' || event.status === 'completed') {
      buttonState.value = 'COMPLETED';
      setTimeout(() => {
        buttonState.value = 'IDLE';
        activeJobId.value = null;
      }, 1500);
    } else if (event.type === 'task:error' || event.status === 'failed') {
      buttonState.value = 'FAILED';
      lastError.value = event.message || 'Execution failed';
      setTimeout(() => {
        buttonState.value = 'IDLE';
        activeJobId.value = null;
      }, 2500);
    }
  }

  return {
    buttonState,
    activeJobId,
    executionLogs,
    lastError,
    isBusy,
    isRunning,
    triggerRunOrStop,
    onTelemetryEvent,
  };
});
```

---

## 7. 🧪 Contract Testing & Automation

To guarantee OpenAPI contract integrity and prevent schema regressions during backend refactors:

### Monorepo Verification Commands:
1. **Validate 100% OpenAPI Schema Compliance**:
   ```bash
   pnpm run lint:schema
   ```
2. **Run UI Unit Tests & Mock IPC**:
   ```bash
   pnpm -F vscode-automa test
   pnpm -F @automa/desk test:unit
   ```
3. **Synchronize SDK when Rust Backend Changes**:
   ```bash
   pnpm run sync:api
   ```
