---
name: automa-monorepo
description: Monorepo architecture, Turborepo DAG invariants, workspace package resolution (packages/types, packages/ui), build/lint/test verification, real-time log tracking, and 4-step cleanup SOP. Activate when managing monorepo structure, running builds, debugging orchestrator logs, or cleaning repo artifacts.
---

# Automa Monorepo Architecture, Operations & Maintenance (`automa-monorepo`)

The comprehensive operational runbook for package architecture, build orchestration, real-time log diagnostics, and maintenance cleanup in the Tuquet Automa Monorepo.

---

## 1. 🧭 Canonical Package Architecture

The monorepo contains 2 applications and 3 shared packages:

- `apps/core`: Rust Axum Daemon, CDP Orchestrator, SQLite database engine (`AutomaDb`).
- `apps/webe`: Web Studio Standalone (`dist/studio`) and Headless Runner (`dist/cli-runner`).
- `packages/types`: OpenAPI spec (`openapi.json`) and auto-generated TypeScript Client SDK (`@automa/types`).
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

## 3. 🧪 Build & Lint Verification Runbook

Always verify monorepo integrity after modifying packages or configs:

```bash
# 1. Full Monorepo Build (respecting DAG order)
pnpm run build

# 2. Lint & Style Debt Check (Biome + ESLint + Zero Technical Debt)
pnpm run lint

# 3. Unit & Integration Tests (Webe, UI, Strict Schema)
pnpm test
```

---

## 4. 🔍 Real-Time Diagnostics & Log Tracing (`.automa/logs/`)

When troubleshooting system errors or diagnosing dev orchestrator runs (`pnpm run dev`):

### Log Sources:
- **`dev-errors.log`** (`.automa/logs/dev-errors.log`): Unified diagnostic error & warning cards with service tags and breadcrumbs. **Inspect this file first**.
- **`dev-all.log`** (`.automa/logs/dev-all.log`): Full aggregated stdout/stderr logs from all orchestrated sub-processes.

### Service Prefix Index:
- `[CORE]`: Rust Core Daemon (`automa-core` Axum server on port `8765`).
- `[STUDIO]`: Web Studio Standalone (`apps/webe` Vite dev server on port `5173`).
- `[RUNNER]`: Web Extension headless runner (`apps/webe` Vite build watch).
- `[DOCS]`: Scalar OpenAPI documentation server (`http://127.0.0.1:8767`).
- `[DESK]` / `[VSCE]`: Standalone host shells (Desktop Tauri v2 / VS Code Extension webview).

### Diagnostic Steps:
1. View latest errors in `.automa/logs/dev-errors.log` (press `e` in Dev Orchestrator).
2. Filter by service prefix to isolate the failing component.
3. Check for common port 8765 collisions or Windows file lock issues (`cargo watch` rebuild while `automa-core.exe` is running).

---

## 5. 🧹 4-Step SOP Repository Cleanup & Whitelist Protection

When cleaning temporary files, scratch artifacts, or optimizing repository size:

### Danh Mục Bảo Vệ Tuyệt Đối (PROTECTED WHITELIST - CẤM XÓA):
1. **`apps/webe/src/utils/getPassKey.js`**: Khóa mã hóa bắt buộc để Vite biên dịch `apps/webe` và runner.
2. **`.changeset/*.md`**: Lịch sử release phân tán của packages & apps.
3. **Các file cấu hình cốt lõi**: `pnpm-workspace.yaml`, `pnpm-lock.yaml`, `turbo.json`, `Cargo.lock`, `Cargo.toml`, `.vscode/*`, `biome.json`.
4. **Các tệp mã nguồn trong `src/`**: Tuyệt đối không xóa nếu chưa đối chiếu grep references.

### 4 Bước Chuẩn (SOP):
1. **Quét & Phát hiện (Discovery)**: Dùng `find_by_name` quét `*.vsix`, `*.log`, `*/scratch`.
2. **Kiểm tra An toàn (Cross-Check)**: Dùng `grep_search` kiểm tra references trong code.
3. **Báo cáo (Dry-Run)**: Liệt kê danh sách file dự kiến xóa.
4. **Thực thi & Kiểm định (Purge & Test)**: Xóa file và chạy `pnpm run lint` + `pnpm run build` để xác nhận hệ sinh thái hoạt động bình thường.

---

## 6. 🛡️ Windows File Handle Lock Guardrails

- Background daemons (Turborepo, language servers) frequently lock files inside `.turbo/`.
- Direct `Rename-Item` on package directories on Windows can trigger `Access is denied`.
- **Resolution**: Clear `.turbo` caches or create target directory and move contents before removing the old folder.

---

## 7. 🌐 Git SOCKS5 Proxy Operations

Outbound port blocking on this workstation requires routing Git push traffic through local SOCKS5 proxy:

```powershell
git config --local http.proxy socks5://127.0.0.1:1080
git config --local https.proxy socks5://127.0.0.1:1080
```
