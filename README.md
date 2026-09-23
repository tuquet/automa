<div align="center">
  <img src="apps/vsce/assets/logo.png" width="128" height="128" alt="Automa Ecosystem Logo" />
  <h1>Automa Ecosystem</h1>
  <p><strong>Nền tảng Orchestration Đa Trình Duyệt Chuẩn Doanh Nghiệp (Enterprise-Grade)</strong></p>
  
  [![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.x-brightgreen.svg)](https://nodejs.org/)
  [![Rust](https://img.shields.io/badge/Rust-Cargo-orange.svg)](https://www.rust-lang.org/)
  [![VS Code](https://img.shields.io/badge/VS%20Code-%3E%3D1.85.0-blue.svg)](https://code.visualstudio.com/)
  [![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
</div>

<br/>

Chào mừng đến với **Automa Ecosystem**. Phiên bản hiện tại là một hệ sinh thái mạnh mẽ được tổ chức dưới dạng **Pure Monorepo** với triết lý **Offline-First**, hoạt động hoàn toàn độc lập và không phụ thuộc vào các dịch vụ Cloud bên ngoài, mang lại khả năng quản lý dữ liệu an toàn và tự động hóa đa trình duyệt vượt trội.

Tầm nhìn của chúng tôi là chuyển đổi Automa từ một công cụ tự động hóa cá nhân trở thành một nền tảng điều phối (Orchestrator) toàn diện chạy trên mọi môi trường mà không cần cài đặt runtime phức tạp.

---

## 🧭 Điều Hướng Dự Án (Project Directory & Navigation)

Hệ sinh thái **Automa Ecosystem** được tổ chức theo cấu trúc Pure Monorepo phân tách rõ ràng giữa **Core Engine**, **Extension Targets** và **Client GUI Platforms** tập trung trong thư mục `apps/` theo bộ tứ chuẩn hóa 4 ký tự:

```text
tuquet-automa/
├── apps/
│   ├── core/           # [Rust Core Engine]      - Daemon xử lý trung tâm (Axum, Tokio, CDP, SQLite)
│   ├── desk/           # [Desktop Native App]    - Ứng dụng Desktop độc lập (Tauri v2 + Vue 3 Frontend)
│   ├── vault/          # [Storage & Security]    - Kho lưu trữ Campaign, Profiles & Workflows
│   ├── vsce/           # [VS Code Extensions]    - Thin-Client IDE Extension (Webview Canvas, TreeViews) [package: vscode-automa]
│   └── webe/           # [Web Extensions]        - Extension MV3 & Web Studio [package: @automa/webe]
├── packages/           # [Shared Workspaces]     - Shared UI SDK (@automa/ui), Types & Contracts (@automa/types)
└── scripts/            # [Dev & Build Tools]     - Bộ công cụ CLI Orchestrator & Build Wizards
```

> [!NOTE]
> **Quy Chuẩn Định Danh 4 Ký Tự Trong `apps/` (4-Character App Code Standard):**
> - 🦀 **`apps/core`**: Rust Core Engine Daemon
> - 🌐 **`apps/webe`**: Web Extension MV3 & Web Studio *(package: `@automa/webe`)*
> - 💻 **`apps/vsce`**: VS Code Extension IDE *(package: `vscode-automa`)*
> - 🖥️ **`apps/desk`**: Desktop Native OS App *(package: `@automa/desk`)*
> - 🗄️ **`apps/vault`**: Storage & Campaign Workspace

---

## 🏗️ Kiến Trúc Tổng Thể (System Architecture)

Lõi **Rust Native Daemon** (`apps/core`) đóng vai trò trung tâm xử lý, phục vụ đồng thời cho 3 nền tảng Client (`apps/vsce`, `apps/desk`, `apps/webe`):

```text
┌───────────────────────────────┐     ┌───────────────────────────────┐
│     apps/vsce (VS Code Ext)   │     │    apps/desk (Desktop App)    │
│   - Thin-Client IDE           │     │   - Cross-Platform Native OS  │
│   - Visual Canvas Webview     │     │   - Standalone Studio GUI     │
└───────────────┬───────────────┘     └───────────────┬───────────────┘
                │                                     │
                │        ( HTTP REST / SSE :8765 )    │
                └──────────────────┬──────────────────┘
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      apps/core (Rust Core Daemon)                   │
│                                                                     │
│  1. High-Performance API Server & Realtime Event Emitter (SSE)      │
│  2. Campaign Orchestrator, SQLite Storage & AES Encryption          │
│  3. Browser Process Manager (Stealth Mode & CDP Controller)         │
└──────────────────────────────────┬──────────────────────────────────┘
                                   │
                           ( CDP / Chrome API )
                                   │
                                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      apps/webe (Web Extension)                      │
│                                                                     │
│  - Chromium / Chrome / Firefox MV3 Extension Runtime                │
│  - Offscreen Document Workflow Engine & Silent Runner               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 📦 Chi Tiết Các Thành Phần Cốt Lõi (Applications & Packages)

### 1. 🦀 `apps/core` — *Rust Core Engine*
Trái tim điều phối của toàn bộ hệ sinh thái. Hoạt động như một Native Daemon (viết bằng Rust Axum/Tokio).
- **Trọng trách:** Xử lý đa luồng (high-concurrency), quản lý cơ sở dữ liệu SQLite cục bộ, mã hóa bảo mật AES, và điều khiển trực tiếp Chrome DevTools Protocol (CDP).
- **Anti-Detection:** Quản lý khởi chạy trình duyệt thông qua cơ chế tàng hình cấp thấp và fingerprinting.

### 2. 🌐 `apps/webe` *(Web Extension & Studio — `@automa/webe`)*
Là Extension gốc Manifest V3 (hỗ trợ Chromium & Firefox), đóng vai trò động cơ thực thi và cung cấp **2 bản build đầu ra (Build Outputs) tái sử dụng cho toàn hệ sinh thái**:

* ⚡ **1. Build Runner (`dist/cli-runner`) — *Headless Silent Engine*:**
  - **Lệnh đóng gói:** `pnpm run build:runner` (hoặc `webpack.runner.config.js`)
  - **Mục đích tái sử dụng:** Bản build siêu gọn nhẹ, loại bỏ toàn bộ giao diện UI/CSS nặng để tối ưu hóa RAM & CPU. Được `apps/core` nạp trực tiếp vào các phiên Chromium Worker để chạy kịch bản ngầm (Headless/Stealth Execution).
* 🎨 **2. Build Studio Standalone (`dist/studio`) — *Visual Canvas Editor GUI*:**
  - **Lệnh đóng gói:** `pnpm run build:studio` (hoặc `vite.studio.config.mjs`)
  - **Mục đích tái sử dụng:** Bản build giao diện thiết kế kịch bản hoàn chỉnh (Vue 3, Vue Flow, Host Bridge). Được `apps/core` phục vụ trực tiếp qua Web Server tại `http://127.0.0.1:8765/studio/` hoặc chạy độc lập.

### 3. 📁 `packages/` — *Shared Packages*
Chứa các package dùng chung toàn hệ thống (`@automa/ui`, `@automa/types`, polyfills) được quản lý bởi Turborepo/pnpm workspaces.


---

## 🚀 Hướng Dẫn Khởi Tạo (Getting Started)

Dự án sử dụng **pnpm workspaces**, **Turborepo** và **Cargo** cho quy trình Build.

### Yêu Cầu Tiên Quyết (Prerequisites)

Dự án yêu cầu **Node.js** và **Rust Toolchain**. Để tiết kiệm dung lượng (tránh tải cả bộ Visual Studio cồng kềnh 10–20 GB), hãy cài đặt bản siêu nhẹ (Minimal CLI) bằng lệnh dưới đây:

| Môi trường / Công cụ | Phiên bản | Lệnh cài đặt nhanh trên Windows (PowerShell / winget) |
| :--- | :--- | :--- |
| **Node.js (LTS)** | `>= 20.x` | `winget install OpenJS.NodeJS.LTS` |
| **pnpm** | `>= 11.x` | `npm i -g pnpm@11` *(hoặc `corepack enable`)* |
| **Rust & Cargo** | `>= 1.80+` | `winget install Rustlang.Rustup` *(chọn option `1` Default)* |
| **C++ Build Tools (Siêu nhẹ)** | C++ Minimal | `winget install Microsoft.VisualStudio.2022.BuildTools --override "--passive --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"` |
| **cargo-watch (Hot-Reload)** | Mới nhất | `cargo install cargo-watch` |
| **VS Code** | `>= 1.85.0` | `winget install Microsoft.VisualStudioCode` |

> [!TIP]
> **🚀 Lệnh One-Liner cài đặt toàn bộ môi trường cho Windows (Chạy trên PowerShell với quyền Admin):**
> ```powershell
> # Cài đặt Node.js, Rust, Minimal C++ Build Tools & VS Code qua winget
> winget install OpenJS.NodeJS.LTS Rustlang.Rustup Microsoft.VisualStudioCode --accept-package-agreements --accept-source-agreements
> winget install Microsoft.VisualStudio.2022.BuildTools --override "--passive --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
> 
> # Kích hoạt pnpm và cargo-watch
> npm i -g pnpm@11
> cargo install cargo-watch
> ```

---

### 🚀 Hướng Dẫn Cài Đặt Qua Scoop (Cho Người Dùng / Production)

```powershell
# 1. Thêm Scoop Bucket chính thức của Tuquet
scoop bucket add tuquet https://github.com/tuquet/scoop-bucket

# 2. Cài đặt Tuquet Automa CLI Engine
scoop install automa

# 3. Khởi chạy hệ thống (Daemon + Web Studio)
automa start

# 4. Cập nhật lên bản mới nhất bất kỳ lúc nào
scoop update automa
```

---

### 💻 Hướng Dẫn Phát Triển Cho Lập Trình Viên (Developer Monorepo Setup)

```bash
# 1. Clone repository
git clone https://github.com/tuquet/tuquet-automa.git
cd tuquet-automa

# 2. Cài đặt dependencies
pnpm install

# 3. Biên dịch bản sản phẩm (Build @automa/webe & apps/core)
pnpm run build

# 4. Chạy môi trường phát triển (Dev Mode)
pnpm run dev          # Chạy toàn bộ hệ thống
pnpm run dev:core     # Chạy Rust Core Daemon (với cargo-watch hot-reload)
pnpm run dev:source:runner # Chạy Silent Web Extension Runner
pnpm run dev:source:studio # Chạy Standalone Studio Canvas UI
```

### 🧪 Chạy Kiểm Thử Toàn Cục (Test Suites)

```bash
# Chạy Unit Tests cho toàn bộ TypeScript/Node packages (Vitest)
pnpm run test

# Chạy Unit Tests cho Rust Core Engine (55 tests)
pnpm run test:core    # (tương đương cargo test --manifest-path apps/core/Cargo.toml)
```

---

## 🗺️ Định Hướng Phát Triển (Roadmap)

Chiến lược phát triển dài hạn của Automa Ecosystem được chia làm 4 giai đoạn (Horizons):

- **Horizon 1 - Ổn định (Stabilize):** Tối ưu hóa MV3, hoàn thiện tính năng kill/stop Campaign, bổ sung Test Coverage và hạ tầng CI/CD.
- **Horizon 2 - Mở rộng (Grow):** Xây dựng trang tài liệu trực tuyến, ra mắt **Workflow Hub** chia sẻ kịch bản cho cộng đồng.
- **✅ Horizon 3 - Chuyển dịch lõi (Rust Core) [HOÀN THÀNH]:** Thay thế Node.js runtime bằng Native Rust Binary (`apps/core`), đạt được tốc độ xử lý siêu việt, tối ưu bộ nhớ triệt để và kiến trúc Thin Client.
- **Horizon 4 - Nền tảng Doanh nghiệp (SaaS Platform):** Xây dựng Web Dashboard quản trị tập trung với cơ chế Cloud Sync thời gian thực (LWW), hỗ trợ cộng tác nhóm (Team Collaboration) và cung cấp Managed Cloud Runners.

👉 **Xem chi tiết Lộ Trình & Hub Tài Liệu tại:** [docs/Home.md](./docs/Home.md)

---

## 📚 Hệ Thống Trí Thức (Knowledge Base)

Kiến trúc tài liệu được thiết kế theo dạng **Phân tán (Decentralized Docs)** nhằm tránh tình trạng tài liệu lỗi thời. Mỗi ứng dụng và gói thư viện (`apps/*`, `packages/*`) tự bảo trì tài liệu kỹ thuật và kiến trúc chuyên sâu ngay trong file `README.md` gốc của mình.

👉 **Hãy xem tệp [docs/Home.md](./docs/Home.md) để lấy danh sách liên kết điều hướng đến tài liệu của từng phân hệ.**

### Giao Tiếp API (Automa Bruno)
Bộ tài liệu đặc tả OpenAPI 3.1.0 và REST/SSE Client (`automa-core-api.json`) tương tác với Rust Core Daemon được sử dụng thông qua phần mềm **Bruno** tại thư mục `bruno/`.

---

## 🤝 Đóng Góp Phát Triển (Contributing)
Mọi chỉnh sửa kiến trúc, quy tắc Code Audit (SOLID, SoC, KISS) đều phải tuân theo hướng dẫn quy chuẩn BẮT BUỘC. Hãy đọc kỹ tệp [AGENTS.md](./.agents/AGENTS.md) trước khi thực hiện quy trình Review Code hay Quality Control (QC).
