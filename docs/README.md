# 📚 Automa Ecosystem Documentation & Knowledge Base (Hub)

Chào mừng bạn đến với trung tâm tài liệu toàn diện của **Automa Ecosystem**.

Hệ thống tài liệu được chuẩn hóa và quản trị theo mô hình **Ma Trận Đặc Tả 2 Chiều (2D Matrix Specification Hub)** kết nối trực tiếp giữa **Tiêu Chuẩn Kỹ Thuật Ngang (Horizontal Standards)** và **Đặc Tả Nghiệp Vụ Dọc Từng Màn Hình (Vertical Menu SRS)**.

---

## 🏛️ HỆ THỐNG ĐẶC TẢ SRS MA TRẬN 2 CHIỀU (2D MATRIX SPECIFICATION HUB)

> 📍 **Trung tâm điều hướng đặc tả chính**: [**`docs/srs/README.md`**](./srs/README.md)

```
                       ┌───────────────────────────────────────────────────────────┐
                       │   AUTOMA ECOSYSTEM: 2D MATRIX SPECIFICATION ARCHITECTURE  │
                       └─────────────────────────────┬─────────────────────────────┘
                                                     │
               ┌─────────────────────────────────────┴─────────────────────────────────────┐
               ▼                                                                           ▼
   [ TIÊU CHUẨN KỸ THUẬT NGANG ]                                               [ ĐẶC TẢ NGHIỆP VỤ DỌC TỪNG MENU ]
   - SRS_HORIZONTAL_BUTTONS.md                                                 - Menu 1: SRS_MENU_STUDIO.md
   - SRS_HORIZONTAL_SELECTS.md                 ◄══ 1-to-1 Matrix Link ══►      - Menu 2: SRS_MENU_BROWSERS.md
   - SRS_HORIZONTAL_FEATURE_STORES.md                                          - Menu 3: SRS_MENU_CAMPAIGN.md
   - OPENAPI_INTEGRATION_GUIDE.md                                              - Menu 4: SRS_MENU_STORAGE.md
                                                                               - Menu 5: SRS_MENU_HISTORY.md
                                                                               - Menu 6: SRS_MENU_SETTINGS.md
```

### 🌐 1. Nhóm Tiêu Chuẩn Kỹ Thuật Ngang (Horizontal Standards)
- ⚡ [**SRS Horizontal Buttons & FSM Engine (`docs/srs/SRS_HORIZONTAL_BUTTONS.md`)**](./srs/SRS_HORIZONTAL_BUTTONS.md): Master catalog 37 Button IDs (`btn.*`), máy trạng thái FSM 7 bước (`IDLE` $\rightarrow$ `TERMINATING`), Thác cứu hộ Browser Waterfall 3 cấp độ, và WebSocket live breakpoint controls (`PAUSE_JOB`, `RESUME_JOB`, `KILL_JOB`).
- 📜 [**SRS Horizontal Selects & Virtualization (`docs/srs/SRS_HORIZONTAL_SELECTS.md`)**](./srs/SRS_HORIZONTAL_SELECTS.md): Master catalog 11 Remote Select IDs (`select.*`), thuật toán cắt lát ảo hóa (Virtualization Slices), Debounce fuzzy search, và tự động làm mới qua SSE Cache Invalidation.
- 🏛️ [**SRS Horizontal Feature Stores & Reactive Hub (`docs/srs/SRS_HORIZONTAL_FEATURE_STORES.md`)**](./srs/SRS_HORIZONTAL_FEATURE_STORES.md): Master architecture 6 Pinia Domain Stores theo mô hình 4 lớp (Primitive State, Entity Graph, Actions, SSE Mutations) và Ma trận Phản xạ Tức thì (Reactive Reflection Matrix).
- 📘 [**OpenAPI Integration Guide (`docs/OPENAPI_INTEGRATION_GUIDE.md`)**](./OPENAPI_INTEGRATION_GUIDE.md): Cẩm nang lập trình kết nối Backend Axum Daemon bằng Typed SDK `@automa/types/api` và Zero-Leak Cryptography.
- 🚇 [**Cloudflare SSH Tunnel & Git Relay Guide (`docs/CLOUDFLARE_TUNNEL_GIT_RELAY.md`)**](./CLOUDFLARE_TUNNEL_GIT_RELAY.md): Cẩm nang thiết lập hạ tầng mạng, đào hầm Cloudflare Tunnel và quy trình Git Relay 1-Click vượt tường lửa cho Automa Ecosystem.

