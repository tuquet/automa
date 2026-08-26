# Git Repository & Submodule Operations

- **Zero Git Push**: `git push` is strictly FORBIDDEN. Only the USER pushes to remote. Keep all changes in local git / staging.
- **Submodule Pointer Sync**: When committing inside any submodule (`automa-core`, `automa-webe`, `automa-vault`, `automa-vsce`), MUST run `pnpm run sync:submodules` to update root pointer before committing at Root.
- **Branching (`dev` vs `main`)**: All feature and bugfix development MUST target `dev`. Branch `main` is reserved for production releases.
- **Decoupled Changesets**: `@changesets/cli` runs independently per submodule (`cd <submodule>` before `pnpm changeset`). NEVER run changesets at root.
- **Scratch Files**: Temporary/test files MUST stay inside target submodule `scratch/` (e.g. `automa-vsce/scratch/`), never polluting repo root.

# Monorepo Architecture & Reusability

- **Canonical 4-Letter Submodules**: `automa-webe` (Extension), `automa-vsce` (VS Code), `automa-desk` (Desktop Tauri), `automa-core` (Rust Daemon), `automa-vault` (Storage Workspace). Folder names in `skills/` MUST match 100%.
- **Dual Reusable Build Targets from `automa-webe`**:
  - `pnpm run build:runner` $\rightarrow$ Headless Execution Engine at `dist/cli-runner`.
  - `pnpm run build:studio` $\rightarrow$ Standalone Web Canvas at `dist/studio`.
  - **Reusability Invariant**: Other submodules (`automa-core`, `automa-vsce`, `automa-desk`) directly consume these 2 build artifacts. Code duplication is FORBIDDEN.
- **Dev Orchestration**: Use single command `pnpm run dev:all` (`scripts/dev-orchestrator.mjs`) to spawn full stack (Rust Core + Studio + VS Code). Auto-kills child tree on exit to prevent port `8765` leaks.
- **SSE vs WebSocket Protocols**:
  - **SSE (`/api/events`)**: 1-way streaming (logs, telemetry, matrix progress).
  - **WebSocket (`/api/v1/ws`)**: Low-latency 2-way control (`PAUSE_JOB`, `RESUME_JOB`, `KILL_JOB`, live breakpoints) consuming types from `@automa/types/ws`.
- **Zero Fallback & Explicit Errors**: All endpoints MUST use `/api/v1/...` with explicit HTTP statuses (`BadRequest`, `NotFound`, `Validation`, `InternalServerError`) and `ApiErrorResponse`. Legacy fallback routing is FORBIDDEN.

# Strict TypeScript, SOLID & Quality Standards

- **Zero Linter Bypass**: `// biome-ignore` or `// @ts-ignore` is FORBIDDEN. Every commit MUST achieve 0 errors, 0 warnings on `pnpm run lint` / `biome check`.
- **Canonical Schemas & Strict Typing**: All Command Handlers, IPC Payloads, Providers, and Services MUST consume types from `@automa/types` & `@automa/types/api`. Loose signatures (`Record<string, unknown>`, `as any`) are FORBIDDEN.
- **Strict SOLID & TDD Enforcement (`/solid` Skill)**:
  - **Mandatory Trigger**: When writing new code, refactoring, planning module architecture, writing tests, or debugging, Agent **MUST** activate and adhere to [`skills/solid/SKILL.md`](skills/solid/SKILL.md) and `skills/solid/references/`.
  - **TDD Red-Green-Refactor**: Write behavior tests before production code; perform architectural design during the Refactoring phase only.
  - **Primitive Obsession Elimination**: Wrap raw primitives in Domain Value Objects / Typed IDs (e.g. `WorkflowId`, `BrowserId`, `JobId`, `Email`).
  - **Object Calisthenics**: Max 1 indent level per method, early returns (avoid `else`), Law of Demeter (1 dot per line), methods < 10 lines, classes < 50 lines, max 2 instance variables.
  - **Complexity Management**: Eliminate Accidental Complexity via **YAGNI** (build only what is needed now), **KISS** (simplest working solution), and **Rule of Three** (abstract only on the 3rd repetition).

# Agent Orchestration, Subagents & Token Context Guard

- **Context Token Budgeting**: For large tasks spanning multiple submodules (Rust + Vue + VS Code), avoid polluting the primary conversation context. Decompose work into specialized subagent workflows via `invoke_subagent`.
- **Specialized Subagent Roles**:
  - `Backend Engineer`: Implements Axum routes, DTOs, and unit tests in `automa-core`.
  - `SDK Sync Coordinator`: Executes `pnpm run sync:api` and validates OpenAPI / SDK contracts.
  - `Frontend / VSCE Specialist`: Consumes `@automa/types/api` in Webviews and Custom Editors.
  - `QA & Test Validator`: Executes 4-tier test runner and headless Playwright tests.
