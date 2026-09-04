---
name: automa-log-tracking
description: Real-time diagnostic and log tracing guide for inspecting .automa/logs/ when debugging dev orchestration, process crashes, port conflicts, or cross-service errors. Activate when troubleshooting system errors or diagnosing dev-all.log / dev-errors.log.
---

# Automa Log Tracking & Diagnostics (`automa-log-tracking`)

Diagnostic protocols for tracing real-time execution logs under `.automa/logs/`.

---

## 1. 🎯 Log File Sources

- **`dev-errors.log`** (`.automa/logs/dev-errors.log`): Unified Sentry diagnostic error & warning cards with service tags, error categories, and preceding breadcrumbs. **Inspect this file first**.
- **`dev-all.log`** (`.automa/logs/dev-all.log`): Full aggregated stdout/stderr logs from all orchestrated sub-processes.

---

## 2. 🛡️ Service Prefix Index

- `[CORE]`: Rust Core Daemon (`automa-core` Axum server on port `8765`).
- `[DESK]`: Desktop Native App (`automa-desk` Tauri v2).
- `[VSCE]`: VS Code Extension (`automa-vsce` Extension host).
- `[STUDIO]` / `[RUNNER]`: Web Extension engine (`automa-webe`).
- `[DOCS]`: Scalar OpenAPI documentation server.

---

## 3. 🔧 Troubleshooting Playbook

1. View the latest Sentry diagnostic cards in `.automa/logs/dev-errors.log` (press `e` in Dev Orchestrator).
2. Filter by service prefix to isolate the failing component.
3. Check `dev-all.log` if deep chronological stdout/stderr context is needed.
4. Check for common port 8765 collisions or Windows file lock issues (`cargo watch` rebuild while `automa-core.exe` is running).