---

### 📱 2. Nhóm Đặc Tả Nghiệp Vụ Dọc Từng Màn Hình (Vertical Menu SRS)
1. 🎨 [**Menu 1: Studio Canvas & Workflow Editor (`docs/srs/SRS_MENU_STUDIO.md`)**](./srs/SRS_MENU_STUDIO.md) - Soạn thảo đồ thị VueFlow, Smart Connect, Action Header, Run Modal, Dynamic Parameters, Lint diagnostics, và Live Debugger Console.
2. 🌐 [**Menu 2: Browsers Fleet Management (`docs/srs/SRS_MENU_BROWSERS.md`)**](./srs/SRS_MENU_BROWSERS.md) - Quản lý Profile Anti-detect, Auto-detect Chrome/Brave/Edge, Quản lý phiên Chromium `startBrowser()`, Dừng khẩn cấp Kill-all.
3. 🚀 [**Menu 3: Campaign Matrix Scheduler (`docs/srs/SRS_MENU_CAMPAIGN.md`)**](./srs/SRS_MENU_CAMPAIGN.md) - Ma trận Campaign Matrix Grid, điều phối chạy song song nhiều profile, phân bổ slots, theo dõi tiến độ thời gian thực `campaign_slot_progress`.
4. 🗄️ [**Menu 4: Storage & Vault Cryptography (`docs/srs/SRS_MENU_STORAGE.md`)**](./srs/SRS_MENU_STORAGE.md) - Bảng dữ liệu SQLite động, Biến công khai `{{variables.*}}`, Mật mã Vault mã hóa `HMAC-SHA256 + AES-256-CBC` `{{secrets.*}}`, Workspace File Explorer.
5. 📜 [**Menu 5: History & Telemetry Explorer (`docs/srs/SRS_MENU_HISTORY.md`)**](./srs/SRS_MENU_HISTORY.md) - Lịch sử thực thi Job, bộ lọc trạng thái, xem chi tiết trace log từng block, thống kê thời gian và hiệu suất.
6. ⚙️ [**Menu 6: Settings & Core Daemon Configuration (`docs/srs/SRS_MENU_SETTINGS.md`)**](./srs/SRS_MENU_SETTINGS.md) - Cấu hình Daemon Host/Port `:8765`, Giám sát Heartbeat Health, Master Passphrase, Giao diện Dark/Light/System, Đường dẫn lưu trữ Workspace.

---

## 📦 MICROSERVICES & SUBMODULES REFERENCE

1. 🦀 [**Automa Core (Rust Daemon)**](../automa-core/README.md) - Core engine xử lý logic, Axum REST/SSE/WS server, Browser management, SQLite DB.
2. 🧩 [**Automa VS Code Extension**](../automa-vsce/README.md) - 3-Panel Sidebar (`automa.workspace`, `automa.browsers`, `automa.storage`), Custom Editors, và Live Debugger.
3. 🌐 [**Automa Web Extension & Studio**](../automa-webe/README.md) - Standalone Web Studio (`dist/studio`) và Headless Runner (`dist/cli-runner`).
4. 🖥️ [**Automa Desktop App (Tauri v2)**](../automa-desk/README.md) - Ứng dụng Desktop độc lập Native OS tích hợp Pinia Domain Stores và Browser Waterfall.
5. 📂 [**Automa Vault**](../automa-vault/README.md) - Cấu trúc lưu trữ Local Vault, Campaigns, và Browsers.
6. 🎨 [**Automa UI SDK (`@automa/ui`)**](../packages/automa-ui/README.md) - Gói thư viện giao diện & trạng thái dùng chung (Shared Components, TanStack Query & Virtual, 6 Pinia Stores, SSE Invalidation).
7. 🧪 [**Ma Trận Kiểm Thử Toàn Hệ Sinh Thái (Ecosystem Test Matrix)**](./TEST_MATRIX.md) - Báo cáo kim tự tháp kiểm thử 4 tầng toàn diện.