- **Code Review & QA Swarm Protocols**:
  - *Review / Refactor Swarm*: Use `invoke_subagent` to spawn 5 read-only subagents (SOLID, KISS/YAGNI, Demeter, Flow/Complexity, Safety).
  - *QC / Test Swarm*: Use `invoke_subagent` to spawn 3 read-only subagents (Functional QA, Performance/Leak, Security).
  - Primary agent consolidates reports and applies code edits only after user confirmation.

# Backend API, OpenAPI & SDK Synchronization

- **Contract-First & Zero-Mock Protocol**:
  - **Phase 1 (Contract Definition)**: Define Rust DTO structs and endpoints in `automa-core` first with `utoipa` annotations (`ToSchema`, `/// doc comments`, `snake_case` `operation_id`). NEVER mock APIs or return dummy errors in Frontend.
  - **Phase 2 (Sync & CodeGen)**: Run `pnpm run sync:api` at root to regenerate OpenAPI spec (`openapi.json`), Bruno collections, and TypeScript SDK client (`@automa/types/api`).
  - **Phase 3 (Frontend Consumption)**: Implement UI/Webview/Extension features by consuming the generated typed SDK methods directly. Raw `fetch()` or hardcoded URLs are strictly FORBIDDEN.
- **Strict OpenAPI v3 (`utoipa`)**:
  - `operation_id`: MUST be `snake_case` (e.g. `submit_job`, `get_job_history`) for `@hey-api/openapi-ts` SDK generation (`submitJob()`, `getJobHistory()`).
  - `tag`: Exactly 1 of 10 standard tags (`Jobs`, `Storage`, `Browsers`, `Campaigns`, `System`, `History`, `Settings`, `Secrets`, `Lint`, `Events`).
  - DTO Structs: MUST have doc comments `///`, derive `ToSchema`, and annotate JSON values with `#[schema(value_type = ...)]`. Raw `serde_json::Value` without schema annotation is FORBIDDEN.

# 4-Tier Testing Strategy

- **Tier 1: Submodule Unit Tests**:
  - `automa-vsce/src/test/`: Providers, Commands, Webview IPC via Vitest (`pnpm test`). Mock `vscode.MarkdownString` and `vscode.ViewColumn` in `setup.ts`.
  - `automa-core/src/`: Rust unit & integration tests (`cargo test`).
- **Tier 2: Monorepo Cross-Service E2E (`tests/e2e/`)**: Blackbox API tests in TypeScript (Vitest) against isolated test daemon on port `8766` via Typed SDK. Rust `#[tokio::test]` for API E2E is FORBIDDEN.
- **Tier 3: Strict Schema & Spec Linter**: `node scripts/enforce-strict-schema.mjs` enforces 100% OpenAPI spec validity.
- **Tier 4: Unified Test Runner**: Run `pnpm run test` (`node scripts/test-all.mjs`) to validate all 4 tiers before handoff.

# VS Code UI/UX & Webview Standards

- **3-Panel Sidebar (GitHub Actions Standard)**:
  - Sidebar MUST contain exactly 3 panels: `AUTOMATIONS` (`automa.workspace`), `BROWSERS` (`automa.browsers`), `STORAGE` (`automa.storage`).
  - Dashboard panel is REMOVED from Activity Bar.
  - Term `Vault` is REPLACED by `Storage` across all UI labels and views.
- **Flat List Namespace Tagging (Zero Nested Folders)**:
  - Deep nested folders (4-level chevron drilldowns) are FORBIDDEN in `AutomaFilesProvider`.
  - MUST display flat lists with visual namespace badge `[parent/namespace]` (e.g. `[google.com/fleets] • v1.28.0 • 8 blocks`).
- **Concise Terms**: Use concise labels: `Workflows (N)`, `Campaigns (N)`, `Packages (N)`, `Secrets`, `Variables`, `Tables`.
- **Visual Form Mode**: Modal/dialog views (e.g. `TableView.vue`) MUST provide visual forms with auto-detected columns and dynamic `+ Add Column`. Raw JSON editor is secondary tab for power users only.
- **Webview Testability**: All interactive elements (inputs, buttons, tabs, table cells) MUST have explicit `data-testid`.
- **Webview Security & CSS Tokens**:
  - Escape HTML against XSS; strict CSP with 32-char nonce.
  - Use Semantic CSS tokens: `--vscode-panel-border`, `--vscode-sideBarSectionHeader-border`, `--vscode-panel-border, 0.12`. `--vscode-widget-border` is FORBIDDEN.
