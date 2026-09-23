---
name: automa-core
description: Architecture, Axum REST/SSE/WS endpoints, OpenAPI utoipa annotations, SQLite state, and execution coordinator for the Automa Core Rust Daemon (automa-core). Activate when implementing backend routes, DTO structs, browser process managers, storage APIs, or job lifecycle events.
---

# Automa Core Rust Daemon (`automa-core`)

Architecture, API standards, and system coordination guide for the `apps/core` application.

---

## 1. 🎯 Scope & Responsibilities

`automa-core` is the central high-performance Rust Daemon listening on port `8765`.

### Key Responsibilities:
1. **REST & Streaming API**: Axum-based HTTP REST, Server-Sent Events (`/api/events`), and low-latency WebSocket (`/api/v1/ws`).
2. **OpenAPI v3 Contract (`utoipa`)**: Source of truth for client SDK generation (`@automa/types/api`).
3. **Storage Engine**: SQLite embedded database (`AutomaDb`) for Tables, Variables, and AES-256 encrypted Credentials.
4. **Anti-Detect Browser Manager**: Spawns isolated Chromium instances with customized user-agents, proxies, extensions, and fingerprints.
5. **Job Lifecycle Coordinator**: Coordinates workflow/campaign executions, dispatches payloads to the Headless Runner (`dist/cli-runner`), and aggregates telemetry logs.

---

## 2. 🛡️ Architectural Invariants

- **Separation of Concerns**: Rust Core NEVER manipulates browser DOM directly. All DOM actions (`click`, `input`, `scroll`) are executed inside the browser context by `apps/webe/dist/cli-runner` to preserve native anti-bot fingerprinting.
- **RESTful Strictness**: Resource-oriented routes only. Action verbs in URLs are FORBIDDEN (use `POST /api/jobs` instead of `POST /api/jobs/submit`).
- **OpenAPI v3 `utoipa` Rules**:
  - `operation_id`: Explicit `snake_case` (e.g. `submit_job`, `get_health`, `get_storage_tables`).
  - `tag`: Exactly 1 of 10 standard tags (`Jobs`, `Storage`, `Browsers`, `Campaigns`, `System`, `History`, `Settings`, `Secrets`, `Lint`, `Events`).
  - DTOs: Derive `#[derive(Serialize, Deserialize, ToSchema)]`, write doc comments `///` for every struct and field, annotate `serde_json::Value` with `#[schema(value_type = ...)]`.
- **Async Runtime & Error Safety**:
  - Tokio async runtime; heavy CPU tasks (AES crypto, massive JSON parsing) run via `tokio::task::spawn_blocking`.
  - `.unwrap()` and `.expect()` are FORBIDDEN in production paths. Use `thiserror` and `?` operators with `AutomaError`.
  - Shared state shared via `Arc<RwLock<T>>` or `Arc<Mutex<T>>` (using `tokio::sync`).

---

## 3. 💻 Code Templates & Handlers

### Axum Route Handler with `utoipa` Annotations
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

## 4. 🔧 Verification & SDK Sync

1. **Rust Check & Tests**: Run `cargo test --manifest-path apps/core/Cargo.toml`.
2. **Export OpenAPI Spec**: `cargo run --manifest-path apps/core/Cargo.toml --bin automa-core -- --export-openapi packages/types/openapi.json`.
3. **Synchronize Monorepo API SDK**: Run `pnpm run sync:api` at monorepo root.

---

## 5. 📚 Canonical Specifications & Anti-Hallucination Guardrails

- [**2D Matrix Specification Hub**](../../docs/srs/README.md): Master navigation hub connecting Horizontal Standards and 6 Vertical Menu SRS.
- [**SRS Horizontal Buttons & FSM Engine**](../../docs/srs/SRS_HORIZONTAL_BUTTONS.md): Master specification for button actions, FSM state machines, and SSE/WS real-time event mapping.
- [**OpenAPI Integration Guide**](../../docs/OPENAPI_INTEGRATION_GUIDE.md): Master manual for OpenAPI routes, DTO structures, and SDK generation.
