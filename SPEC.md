# SPEC: Shadcn-Vue Workflow & Package Canvas (`@automa/ui` in `packages/ui`)

## 1. Objective & Scope Boundary
Port the **2 core visual graph canvas screens (`Workflow Canvas` and `Package Canvas`)** from Official GitHub Automa (`AutomaApp/automa`) into `tuquet/automa/packages/ui` (`@automa/ui`), rebuilt 100% on **Shadcn-Vue (`@tuquet/vue-ui` + Reka UI / Radix Vue)**, **Tailwind CSS semantic tokens**, **`@vue-flow/core`**, **`dagre`**, and **`@automa/types`**.

### 1.1 In-Scope (Strictly 2 Canvas Screens Sharing 1 Core Engine)
1. **Screen 1 — `<AutomaWorkflowCanvas />` (`mode="workflow"`)**:
   - Interactive Vue Flow DAG canvas (`@vue-flow/core`, `@vue-flow/background`, `@vue-flow/minimap`) with `dagre` LR Auto-Align, Zoom/Pan controls, and Node Search popover.
   - **Left Palette Sidebar** with 2 Shadcn `Tabs`:
     - **Blocks Tab**: Categorized Automa blocks (`general`, `browser`, `interaction`, `conditions`, `data`, `onlineServices`) with search filter and drag-and-drop onto canvas/edges/handles.
     - **Packages Tab**: Reusable `AutomaPackage` items with drag-and-drop supporting both `settings.asBlock === true` (inserts encapsulated `BlockPackage` node) and `settings.asBlock === false` (expands internal nodes/edges inline).
   - **Canvas Context Menu (Shadcn `DropdownMenu` / Right-Click Menu)**:
     - Copy, Paste, Duplicate, Group/Ungroup (`blocks-group`), Delete, **Execute from block**, and **Save selection as Package** (opens Shadcn `Dialog` to create an `AutomaPackage`).
   - **Right Inspector Sidebar (Shadcn Sheet/Panel)**:
     - Opens when clicking/editing any node on the canvas.
     - Renders Shadcn-Vue form controls (`Input`, `Select`, `Switch`, `Checkbox`, `Textarea`, `Tabs`) for block parameters (`selector`, `url`, `value`, `conditions`, `variableName`, `dataColumn`, `onError` policy) + a live **JSON / Code Inspector tab** for Agent code review.
   - **Workflow Top Toolbar & Modals (Shadcn `Dialog`)**:
     - **Table Columns Modal** (`WorkflowTableDialog.vue`), **Global Data / Variables Modal** (`WorkflowGlobalDataDialog.vue`), **Workflow Settings Modal** (`WorkflowSettingsDialog.vue`), **Auto-Align**, and **Run / Stop** action triggers.

2. **Screen 2 — `<AutomaPackageCanvas />` (`mode="package"`)**:
   - Reuses the exact same Vue Flow Canvas core and Block Inspector as Screen 1 with `isPackage = true`.
   - Automatically prevents dropping `trigger`, `block-package`, and `execute-workflow` blocks onto the package canvas (matching Official Automa).
   - **Handle Context Menu**: Right-clicking any internal block's input handle (`-input-*`) offers **"Set as package input"** (adds entry to `pkg.inputs`); right-clicking any output handle (`-output-*`) offers **"Set as package output"** (adds entry to `pkg.outputs`).
   - **Package Top Switcher (Shadcn `Tabs`)**:
     - **Tab 1 (`Editor`)**: The visual DAG canvas and block palette.
     - **Tab 2 (`I/O & Settings`)**: Shadcn form to rename/reorder/remove `inputs[]` and `outputs[]` (`PackageIOSelect`), toggle `settings.asBlock` (`Switch`), and edit `name`, `icon`, `description`.
     - **Tab 3 (`Details / JSON`)**: Documentation (`content`) and full `.automa-pkg` JSON inspector.

### 1.2 Out-of-Scope (Explicitly Excluded)
- ❌ All list/CRUD management pages (`pages/Workflows.vue`, `pages/Packages.vue`, `pages/Home.vue`, `pages/Storage.vue`, `pages/Logs.vue`, `pages/Schedule.vue`, `pages/Teams.vue`) — already handled by `@tuquet/admin-web` and `specter` CLI.
- ❌ Legacy UI primitives from `AutomaApp/automa` (`src/components/ui/Ui*.vue`, `v-remixicon`, hardcoded `bg-gray-*` classes) — replaced 100% by **Shadcn-Vue (`@tuquet/vue-ui`)** and **`@lucide/vue`**.
- ❌ Legacy Chrome Extension scripts (`src/background`, `src/content`, `src/popup`) — already replaced by the Native Rust CDP Engine (`WorkflowDagExecutor`).

