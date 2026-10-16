# Implementation Plan: Native Rust CDP Workflow Engine (Extensionless Automa Runner)

## Overview
We are replacing the legacy Chrome Extension runner (`apps/runner`) with a **100% Native Rust CDP Workflow Engine** inside [`runner/src/drivers/cdp/`](file:///C:/Users/ndtu6/Repository/tuquet/runner/src/drivers/cdp/mod.rs) (`specter-runner`) and wiring it directly into [`AutomaDriver`](file:///C:/Users/ndtu6/Repository/tuquet/runner/src/drivers/automa.rs) and [`cli`](file:///C:/Users/ndtu6/Repository/tuquet/cli) (`JobCoordinator` & `spc automa run`). We are also removing the obsolete `apps/runner` extension directory and build tasks from `tuquet/automa`.

## Architecture Decisions
- **Pure Rust DAG Execution over Stealth CDP (`WorkflowDagExecutor`)**:
  - Instead of booting an extension background service worker and injecting `contentScript.bundle.js` into every web page, [`runner/src/drivers/cdp/workflow.rs`](file:///C:/Users/ndtu6/Repository/tuquet/runner/src/drivers/cdp/workflow.rs) walks the Automa workflow graph (`drawflow.nodes` + `drawflow.edges` or flat `nodes` + `edges`) directly in Rust.
- **Zero-Bleed DOM Queries (`specter_stealth_context`)**:
  - All DOM queries (`get-text`, `attribute-value`, `element-exists`, `forms`, `loop-elements`, `javascript-code`) execute inside [`StealthEngine`](file:///C:/Users/ndtu6/Repository/tuquet/runner/src/drivers/cdp/stealth.rs)'s `Page.createIsolatedWorld` (`specter_stealth_context`).
  - Element loops (`loop-elements`) track element indices in Rust memory (`loop_stack`) rather than mutating the target DOM with `setAttribute('automa-loop', ...)` or `setAttribute('block--id', ...)`.
- **Hardware-Level `isTrusted: true` Interactions**:
  - Clicks, hovers, typing, key presses, and scrolling use [`HumanInteractionEngine`](file:///C:/Users/ndtu6/Repository/tuquet/runner/src/drivers/cdp/interaction.rs) (`Input.dispatchMouseEvent` along Cubic Bezier trajectories and `Input.dispatchKeyEvent`).
- **Dynamic Port Discovery via `DevToolsActivePort` (`--remote-debugging-port=0`)**:
  - [`worker_coordinator.rs`](file:///C:/Users/ndtu6/Repository/tuquet/cli/src/core/browser/worker_coordinator.rs) and [`AutomaDriver`](file:///C:/Users/ndtu6/Repository/tuquet/runner/src/drivers/automa.rs) launch Antidetect Chromium with **zero `--load-extension` flags** and attach directly via [`CdpSession::connect_auto`](file:///C:/Users/ndtu6/Repository/tuquet/runner/src/drivers/cdp/mod.rs#L58-L76).
- **Complete Removal of `apps/runner`**:
  - Delete `apps/runner` from `tuquet/automa` and clean up `package.json` and `turbo.json`.

## Dependency Graph
```text
Task 1: Purge legacy Chrome Extension `apps/runner` from `tuquet/automa`
    │
Task 2: Extend `ElementEngine`, `HumanInteractionEngine`, & `CdpSession` (DOM extraction, XPath/index selectors, tabs, cookies, screenshots, keys)
    │
Task 3: Implement Rust `WorkflowDagExecutor` core (Graph parser, Mustache templating, variables/table state, control-flow & package blocks)
    │
Task 4: Implement Rust DOM & Browser Block Handlers in `WorkflowDagExecutor` (click, forms, get-text, attribute-value, element-exists, loop-elements, screenshot, cookie, turnstile, webhook)
    │
Task 5: Wire `WorkflowDagExecutor` into `AutomaDriver` (`runner`) & `JobCoordinator` / `executor.rs` (`cli`) without `--load-extension`
```

## Task List

### Phase 1: Foundation & Extension Purge
- [x] **Task 1**: Purge legacy Chrome Extension `apps/runner` from `tuquet/automa`
- [x] **Task 2**: Extend `CdpSession`, `ElementEngine`, and `HumanInteractionEngine` for full workflow operations

### Checkpoint: Foundation
- [x] `pnpm run lint` and `pnpm test:unit` pass in `tuquet/automa` (0 style debt, 28/28 unit tests passed)
- [x] `cargo test --manifest-path ../runner/Cargo.toml` passes with new CDP capabilities

### Phase 2: Native Rust Workflow DAG Engine
- [x] **Task 3**: Build `WorkflowDagExecutor` core (Graph parser, Mustache templating, state, and flow-control/package blocks)
- [x] **Task 4**: Implement DOM interaction, data extraction, and browser block handlers in `WorkflowDagExecutor`

### Checkpoint: Core Engine
- [x] `cargo test --manifest-path ../runner/Cargo.toml` passes unit & integration tests for DAG execution, templating, loops, conditions, packages, and error fallback (34/34 passed)

### Phase 3: End-to-End Integration in `runner` & `cli`
- [x] **Task 5**: Wire `WorkflowDagExecutor` into `runner/src/drivers/automa.rs` and `cli` (`job_coordinator.rs`, `worker_coordinator.rs`, `executor.rs`)

### Checkpoint: Complete
- [x] `cargo test --manifest-path ../runner/Cargo.toml` (34/34 passed) and `cargo test --manifest-path ../cli/Cargo.toml` (152/152 passed)
- [x] `pnpm run lint` and `pnpm run test:unit` in `tuquet/automa` pass (28/28 passed)

### Phase 4: Official Automa Package (`.automa-pkg` & `block-package`) Schema & Multi-I/O Execution
- [x] **Task 6**: Standardize Official Automa Package JSON types (`AutomaPackage`, `PackageIO`, `PackageSettings`, `BlockPackageBlockData`, `definePackage`, `packageToBlockNode`) in `@automa/types`
- [x] **Task 7**: Upgrade `block-package` execution in Rust `WorkflowDagExecutor` (`runner/src/drivers/cdp/workflow.rs`) for Official Automa multi-input (`inputs[].id -> blockId`) and multi-output (`outputs[].handleId -> ${pkgId}-output-${output.id}`) routing without requiring an internal `trigger` node

### Phase 5: Shadcn-Vue Workflow & Package Canvas (`@automa/ui` in `packages/ui`)
- [x] **Task 8**: Scaffold `packages/ui` (`@automa/ui`) with Shadcn-Vue (`@tuquet/vue-ui`), `@lucide/vue`, block registry metadata, and topological layout / package helper utilities
- [x] **Task 9**: Implement Shadcn-styled Vue Flow Node Components (`BlockBasic`, `BlockBasicWithFallback`, `BlockConditions`, `BlockDelay`, `BlockElementExists`, `BlockGroup`, `BlockLoopBreakpoint`, `BlockNote`, `BlockPackage`, `BlockRepeatTask`) and `WorkflowEditor.vue` (`EditorSearchBlocks`, `EditorCtxMenu`, `EditorAddPackageDialog`)
- [x] **Task 10**: Implement Screen 1 (`AutomaWorkflowCanvas.vue`) & Screen 2 (`AutomaPackageCanvas.vue`) with Shadcn-Vue Block Palette, Property Inspector (`BlockEditInspector.vue` + JSON/Code Review Tab), Workflow Modals (`Table`, `GlobalData`, `Settings`), and Package I/O Settings (`PackageSettingsPanel.vue`, `PackageDetailsPanel.vue`)
- [x] **Task 11**: Add unit/component tests for `@automa/ui` Canvas & Package I/O workflows and pass all build, typecheck, and `lint-style-debt.mjs` gates

## Risks and Mitigations
| Risk | Impact | Mitigation |
|------|--------|------------|
| Both `drawflow.nodes` and top-level `nodes` formats exist in workflow JSON files | High | Support both `workflow.drawflow.nodes/edges` and top-level `workflow.nodes/edges` seamlessly in the Rust parser. |
| Indexed elements in `loop-elements` shifting or using XPath vs CSS | Medium | Support both CSS (`querySelectorAll`) and XPath (`document.evaluate`) with an optional `index` parameter inside `ElementEngine` in the Isolated World without mutating DOM attributes. |
| Orphaned Chromium processes on timeout or cancellation | High | Check `CancellationToken` before every block and supervise browser processes via `BrowserLauncher` / `ProcessSupervisor`. |
| Official Automa packages (`block-package`) omit internal `trigger` nodes and use custom `inputs`/`outputs` handle mappings | High | Route incoming `${pkgId}-input-${inputId}` edges to `inputs[].blockId` and map internal `outputs[].handleId` transitions out to `${pkgId}-output-${output.id}` in `WorkflowDagExecutor`. |
| Legacy Automa CSS classes (`bg-gray-*`, `bg-box-transparent`, sub-12px fonts) fail `scripts/lint-style-debt.mjs` | High | Build all Canvas, Block, and Inspector components strictly with Shadcn-Vue semantic tokens (`bg-card`, `bg-muted`, `border-border`, `text-foreground`, `text-muted-foreground`, `h-8`/`h-9`). |

## Open Questions
- None (All questions resolved).



