# Task Breakdown: Native Rust CDP Workflow Engine

## Task 1: Purge legacy Chrome Extension `apps/runner` from `tuquet/automa`

**Description:** Remove the obsolete `apps/runner` Chrome Extension directory from `tuquet/automa` and clean up `build:runner` / `dev:runner` script entries in `package.json` and `turbo.json`.

**Acceptance criteria:**
- [x] `apps/runner` directory is completely removed from `C:\Users\ndtu6\Repository\tuquet\automa\apps\runner`.
- [x] `package.json` and `turbo.json` no longer reference `@automa/runner` or `apps/runner`.
- [x] Monorepo lint and unit tests pass without `apps/runner`.

**Verification:**
- [x] Tests pass: `pnpm run test:unit`
- [x] Lint succeeds: `pnpm run lint`
- [x] Manual check: Confirm `Test-Path apps/runner` is `False`.

**Dependencies:** None

**Files likely touched:**
- `apps/runner/**` (deleted)
- `package.json`
- `turbo.json`

**Estimated scope:** Small (2 config files + directory removal)

---

## Task 2: Extend `CdpSession`, `ElementEngine`, and `HumanInteractionEngine` for full workflow operations

**Description:** Expand [`runner/src/drivers/cdp/`](file:///C:/Users/ndtu6/Repository/tuquet/runner/src/drivers/cdp/mod.rs) to support all browser and DOM primitives required by Automa blocks: CSS + XPath + indexed element resolution in the Isolated World (`specter_stealth_context`), `get_text`, `get_attribute`, `element_exists`, `count_elements`, `select_option`, `clear_and_type`, `press_key`, `reload`, `go_back`, `go_forward`, `get_url`, `capture_screenshot`, and `cookies` management.

**Acceptance criteria:**
- [x] `ElementEngine` supports both CSS and XPath selectors (with optional element index for `loop-elements`) strictly inside `specter_stealth_context` without calling `setAttribute` on the DOM.
- [x] `ElementEngine` provides `get_text`, `get_attribute`, `element_exists`, `count_elements`, and `select_option`.
- [x] `HumanInteractionEngine` provides `press_key` (`Enter`, `Tab`, `Escape`, characters) and `clear_and_type`.
- [x] `CdpSession` exposes tab navigation (`reload`, `go_back`, `go_forward`, `get_url`), `capture_screenshot`, and `get_cookies` / `set_cookies` / `delete_cookies`.

**Verification:**
- [x] Tests pass: `cargo test --manifest-path ../runner/Cargo.toml`
- [x] Build succeeds: `cargo check --manifest-path ../runner/Cargo.toml`

**Dependencies:** Task 1

**Files likely touched:**
- `../runner/src/drivers/cdp/element.rs`
- `../runner/src/drivers/cdp/interaction.rs`
- `../runner/src/drivers/cdp/mod.rs`

**Estimated scope:** Medium (3 files)

---

## Checkpoint: Foundation (After Tasks 1-2)
- [x] `apps/runner` is removed and `tuquet/automa` passes `pnpm run lint` & `pnpm run test:unit`
- [x] `cargo test --manifest-path ../runner/Cargo.toml` passes all CDP unit tests

---

## Task 3: Build `WorkflowDagExecutor` core (Graph parser, Mustache templating, state, and flow-control/package blocks)

**Description:** Create `runner/src/drivers/cdp/workflow.rs` implementing the Automa workflow graph parser (`drawflow.nodes`/`edges` and flat `nodes`/`edges`), runtime state (`variables`, `table`, `loop_stack`, `step_logs`), Mustache template interpolation (`{{variables.x}}`, `{{table.0.col}}`, `{{loopData.loopId}}`, `{{prevBlockData}}`), error policy (`onError`: retry, fallback, continue, error), and pure control-flow / data blocks (`trigger`, `delay`, `conditions`, `while-loop`, `repeat-task`, `loop-data`, `loop-breakpoint`, `block-package`, `insert-data`, `delete-data`, `increase-variable`, `slice-variable`, `regex-variable`, `log-data`, `webhook`).

**Acceptance criteria:**
- [x] Parses both `{ drawflow: { nodes, edges } }` and `{ nodes, edges }` workflow JSON schemas.
- [x] Evaluates Mustache template expressions against `variables`, `table`, `loopData`, and `prevBlockData`.
- [x] Executes control-flow routing (`conditions`, `repeat-task`, `while-loop`, `loop-data`, `block-package` inline subgraph expansion, and `onError` fallback edges) accurately in memory.
- [x] Respects `CancellationToken` at every step boundary.

**Verification:**
- [x] Tests pass: `cargo test --manifest-path ../runner/Cargo.toml workflow`
- [x] Build succeeds: `cargo check --manifest-path ../runner/Cargo.toml`

**Dependencies:** Task 2

**Files likely touched:**
- `../runner/src/drivers/cdp/workflow.rs`
- `../runner/src/drivers/cdp/mod.rs`
- `../runner/src/lib.rs`

**Estimated scope:** Medium (3 files)

---

## Task 4: Implement DOM interaction, data extraction, and browser block handlers in `WorkflowDagExecutor`

**Description:** Connect `WorkflowDagExecutor` to `CdpSession` (via a clean `BrowserAutomationBackend` trait for testability + live `CdpSession` implementation) to execute all browser and DOM blocks: `new-tab`, `active-tab`, `tab-url`, `reload-tab`, `go-back`, `forward-page`, `close-tab`, `link`, `event-click`, `hover-element`, `forms`, `press-key`, `trigger-event`, `element-scroll`, `get-text`, `attribute-value`, `element-exists`, `loop-elements`, `javascript-code`, `take-screenshot`, `cookie`, and `turnstile`.

**Acceptance criteria:**
- [x] All DOM & browser blocks execute via `CdpSession` in `specter_stealth_context` without mutating DOM attributes (`block--*`, `automa-loop`, `automa-id`).
- [x] `loop-elements` iterates over matched elements by index in Rust memory (`loop_stack`) without modifying the page DOM.
- [x] Extracted values from `get-text`, `attribute-value`, `javascript-code`, `tab-url`, and `cookie` save into `variables` and/or `table` columns according to block configuration (`assignVariable`, `variableName`, `saveData`, `dataColumn`).

**Verification:**
- [x] Tests pass: `cargo test --manifest-path ../runner/Cargo.toml`
- [x] Build succeeds: `cargo build --manifest-path ../runner/Cargo.toml`

**Dependencies:** Task 3

**Files likely touched:**
- `../runner/src/drivers/cdp/workflow.rs`
- `../runner/src/drivers/cdp/mod.rs`

**Estimated scope:** Small-Medium (2 files)

---

## Checkpoint: Core Engine (After Tasks 3-4)
- [x] All unit and mock-session DAG tests pass in `runner`
- [x] Multi-node workflows with loops, conditions, packages, and DOM extraction pass verification

---

## Task 5: Wire `WorkflowDagExecutor` into `AutomaDriver` (`runner`) & `JobCoordinator` / `executor.rs` (`cli`)

**Description:** Update [`runner/src/drivers/automa.rs`](file:///C:/Users/ndtu6/Repository/tuquet/runner/src/drivers/automa.rs), [`cli/src/core/browser/worker_coordinator.rs`](file:///C:/Users/ndtu6/Repository/tuquet/cli/src/core/browser/worker_coordinator.rs), [`cli/src/core/engine/job_coordinator.rs`](file:///C:/Users/ndtu6/Repository/tuquet/cli/src/core/engine/job_coordinator.rs), and [`cli/src/commands/automa/executor.rs`](file:///C:/Users/ndtu6/Repository/tuquet/cli/src/commands/automa/executor.rs) to launch Antidetect Chromium with `--remote-debugging-port=0` (and **zero `--load-extension`**), attach `CdpSession::connect_auto`, and execute workflows directly via `WorkflowDagExecutor` while streaming step logs to `AutomaDb` and SSE.

**Acceptance criteria:**
- [x] `AutomaDriver::execute` in `runner/src/drivers/automa.rs` runs workflows in-process via `WorkflowDagExecutor` and `CdpSession` (launching Antidetect Chromium with `--remote-debugging-port=0` if not already attached) and returns populated `AutomaJobOutput` (`variables`, `tables`, `step_logs`).
- [x] `JobCoordinator::submit` and `spc automa run` (`executor.rs`) execute workflows via `WorkflowDagExecutor` over CDP without `--load-extension` and without waiting 30 seconds for extension SSE registration.
- [x] Step logs are persisted to `AutomaDb` and broadcast over `state.tx` (`/api/v1/events`).

**Verification:**
- [x] Tests pass: `cargo test --manifest-path ../runner/Cargo.toml`
- [x] Tests pass: `cargo test --manifest-path ../cli/Cargo.toml`
- [x] Tests pass: `pnpm test` in `tuquet/automa`

**Dependencies:** Task 4

**Files likely touched:**
- `../runner/src/drivers/automa.rs`
- `../cli/src/core/browser/worker_coordinator.rs`
- `../cli/src/core/engine/job_coordinator.rs`
- `../cli/src/commands/automa/executor.rs`

**Estimated scope:** Medium (4 files)

---

## Checkpoint: Complete (After Task 5)
- [x] All acceptance criteria in [`SPEC.md`](file:///C:/Users/ndtu6/Repository/tuquet/automa/SPEC.md) met
- [x] `cargo test` in `runner` and `cli` pass; `pnpm run lint` and `pnpm test` in `automa` pass

---

## Task 6: Standardize Official Automa Package JSON types in `@automa/types`

**Description:** Update [`packages/types/src/blocks/onlineServices.ts`](file:///C:/Users/ndtu6/Repository/tuquet/automa/packages/types/src/blocks/onlineServices.ts) and [`packages/types/src/workflow.ts`](file:///C:/Users/ndtu6/Repository/tuquet/automa/packages/types/src/workflow.ts) to define the complete Official Automa Package schema (`AutomaPackage`, `PackageIO`, `PackageSettings`, `PackageParameter`, `BlockPackageBlockData`) and ergonomic helpers (`definePackage`, `packageToBlockNode`).

**Acceptance criteria:**
- [x] `PackageIO` (`{ id, name, blockId, handleId }`), `PackageSettings` (`{ asBlock?: boolean }`), and `AutomaPackage` match `AutomaApp/automa` (`src/stores/package.js` & `.automa-pkg`) 1:1.
- [x] `BlockPackageBlockData` includes `id`, `name`, `icon`, `description`, `inputs`, `outputs`, `data: { nodes, edges }`, and `settings: { asBlock }`.
- [x] `definePackage()` and `packageToBlockNode()` helpers are exported from `@automa/types` and covered by unit tests.

**Verification:**
- [x] Tests pass: `pnpm run test:unit` (30/30 passed)
- [x] Lint & typecheck succeed: `pnpm run lint && pnpm --filter @automa/types build`

**Dependencies:** Task 5

**Files likely touched:**
- `packages/types/src/blocks/onlineServices.ts`
- `packages/types/src/workflow.ts`
- `tests/unit/package_schema.test.ts`

**Estimated scope:** Small (3 files)

---

## Task 7: Upgrade `block-package` execution in Rust `WorkflowDagExecutor` for Official Automa Multi-I/O Routing

**Description:** Upgrade [`runner/src/drivers/cdp/workflow.rs`](file:///C:/Users/ndtu6/Repository/tuquet/runner/src/drivers/cdp/workflow.rs) so `block-package` supports Official Automa's `handlerBlockPackage.js` behavior: routing incoming `${pkgNodeId}-input-${inputId}` target handles to `data.inputs[].blockId` (without requiring an internal `trigger` node) and mapping internal `data.outputs[].handleId` transitions out to `${pkgNodeId}-output-${output.id}` (including fallback handles when an internal block triggers `onError: fallback`).

**Acceptance criteria:**
- [x] `WorkflowDagExecutor` tracks incoming `target_handle` in the execution queue and passes it to `block-package`.
- [x] `block-package` resolves its entry block via `data.inputs` matching `${pkgNodeId}-input-${inputId}` (falling back to the first `inputs` item, `trigger` node, or root node if unspecified).
- [x] `block-package` maps reached internal output handles (`outputs[].handleId`) to the corresponding package output ID (`outputs[].id`) so the outer workflow follows `${pkgNodeId}-output-${output.id}`.
- [x] Unit tests in `runner/src/drivers/cdp/workflow.rs` verify multi-input, triggerless package execution and multi-output branching (`out_ok` vs `out_fail`).

**Verification:**
- [x] Tests pass: `cargo test --manifest-path ../runner/Cargo.toml` (35/35 passed)

**Dependencies:** Task 6

**Files likely touched:**
- `../runner/src/drivers/cdp/workflow.rs`

**Estimated scope:** Small (1 file)

---

## Task 8: Scaffold `packages/ui` (`@automa/ui`) with Shadcn-Vue, `@vue-flow`, `dagre`, and Canvas Utilities

**Description:** Create `packages/ui` (`@automa/ui` matching [`AGENTS.md`](file:///C:/Users/ndtu6/Repository/tuquet/automa/AGENTS.md) and [`scripts/lint-style-debt.mjs`](file:///C:/Users/ndtu6/Repository/tuquet/automa/scripts/lint-style-debt.mjs)) configured with `@tuquet/vue-ui` (Shadcn-Vue primitives), `@lucide/vue`, `@vue-flow/core`, `@vue-flow/background`, `@vue-flow/minimap`, `dagre`, `block-registry.ts` (metadata, categories, icons, and node component mappings for all Automa blocks), and `canvas-helpers.ts` (`autoAlignNodes`, `copyCanvasElements`, `reconcilePackageHandles`, `addPackageIOHandle`).

**Acceptance criteria:**
- [x] `packages/ui/package.json`, `tsconfig.json`, and `vite.config.ts` are configured to build `@automa/ui`.
- [x] `src/components/ui/index.ts` re-exports Shadcn-Vue primitives from `@tuquet/vue-ui`.
- [x] `src/utils/block-registry.ts` and `src/utils/canvas-helpers.ts` provide complete block metadata and pure graph transformation utilities (topological LR layout, package handle reconciliation, inline vs `asBlock` drop expansion).

**Verification:**
- [x] Build & lint succeed: `pnpm --filter @automa/ui typecheck && pnpm run lint`

**Dependencies:** Task 7

**Files likely touched:**
- `packages/ui/package.json`
- `packages/ui/tsconfig.json`
- `packages/ui/vite.config.ts`
- `packages/ui/src/components/ui/index.ts`
- `packages/ui/src/utils/block-registry.ts`
- `packages/ui/src/utils/canvas-helpers.ts`

**Estimated scope:** Small-Medium (6 files)

---

## Task 9: Implement Shadcn-Vue Flow Node Components (`Block*.vue`) and Shared `WorkflowEditor.vue`

**Description:** Port the Vue Flow node components (`BlockBasic.vue`, `BlockBasicWithFallback.vue`, `BlockConditions.vue`, `BlockDelay.vue`, `BlockElementExists.vue`, `BlockGroup.vue`, `BlockLoopBreakpoint.vue`, `BlockNote.vue`, `BlockPackage.vue`, `BlockRepeatTask.vue`) and the shared canvas editor (`WorkflowEditor.vue`, `EditorSearchBlocks.vue`, `EditorCtxMenu.vue`, `EditorAddPackageDialog.vue`) using 100% Shadcn-Vue components and semantic Tailwind tokens (`bg-card`, `border-border`, `text-foreground`, `text-muted-foreground`).

**Acceptance criteria:**
- [x] `BlockPackage.vue` dynamically renders left target handles (`${id}-input-${input.id}`) and right source handles (`${id}-output-${output.id}`), shows an update indicator when the source package changes, and reconciles connected edges on refresh.
- [x] `EditorCtxMenu.vue` supports node actions (Copy, Paste, Duplicate, Group/Ungroup, Save selection as Package, Execute from block) and Package Handle actions (`Set as package input` / `Set as package output`).
- [x] Zero style debt violations under `node scripts/lint-style-debt.mjs`.

**Verification:**
- [x] Style lint passes: `pnpm run lint:style`

**Dependencies:** Task 8

**Files likely touched:**
- `packages/ui/src/components/canvas/WorkflowEditor.vue`
- `packages/ui/src/components/canvas/blocks/*.vue`
- `packages/ui/src/components/canvas/editor/*.vue`

**Estimated scope:** Medium (15 files)

---

## Task 10: Implement Screen 1 (`AutomaWorkflowCanvas.vue`) & Screen 2 (`AutomaPackageCanvas.vue`) with Shadcn Inspector & Modals

**Description:** Build the 2 top-level canvas screens (`AutomaWorkflowCanvas.vue` and `AutomaPackageCanvas.vue`), Left Block & Package Palette (`EditorBlockPalette.vue`), Right Property Inspector (`BlockEditInspector.vue` with Shadcn form controls + live JSON/Code tab for Agent review), Workflow Modals (`WorkflowTableDialog.vue`, `WorkflowGlobalDataDialog.vue`, `WorkflowSettingsDialog.vue`), and Package Tabs (`PackageSettingsPanel.vue` with I/O handle editor & `asBlock` switch, `PackageDetailsPanel.vue`).

**Acceptance criteria:**
- [x] `<AutomaWorkflowCanvas />` supports dragging blocks and packages (`asBlock: true` -> `BlockPackage` node; `asBlock: false` -> inline unpack), editing block properties, managing `table`/`variables`/`settings`, auto-aligning via topological layout, and saving selected nodes as a new `AutomaPackage`.
- [x] `<AutomaPackageCanvas />` prevents dropping `trigger`, `block-package`, and `execute-workflow`, allows mapping internal block handles to `inputs[]` / `outputs[]` via context menu or `PackageSettingsPanel.vue`, and edits `.automa-pkg` metadata.
- [x] Both screens export cleanly from `packages/ui/src/index.ts`.

**Verification:**
- [x] Build & typecheck pass: `pnpm --filter @automa/ui build && pnpm --filter @automa/ui typecheck`
- [x] Style lint passes: `pnpm run lint`

**Dependencies:** Task 9

**Files likely touched:**
- `packages/ui/src/components/canvas/AutomaWorkflowCanvas.vue`
- `packages/ui/src/components/canvas/AutomaPackageCanvas.vue`
- `packages/ui/src/components/canvas/edit/BlockEditInspector.vue`
- `packages/ui/src/components/canvas/edit/EditBlockSettingsDialog.vue`
- `packages/ui/src/components/canvas/modals/*.vue`
- `packages/ui/src/components/canvas/package/*.vue`
- `packages/ui/src/index.ts`

**Estimated scope:** Medium (10 files)

---

## Task 11: Unit & Component Verification for `@automa/ui` Canvas & Package Workflows

**Description:** Add unit tests in `tests/unit/canvas_package_ui.test.ts` testing `block-registry`, `canvas-helpers` (`autoAlignNodes`, `copyCanvasElements`, `reconcilePackageNodeUpdate`, `addPackageIOHandle`, `dropPackageIntoWorkflow`, `extractPackageFromSelection`), and verify full monorepo build, typecheck, and style debt gates.

**Acceptance criteria:**
- [x] `pnpm run test:unit` passes all tests including the new `@automa/ui` canvas & package helper tests.
- [x] `pnpm run build` and `pnpm run lint` pass with 0 errors and 0 style debt violations.

**Verification:**
- [x] `pnpm run build && pnpm run test:unit && pnpm run lint`

**Dependencies:** Task 10

**Files likely touched:**
- `tests/unit/canvas_package_ui.test.ts`