- **Zero Dummy UI & Zero Silent Execution**: 100% of UI buttons MUST have working handlers. Workflow execution MUST focus output channel and stream logs via IPC.

# Domain Terminology & Vault Cryptography

- **Entity Hierarchy**: `Campaign` $\rightarrow$ `Browsers` $\rightarrow$ `Tasks` $\rightarrow$ `Workflows` $\rightarrow$ (Runtime) `Jobs`.
  - `Browser`: Virtual anti-detect browser entity (`*.browser.json`). Terms `Profile` or `Member` are FORBIDDEN.
  - `Campaign`: Suite containing `browsers` and scheduled `tasks` (`*.campaign.json`).
  - `Job`: Dynamic runtime execution session (`automa-core`).
- **Global Storage vs Storage Workspace**:
  - `Global Storage`: Business database (`Tables`, `Variables`, `Credentials`) in SQLite.
  - `Storage Workspace`: Directory tree containing scenario files on disk (`automa-vault`).
- **Vault Zero-Leak Cryptography**:
  - `Variables` (`/api/v1/storage/variables`): Plaintext public configuration.
  - `Credentials` (`/api/v1/storage/credentials`): Encrypted secrets via `HMAC-SHA256 (64 hex) + AES-256-CBC Base64 (Salted__)`.
  - Master Passphrase stored in `vscode.SecretStorage` or `AUTOMA_PASSPHRASE`. Engine decrypts secrets in RAM only during `{{secrets.key}}` execution and immediately clears memory. Logging decrypted secrets is FORBIDDEN.

# Zero Folder JSON Scanning & SQLite Database-First Invariant

- **Zero Folder Scanning**: Scanning folders/directories on disk for JSON scenario files (e.g. searching for `*.workflow.json`, `*.browser.json`, `*.campaign.json` via glob/recursive file scans) is strictly FORBIDDEN.
- **Database-First State Management**: All entities, browsers, storage variables, credentials, tables, and execution jobs are managed, created, queried, and updated directly via **Automa Core REST API (`/api/v1/...`)** backed by SQLite database.
- **Explicit File Interactions Only**: Files on disk are only opened when the user explicitly triggers an editor for a specific file or performs an explicit export. No background folder-scanning or automatic file-tree globbing commands are permitted.

# Strict SRS Compliance & Zero Spec Hallucination Invariant

- **Canonical Specification References**:
  - [**SRS Button Business Logic & Event-Driven Schema**](docs/SRS_BUTTON_BUSINESS_LOGIC_EVENT_DRIVEN.md): Master specification for all button actions, FSM states (`IDLE`, `VALIDATING`, `DISPATCHING`, `EXECUTING`, `COMPLETED`, `FAILED`, `TERMINATING`), button IDs (`btn.*`), and real-time SSE/WS reactions.
  - [**OpenAPI Integration Guide**](docs/OPENAPI_INTEGRATION_GUIDE.md): Master developer manual for consuming REST endpoints, SSE streams (`/api/v1/events`), and WebSocket channels (`/api/v1/ws`).
  - [**Button Schema Contracts**](packages/automa-types/src/button-schema.ts): Canonical TypeScript types exported from `@automa/types`.
- **Zero Hallucination Rule**:
  - Agents **MUST NOT** invent fake endpoints, unverified payload parameters, non-existent UI buttons, or arbitrary FSM state transitions.
  - Every UI button across `automa-desk`, `automa-vsce`, and `automa-webe` **MUST** map 1-to-1 with a documented Button ID and follow its defined FSM sequence and SSE/WS reaction rules.
  - All API calls **MUST** consume typed SDK functions from `@automa/types/api`. Raw `fetch()` or improvised URLs are strictly FORBIDDEN.
- **Protocol for New Features**:
  - If a requested feature or button is missing from the SRS or OpenAPI spec, the Agent **MUST NOT** hallucinate an ad-hoc frontend solution.
  - Follow the 4-step Contract-First workflow:
    1. Define Rust DTO structs and endpoints in `automa-core` with `utoipa` OpenAPI annotations.
    2. Run `pnpm run sync:api` at monorepo root to regenerate the OpenAPI spec and TypeScript SDK.
    3. Update `docs/SRS_BUTTON_BUSINESS_LOGIC_EVENT_DRIVEN.md` and `docs/OPENAPI_INTEGRATION_GUIDE.md` with the new button/endpoint contracts.
    4. Implement the frontend / extension UI consuming the newly generated SDK methods.