---

## 2. Package Architecture (`packages/ui` — `@automa/ui`)

```text
packages/ui/
├── package.json                 # "@automa/ui" exporting Canvas screens, blocks, & stores
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── index.ts                 # Public exports: AutomaWorkflowCanvas, AutomaPackageCanvas, BlockPackage, etc.
    ├── components/
    │   ├── ui/
    │   │   └── index.ts         # Re-exports Shadcn-Vue primitives from @tuquet/vue-ui
    │   └── canvas/
    │       ├── AutomaWorkflowCanvas.vue   # Screen 1: Workflow Canvas
    │       ├── AutomaPackageCanvas.vue    # Screen 2: Package Canvas
    │       ├── WorkflowEditor.vue         # Shared @vue-flow/core + MiniMap + Background + Controls
    │       ├── blocks/                    # Custom Vue Flow Node Components (Shadcn-styled)
    │       │   ├── BlockBasic.vue
    │       │   ├── BlockBasicWithFallback.vue
    │       │   ├── BlockConditions.vue
    │       │   ├── BlockDelay.vue
    │       │   ├── BlockElementExists.vue
    │       │   ├── BlockGroup.vue
    │       │   ├── BlockLoopBreakpoint.vue
    │       │   ├── BlockNote.vue
    │       │   ├── BlockPackage.vue       # Dynamic inputs/outputs handles + version sync
    │       │   └── BlockRepeatTask.vue
    │       ├── editor/
    │       │   ├── EditorCustomEdge.vue
    │       │   ├── EditorSearchBlocks.vue
    │       │   ├── EditorCtxMenu.vue
    │       │   ├── EditorAddPackageDialog.vue
    │       │   └── EditorBlockPalette.vue
    │       ├── edit/
    │       │   ├── BlockEditInspector.vue # Right-hand Shadcn property sheet + JSON tab
    │       │   └── EditBlockSettingsDialog.vue # Per-block onError / retry settings
    │       ├── modals/
    │       │   ├── WorkflowTableDialog.vue
    │       │   ├── WorkflowGlobalDataDialog.vue
    │       │   └── WorkflowSettingsDialog.vue
    │       └── package/
    │           ├── PackageSettingsPanel.vue
    │           └── PackageDetailsPanel.vue
    └── utils/
        ├── block-registry.ts    # Metadata, categories, icons, and component mapping for all blocks
        └── canvas-helpers.ts    # dagre auto-align, copyElements, handle reconciliation
```

---

## 3. Design & Quality Guardrails (Enforced by `scripts/lint-style-debt.mjs`)
1. **100% Semantic Shadcn Tokens**:
   - Only use `bg-background`, `bg-card`, `bg-muted`, `bg-accent`, `text-foreground`, `text-muted-foreground`, `border-border`, `border-input`.
   - Zero `bg-gray-*`, `text-gray-*`, `border-gray-*`, `bg-box-transparent`, or raw hex colors in templates.
2. **Typography & Control Sizing**:
   - Minimum font size is `12px` (`text-xs`, `text-sm`, `text-base`). Zero `text-[10px]` or `text-[11px]`.
   - Control heights strictly follow Shadcn scale (`h-7`, `h-8`, `h-9`, `h-10`).
   - Dialog/Sheet headers are unconditionally left-aligned (`text-left`).
3. **Bi-Directional Agent <-> Visual Canvas Compatibility**:
   - Both `<AutomaWorkflowCanvas />` and `<AutomaPackageCanvas />` accept strongly-typed `v-model` (`Workflow` and `AutomaPackage` from `@automa/types`) so any workflow or package generated by an AI Agent via `defineWorkflow()` / `definePackage()` renders immediately on the canvas and can be auto-aligned via `dagre`.

---

## 4. Acceptance Criteria & Verification
1. **Build & Typecheck**: `pnpm --filter @automa/ui build` and `pnpm --filter @automa/ui typecheck` pass with 0 errors.
2. **Style Debt Gate**: `pnpm run lint` (including `node scripts/lint-style-debt.mjs` scanning `packages/ui/src`) passes with **0 violations**.
3. **Unit & Component Tests**: `pnpm run test:unit` verifies:
   - Rendering and event contracts of `AutomaWorkflowCanvas` and `AutomaPackageCanvas`.
   - `BlockPackage` dynamic `inputs` / `outputs` handle rendering and `updatePackage` edge reconciliation.
   - `PackageCanvas` blocking forbidden blocks (`trigger`, `block-package`, `execute-workflow`) and registering `inputs` / `outputs` via handle context menu.
   - `dagre` auto-alignment and `Save to Package` extraction.
