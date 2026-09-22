# 🖥️ Automa Desk (`automa-desk`)

**Automa Desk** (`@automa/desk`) là ứng dụng Desktop Native đa nền tảng (Windows, macOS, Linux) thuộc hệ sinh thái **Automa Automation Ecosystem**. Được xây dựng trên nền tảng **Tauri v2**, **Vue 3.5**, **Tailwind CSS v4**, **Pinia**, và **TypeScript**, Automa Desk mang lại trải nghiệm điều phối tự động hóa mượt mà, độc lập với trình duyệt và tích hợp trực tiếp với **Automa Core Daemon** (`:8765`).

---

## 🏛️ Kiến Trúc Tổng Quan (3-Layer Clean Architecture & Vertical Slicing)

Ứng dụng tuân thủ nghiêm ngặt **Senior Clean Architecture** kết hợp **Feature-Driven Vertical Slicing**:

```text
+---------------------------------------------------------------------------------------------------+
| 1. PRESENTATION & LAYOUT SHELL (Vue 3.5 + Tailwind v4 + Pinia)                                    |
|    - Custom Frameless Titlebar (data-tauri-drag-region, Daemon Health Badge, Native Controls)     |
|    - Navigation Sidebar (Studio, Browsers, Storage, History, Settings)                            |
|    - Command Palette (Ctrl+K / Cmd+K Fuzzy Search Dialog)                                         |
+-------------------------------------------------+-------------------------------------------------+
                                                  │
                 ┌────────────────────────────────┴────────────────────────────────┐
                 │                                                                 │
+----------------v--------------------------------+ +------------------------------v----------------+
| 2. FEATURE SLICES (Vertical Modules)            | | 3. INFRASTRUCTURE & ADAPTERS LAYER           |
|    - features/studio/ (Canvas Embed, FSM, Logs) | |    - infrastructure/api/ (OpenAPI Client)     |
|    - features/browsers/ (Anti-Detect Profiles)  | |    - infrastructure/sse/ (SSE Event Stream)   |
|    - features/storage/ (SQLite Tables & Secrets)| |    - infrastructure/tauri/ (Window & IPC)     |
|    - features/history/ (Job Audit Traces)       | |    - core/types/ (FSM & Bridge Contracts)     |
+-------------------------------------------------+ +-----------------------------------------------+
                                                  │
                 ┌────────────────────────────────┴────────────────────────────────┐
                 │ Type-Safe REST / SSE / WS Bridge                                │
+----------------v-----------------------------------------------------------------v----------------+
| 4. BACKEND & RUNTIME DAEMON (Automa Core Daemon - Port 8765)                                      |
|    - REST API (63 Endpoints)  - SQLite Global Storage  - Chromium Anti-Detect Process Manager     |
|    - Headless Runner          - Web Studio Static Host (/studio/)                                 |
+---------------------------------------------------------------------------------------------------+
```

## Tech Stack

| Technology | Version |
| :--- | :--- |
| Vue | v3 |
| Vite | v8 |
| TypeScript | v6 |
| Tailwind CSS | v4 |
| Vue Router | v5 |
| Pinia | v4 |
| ESLint | v10 |
| Biome | v2 |

---

## 🌐 Bảng Địa Chỉ URL & Cổng Giao Tiếp Khi Phát Triển (Dev Endpoints & URLs)

Khi khởi chạy môi trường phát triển toàn bộ hệ sinh thái (`pnpm run dev:all` hoặc chạy riêng lẻ `pnpm -F @automa/desk run dev`), các cổng giao tiếp và dịch vụ kết nối bao gồm:

| Dịch Vụ / Giao Diện | Địa Chỉ URL Khi Dev | Giao Thức & Mô Tả |
| :--- | :--- | :--- |
| 🖥️ **Automa Desk Frontend** | **`http://localhost:1420`** | Giao diện Desktop Vite Dev Server (HMR, Vue DevTools). |
| ⚙️ **Automa Core Daemon** | **`http://127.0.0.1:8765`** | Rust Backend Daemon (HTTP REST RESTful API). |
| 🎨 **Web Studio Canvas Embed** | **`http://127.0.0.1:8765/studio/`** | Visual Workflow Canvas standalone phục vụ trực tiếp từ `apps/webe/dist/studio`. |
| 📡 **Server-Sent Events (SSE)** | **`http://127.0.0.1:8765/api/v1/events`** | Luồng 1 chiều stream log thời gian thực (`task:log`) và tiến độ node (`JOB_PROGRESS`). |
| ⚡ **WebSocket Control** | **`ws://127.0.0.1:8765/api/v1/ws`** | Kênh 2 chiều độ trễ thấp điều khiển: `PAUSE_JOB`, `RESUME_JOB`, `KILL_JOB`. |
| 📑 **Swagger UI (OpenAPI Docs)** | **`http://127.0.0.1:8765/swagger-ui`** | Giao diện tài liệu tương tác OpenAPI v3 trực quan. |
| 📄 **OpenAPI Spec (JSON)** | **`http://127.0.0.1:8765/api-docs/openapi.json`** | Bản đặc tả OpenAPI JSON 3.1.0 dùng để sinh Typed SDK (`@automa/types/api`). |

---

## 🛡️ Các Đặc Quyền & Invariants Bắt Buộc

1. **Custom Frameless Titlebar**:
   - Cấu hình `"decorations": false` trong `tauri.conf.json`.
   - Vùng kéo thả cửa sổ mang thuộc tính `data-tauri-drag-region`.
   - Tất cả nút tương tác (Minimize, Maximize/Restore, Close, Theme Toggle, Command Palette) mang class `no-drag`.
   - Hỗ trợ Double-Click trên Titlebar để toggle Maximize (`appWindow.toggleMaximize()`).
2. **Nhúng Reusable Web Studio (`dist/studio`)**:
   - Nhúng trực tiếp bản build Web Studio Canvas từ `apps/webe` thông qua Iframe host bridge hai chiều an toàn.
   - Tuyệt đối không sao chép hoặc duplicate mã nguồn canvas giữa các ứng dụng.
3. **Tuân Thủ Máy Trạng Thái Nút Bấm (Event-Driven FSM)**:
   - Toàn bộ nút bấm thực thi (`btn.workflow.run`, `btn.workflow.stop`, `btn.workflow.save`, `btn.workflow.lint`) tuân thủ máy trạng thái hữu hạn FSM theo [SRS Button Business Logic](../../docs/srs/SRS_HORIZONTAL_BUTTONS.md).
   - Zero-Dummy UI: 100% nút bấm kết nối với OpenAPI handlers và hiển thị trạng thái loading / spinner rõ ràng.
4. **Command Palette (`Ctrl+K` / `Cmd+K`)**:
   - Hộp thoại tìm kiếm mờ (Fuzzy Search) hỗ trợ điều hướng tức thì giữa các phân vùng (`Studio`, `Browsers`, `Storage`, `History`, `Settings`) và đổi Theme.

---

## 📁 Cấu Trúc Thư Mục Chuẩn Senior

