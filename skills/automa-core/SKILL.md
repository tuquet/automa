---
name: automa-core
description: Architecture, Axum REST/SSE/WS endpoints, OpenAPI utoipa annotations, SQLite database-first state, disk scenario conventions (apps/vault), anti-detect browser managers, and execution coordinator for Automa Core Rust Daemon. Activate when implementing backend routes, DTO structs, storage APIs, browser profiles, campaigns, or job events.
---

# Automa Core Rust Daemon & Storage Architecture (`automa-core`)

Architecture, API standards, database-first state management, and scenario file conventions for the `apps/core` application.

---

## 1. 🎯 Scope & Responsibilities

`automa-core` is the central high-performance Rust Daemon listening on port `8765`.

### Key Responsibilities:
1. **REST & Streaming API**: Axum-based HTTP REST, Server-Sent Events (`/api/v1/events`), and low-latency WebSocket (`/api/v1/ws`).
2. **OpenAPI v3 Contract (`utoipa`)**: Source of truth for client SDK generation (`@automa/types/api`).
3. **Storage Engine (`AutomaDb`)**: SQLite embedded database for Tables, Variables, and AES-256 encrypted Credentials.
4. **Anti-Detect Browser Manager**: Spawns isolated Chromium instances with customized user-agents, proxies, extensions, and fingerprints.
5. **Job Lifecycle Coordinator**: Coordinates workflow/campaign executions, dispatches payloads to the Headless Runner (`dist/cli-runner`), and aggregates telemetry logs.

---

## 2. 🛡️ Architectural Invariants

- **Separation of Concerns**: Rust Core NEVER manipulates browser DOM directly. All DOM actions (`click`, `input`, `scroll`) are executed inside the browser context by `apps/webe/dist/cli-runner` to preserve native anti-bot fingerprinting.
- **RESTful Strictness**: Resource-oriented routes only. Action verbs in URLs are FORBIDDEN (use `POST /api/v1/jobs` instead of `POST /api/v1/jobs/submit`).
- **Database-First State Management**:
  - All state (Workflows, Browsers, Campaigns, Tables, Variables, Credentials) is managed directly in SQLite via REST APIs (`/api/v1/...`).
  - **Zero Folder Scanning Invariant**: Runtimes and extensions MUST NOT use automatic folder scanning/globbing commands to discover state; all entities are managed through the SQLite database.
- **OpenAPI v3 `utoipa` Rules**:
  - `operation_id`: Explicit `snake_case` (e.g. `submit_job`, `get_health`, `get_storage_tables`).
  - `tag`: Exactly 1 of 10 standard tags (`Jobs`, `Storage`, `Browsers`, `Campaigns`, `System`, `History`, `Settings`, `Secrets`, `Lint`, `Events`).
  - DTOs: Derive `#[derive(Serialize, Deserialize, ToSchema)]`, write doc comments `///` for every struct and field, annotate `serde_json::Value` with `#[schema(value_type = ...)]`.
- **Async Runtime & Error Safety**:
  - Tokio async runtime; heavy CPU tasks run via `tokio::task::spawn_blocking`.
  - `.unwrap()` and `.expect()` are FORBIDDEN in production paths. Use `thiserror` and `?` operators with `AutomaError`.

---

## 3. 📂 Storage Workspace Conventions (`apps/vault`)

Disk directory tree used for Git version control and explicit export/import:

```text
apps/vault/
├── browsers/       # Anti-detect profiles (*.browser.json)
├── campaigns/      # Campaign matrix schedules (*.campaign.json)
├── workflows/      # Scenario JSON files (*.workflow.json)
└── scratch/        # Temporary test files
```

### 1. Campaigns Schema (`campaigns/*.campaign.json`):
```json
{
  "name": "E-commerce Price Monitor",
  "version": "1.0.0",
  "description": "Scrapes product prices across target vendors using rotating browsers",
  "browsers": [
    {
      "id": "browser-chrome-us",
      "name": "US Residential Chrome",
      "tasks": [
        {
          "workflow_id": "google-search.workflow.json",
          "schedule": "cron: 0 */2 * * *"
        }
      ]
    }
  ]
}
```

### 2. Browser Profiles Schema (`browsers/*.browser.json`):
```json
{
  "id": "browser-chrome-us",
  "name": "US Residential Chrome",
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...",
  "timezone": "America/New_York",
  "locale": "en-US",
  "proxy": {
    "protocol": "http",
    "host": "proxy.example.com",
    "port": 8080
  }
}
```

---

## 4. 💻 Axum Handler Template with `utoipa`

```rust
use axum::{extract::State, Json};
use utoipa;
use crate::core::error::{ApiErrorResponse, AutomaResult};
use crate::models::job::{SubmitJobRequest, SubmitJobResponse};
use crate::state::AppState;

/// Submit and queue a workflow execution job
#[utoipa::path(
    post,
    path = "/api/v1/jobs",
    request_body = SubmitJobRequest,
    responses(
        (status = 200, description = "Job queued successfully", body = SubmitJobResponse),
        (status = 400, description = "Validation error", body = ApiErrorResponse),
        (status = 500, description = "Internal server error", body = ApiErrorResponse)
    ),
    tag = "Jobs",
    operation_id = "submit_job"
)]
pub async fn submit_job(
    State(state): State<AppState>,
    Json(payload): Json<SubmitJobRequest>,
) -> AutomaResult<Json<SubmitJobResponse>> {
    let job = state.job_coordinator.enqueue(payload).await?;
    Ok(Json(job.into()))
}
```

---

## 5. 🔧 Verification & SDK Sync

1. **Rust Check & Tests**: `cargo test --manifest-path apps/core/Cargo.toml`.
2. **Export OpenAPI Spec**: `cargo run --manifest-path apps/core/Cargo.toml --bin automa-core -- --export-openapi packages/types/openapi.json`.
3. **Synchronize Monorepo API SDK**: Run `pnpm run sync:api` at monorepo root.
4. **Validate Schemas**: `node scripts/enforce-strict-schema.mjs`.
