# 📜 SRS Domain Specification: Menu History (Job Telemetry & Audit Logs)

---

## 🎯 1. Scope & Objectives

The **History** menu provides execution audit logs and performance telemetry across all workflow execution sessions within the Automa Ecosystem:
- **`apps/desk`**: Delivers a comprehensive audit interface (`HistoryView.vue`), status filters, step-level trace inspection, and execution duration analytics.
- **`apps/vsce`**: Delivers execution log inspection and Output Channel integration.
- **`apps/core`**: Persists run history in SQLite `job_history` storage.

---

## 🌳 2. UI/UX Layout & Component Tree

```text
HistoryView.vue (or LiveLogView.vue in VS Code)
├── Header Filter Bar
│   ├── Search Input (Debounced 150ms by Job ID / Workflow Name)
│   ├── Status Filter Dropdown (select.history.status: All / Completed / Failed / Stopped)
│   ├── Date Range Filter
│   ├── btn.history.refresh (Reload history records)
│   └── btn.history.clear (Purge historical logs)
├── History Job Table / Card List
│   └── Job Record Item
│       ├── Job ID & Workflow Name
│       ├── Status Badge (Green: Completed / Red: Failed / Amber: Stopped)
│       ├── Start Time & Duration
│       ├── Trigger Type (Manual / Cron / Webhook / Campaign)
│       ├── btn.history.viewdetails (Open trace log drawer)
│       └── btn.history.rerun (Re-run workflow with original parameters)
└── Job Details & Trace Log Drawer
    ├── Job Summary & Execution Context
    ├── Step-by-step Block Execution Timeline
    └── Raw Console Logs Viewer (with copy/export utilities)
```

---

## ⚡ 3. Button Catalog in History Menu

| Button ID | UI Label | Icon | Supported FSM States | Target Action & Endpoint | `data-testid` |
|---|---|---|---|---|---|
| `btn.history.refresh` | Refresh History | `RefreshCw` | `IDLE` | Calls `getJobHistory()` to refresh list | `btn-refresh-history` |
| `btn.history.clear` | Clear History | `Trash2` | `IDLE` | Purges legacy execution records | `btn-clear-history` |
| `btn.history.viewdetails`| View Details | `Eye` | `IDLE` | Opens drawer for step trace logs | `btn-view-job-details` |
| `btn.history.rerun` | Re-run Job | `RotateCcw`| `IDLE` | Re-dispatches workflow with saved inputs | `btn-rerun-job` |
| `btn.history.export` | Export Logs | `Download` | `IDLE` | Exports logs to text/JSON | `btn-export-history-logs` |

---

## 📜 4. Select Dropdowns in History Menu

| Select ID | Dropdown Label | Remote Data Source | Virtualization & Debounce | Reactive Selection Side-Effect | `data-testid` |
|---|---|---|---|---|---|
| `select.history.status` | Filter By Status | Static Union (`all`, `completed`, `failed`, `stopped`) | No virtualization | Filters table records by execution status | `select-history-status` |
| `select.history.workflow`| Filter By Workflow| `GET /api/v1/storage/workflows` | Virtualized 1000+, Debounce 150ms | Restricts history to chosen workflow | `select-history-workflow` |

---

## 🌐 5. API Endpoints & SSE Events Catalog

| Protocol | Endpoint / Event | Method | SDK Function | Business Description |
|---|---|:---:|---|---|
| **REST** | `/api/v1/history` | `GET` | `getJobHistory({ query: { limit, offset, search, status } })` | Retrieves paginated execution records from SQLite |
| **REST** | `/api/v1/history/{id}` | `GET` | `getJobDetails()` | Retrieves detailed trace telemetry for specific job |
| **SSE** | `/api/v1/events` | Stream | `globalSseClient` | Ingests `job_completed` / `job_failed` to auto-insert new entries |

---

## 🛡️ 6. Quality Assurance & Agent Cross-Checklist

1. [ ] History queries must support pagination using `limit` and `offset` in SQLite, preventing memory overhead.
2. [ ] Upon job completion in the Studio menu, the new entry must immediately appear in History via reactive SSE listeners.
3. [ ] The log drawer must expose complete metadata: Block ID, execution duration per step, and formatted error logs upon failure.
