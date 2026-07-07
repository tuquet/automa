# Project: Automa Ecosystem Supabase CLI integration and Log Streaming

## Architecture
The system consists of the following components:
1. **Local Supabase Backend (`automa-be`)**:
   - PostgreSQL database with `workflows` and `workflow_logs` tables.
   - Supabase Edge Function `get-workflow` that fetches a workflow by ID from the database.
2. **Automa Extension (`automa`)**:
   - Executed inside a Puppeteer-controlled browser instance.
   - Runs workflows, interacts with web pages, and emits execution events.
3. **Automa CLI (`automa-cli`)**:
   - `bin/cli.js`: Parses options, triggers fetch if ID is passed, launches browser/extension, and runs the workflow.
   - `lib/supabase.js`: Queries the local Edge Function to retrieve the workflow.
   - `lib/runner.js`: Manages Puppeteer session lifecycle.
   - `lib/workflow.js`: Injects the execution command into the extension and waits for completion.
   - `lib/extension.js`: Performs handshake with the extension background script.

### Data Flow
- **Fetching**: CLI -> HTTP GET -> Supabase Edge Function (`get-workflow?id=...`) -> PostgreSQL `workflows` -> Workflow JSON -> CLI.
- **Log Streaming**: Extension Execution -> Puppeteer Target/Console/Message Interception -> CLI logs to stdout as real-time NDJSON.

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 0 | Exploration & Setup Validation | Analyze codebase, resolve config resolution issue, verify local Supabase start, investigate log streaming mechanisms | None | DONE (Conv: 7cd94158-258c-4ca2-82dc-a8f15102412b) |
| 1 | E2E Test Suite Development (E2E Track) | Implement 27 test cases (Tiers 1-4) in `tests/e2e_tests.js` covering happy/edge/combination paths, write mock servers, output `TEST_READY.md` | M0 | IN_PROGRESS (Conv: sub_orch_e2e) |
| 2 | Edge Function Verification | Verify local Edge Function responds correctly with workflow data when requested by ID `iBY3Fp6THq6LluDgHbt4g` | M0 | IN_PROGRESS (Conv: sub_orch_impl) |
| 3 | CLI Fetching & Config Resolution | Fix CLI config imports, implement robust workflow fetching from Supabase and handle HTTP error/timeout scenarios | M2 | IN_PROGRESS (Conv: sub_orch_impl) |
| 4 | Real-time NDJSON Log Streaming | Hook into real-time execution events from the extension, output them line-by-line to stdout in NDJSON | M3 | IN_PROGRESS (Conv: sub_orch_impl) |
| 5 | Verification & Adversarial Hardening | Run all E2E tests, resolve failures, run Tier 5 (Adversarial Hardening) using challenger analysis, run Forensic Audit | M1, M4 | IN_PROGRESS (Conv: sub_orch_impl) |

---

## Interface Contracts

### CLI Options & Outputs
- **Input CLI Arguments**:
  - `[path-to-workflow-json]` (optional file path)
  - `--id <supabase_workflow_id>` (optional Supabase ID)
  - `--extension, -e <dir>` (path to extension directory)
  - `--variables, -v <json_string>` (variables injected into the execution)
  - `--timeout, -t <ms>` (execution timeout)
- **Output (NDJSON stream on stdout)**:
  - Each line is a valid JSON object containing log details (e.g. `{ "type": "log", "step": "click", "status": "success", "timestamp": "..." }`).
  - Error output: `{ "type": "error", "message": "..." }`.

### Supabase Edge Function `get-workflow`
- **Request**: `GET /functions/v1/get-workflow?id=<id>`
- **Headers**:
  - `apikey`: `SUPABASE_ANON_KEY`
  - `Authorization`: `Bearer <SUPABASE_ANON_KEY>`
- **Response (200 OK)**: Raw workflow JSON payload.
- **Response (4xx / 5xx Error)**: `{ "error": "<error_message>" }`.

---

## Code Layout
- `automa-cli/bin/cli.js`: Command Line entry point.
- `automa-cli/lib/supabase.js`: Supabase interaction module.
- `automa-cli/lib/runner.js`: Puppeteer runner coordinator.
- `automa-cli/lib/workflow.js`: Workflow execution interface.
- `automa-cli/lib/extension.js`: Extension communication library.
- `automa-cli/tests/e2e_tests.js`: E2E test runner (Tiers 1-4).