```text
apps/desk/
├── src/
│   ├── app/                              # 1. Application Layer (Router, Global Styles, Root App)
│   │   ├── App.vue                       # Mount MainAppLayout
│   │   └── router/index.ts               # Feature routes: /studio, /browsers, /storage, /history, /settings
│   │
│   ├── core/                             # 2. Domain Layer: Pure Business Models & Contracts (Zero UI dependencies)
│   │   ├── types/
│   │   │   ├── fsm.ts                    # Finite State Machine types (IDLE, VALIDATING, DISPATCHING, EXECUTING)
│   │   │   └── bridge.ts                 # Host <-> Studio iframe message contracts
│   │   └── constants/
│   │       └── daemon.ts                 # Invariants (port 8765, timeouts, URLs)
│   │
│   ├── infrastructure/                   # 3. Infrastructure & Adapters Layer (Ports & Adapters)
│   │   ├── api/client.ts                 # OpenAPI SDK client wrapper (@automa/types/api)
│   │   ├── sse/sse-client.ts             # Reconnecting SSE subscriber (/api/v1/events)
│   │   └── tauri/window.ts               # Tauri v2 Native Bridge (Window controls, Drag region)
│   │
│   ├── features/                         # 4. Vertical Slices (High Cohesion, Self-Contained Domain Modules)
│   │   │
│   │   ├── studio/                       # 🎨 Feature: Automa Web Studio Canvas Embed
│   │   │   ├── components/
│   │   │   │   ├── StudioActionHeader.vue# Action bar (Run/Stop FSM, Save, Lint, Browser picker)
│   │   │   │   ├── StudioCanvasEmbed.vue # Secure Iframe wrapper with host-bridge
│   │   │   │   └── ExecutionConsole.vue  # Live SSE log console drawer
│   │   │   ├── composables/
│   │   │   │   ├── useStudioBridge.ts    # Bi-directional postMessage sync (automa:workflow-changed)
│   │   │   │   ├── useStudioExecution.ts # Event-driven Run/Stop FSM engine
│   │   │   │   └── useStudioWorkflow.ts  # AST loading, dirty state tracker, storage sync
│   │   │   ├── stores/useStudioStore.ts  # Feature-scoped Pinia store
│   │   │   └── StudioView.vue            # Studio Main View (Default Route)
│   │   │
│   │   ├── browsers/BrowsersView.vue     # 🌐 Feature: Anti-Detect Virtual Browser Manager
│   │   ├── storage/StorageView.vue       # 🗄️ Feature: Global SQLite Storage (Tables/Variables/Secrets)
│   │   ├── history/HistoryView.vue       # 📋 Feature: Telemetry & Execution History
│   │   ├── settings/SettingsView.vue     # ⚙️ Feature: System Settings & Matrix
│   │   └── command-palette/              # ⌨️ Feature: Desktop Command Palette (Ctrl+K)
│   │       └── components/CommandPaletteDialog.vue
│   │
│   └── shared/                           # 5. Shared Presentation & Design System
│       ├── layouts/MainAppLayout.vue     # Frameless Window Shell + AppSidebar + Viewport
│       ├── components/
│       │   ├── AppTitleBar.vue           # Frameless Titlebar (Drag region, Daemon indicator, Window buttons)
│       │   ├── AppSidebar.vue            # Navigation sidebar (Studio, Browsers, Storage, History, Settings)
│       │   ├── StatusBadge.vue           # Status badge (Online/Offline/Executing)
│       │   └── BaseButton.vue            # Accessible Button with FSM states, testid, loading spinner
│       └── composables/
│           ├── useDarkMode.ts            # Theme management (Dark/Light)
│           └── useDaemonHealth.ts        # Daemon heartbeat health checker
│
├── src-tauri/                            # Rust Tauri v2 Backend Shell
│   ├── capabilities/                     # Tauri Security & Permissions
│   ├── src/                              # Rust Native Handlers & State
│   └── tauri.conf.json                   # Desktop Window & CSP Configuration
│
└── tests/
    ├── unit/                             # 122/122 Vitest Isolated Unit Tests
    │   ├── studio/                       # Studio FSM & Bridge Tests
    │   └── ...
    └── e2e/                              # Playwright Desktop E2E Tests
```

---

## 🛠️ Lệnh Phát Triển & Kiểm Thử (Commands)

### Chạy ứng dụng khi phát triển:
```bash
# 1. Chạy Desktop App ở chế độ Dev (Tauri v2 + Vite HMR)
pnpm -F @automa/desk run dev
# hoặc
cargo tauri dev

# 2. Chạy riêng Frontend Webview (Vite server tại localhost:1420)
pnpm -F @automa/desk run dev
```

### Kiểm thử chất lượng & Linter:
```bash
# Chạy bộ kiểm thử Unit Tests (122 tests)
pnpm -F @automa/desk run test:unit

# Kiểm tra kiểu TypeScript (0 errors)
pnpm -F @automa/desk run typecheck

# Kiểm tra Linter & Code Style (Biome + ESLint)
pnpm -F @automa/desk run lint
pnpm -F @automa/desk run lint:fix
```

### Đóng gói ứng dụng Desktop (Production Build):
```bash
cargo tauri build
```

---

## 📚 Tài Liệu Kỹ Thuật Liên Quan

- ⚡ [**SRS Button Business Logic & Event-Driven Schema**](../../docs/srs/SRS_HORIZONTAL_BUTTONS.md)
- 📘 [**Hướng Dẫn Tích Hợp & Triển Khai Automa Core OpenAPI**](../../docs/OPENAPI_INTEGRATION_GUIDE.md)
- 🌐 [**Trung Tâm Tài Liệu Hệ Sinh Thái (Documentation Hub)**](../../docs/Home.md)
- ⚙️ [**Automa Core (Rust Daemon README)**](../core/README.md)
