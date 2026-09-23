---
name: automa-monorepo
description: Monorepo package architecture, Turborepo DAG dependency invariants, workspace package resolution (packages/types, packages/ui), build and lint verification workflows, Windows file lock handling, and git proxy operations. Activate when modifying monorepo structure, package dependencies, turbo.json, or running workspace builds.
---

# Automa Monorepo Architecture & Orchestration (`automa-monorepo`)

Architecture guide, package hierarchy, Turborepo DAG rules, and build verification workflows for the Tuquet Automa Monorepo.

---

## 1. 🧭 Canonical Package Architecture

The monorepo contains 2 applications and 3 shared packages:

- `apps/core`: Rust Axum Daemon, CDP Orchestrator, SQLite engine.
- `apps/webe`: Web Studio Standalone (`dist/studio`) and Headless Runner (`dist/cli-runner`).
- `packages/types`: OpenAPI spec (`openapi.json`) and generated TypeScript Client SDK (`@automa/types`).
- `packages/ui`: 19 Atomic Shadcn-Vue primitives and 6 Pinia domain stores (`@automa/ui`).
- `packages/webextension-polyfill`: Cross-browser extension polyfills.

> [!IMPORTANT]
> **Directory Naming Invariant**: Always use `packages/types` and `packages/ui` for folder paths. The npm package names remain `@automa/types` and `@automa/ui` via `workspace:*`.

---

## 2. ⚡ Turborepo DAG Dependency Invariants

When an application contains sub-build tasks (such as `build:runner` and `build:studio` in `@automa/webe`) that consume internal packages (`@automa/ui`, `@automa/types`) exporting from compiled `dist/`:

- Sub-build tasks MUST declare `"dependsOn": ["^build"]` in `turbo.json`.
- Without `"^build"`, Turborepo launches sub-build tasks in parallel before package build artifacts exist, causing bundler resolution errors (e.g., `Rolldown failed to resolve import "@automa/ui"`).

```json
"build:runner": {
  "dependsOn": ["^build"],
  "outputs": ["dist/cli-runner/**", "build-zip/runner.zip"]
}
```

---

## 3. 🛡️ Windows File Handle Lock Workarounds

- Background daemons (Turborepo, language servers) frequently lock files inside `.turbo/`.
- Direct `Rename-Item` on package directories on Windows can trigger `Access is denied`.
- **Resolution**: Clear `.turbo` caches or create target directory and move contents before removing the old folder.

---

## 4. 🧪 Build & Lint Verification Runbook

Always verify monorepo integrity after modifying packages or configs:

```bash
# 1. Full Monorepo Build (respecting DAG order)
pnpm run build

# 2. Lint & Style Debt Check (Biome + ESLint + Zero Technical Debt)
pnpm run lint

# 3. Unit & Integration Tests
pnpm test
```

---

## 5. 🌐 Git SOCKS5 Proxy Operations

Outbound port blocking on this workstation requires routing Git push traffic through local SOCKS5 proxy:

```powershell
git config --local http.proxy socks5://127.0.0.1:1080
git config --local https.proxy socks5://127.0.0.1:1080
```
