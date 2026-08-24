<div align="center">
  <img src="automa-vscode/assets/logo.png" width="128" height="128" alt="Automa Ecosystem Logo" />
  <h1>Automa Ecosystem</h1>
  <p><strong>Nền tảng Orchestration Đa Trình Duyệt Chuẩn Doanh Nghiệp (Enterprise-Grade)</strong></p>
  
  [![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.x-brightgreen.svg)](https://nodejs.org/)
  [![Rust](https://img.shields.io/badge/Rust-Cargo-orange.svg)](https://www.rust-lang.org/)
  [![VS Code](https://img.shields.io/badge/VS%20Code-%3E%3D1.85.0-blue.svg)](https://code.visualstudio.com/)
  [![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
</div>

<br/>

Chào mừng đến với **Automa Ecosystem**. Phiên bản hiện tại là một hệ sinh thái mạnh mẽ được tái thiết kế với triết lý **Offline-First**, hoạt động hoàn toàn độc lập và không phụ thuộc vào các dịch vụ Cloud bên ngoài, mang lại khả năng quản lý dữ liệu an toàn và tự động hóa đa trình duyệt vượt trội.

Tầm nhìn của chúng tôi là chuyển đổi Automa từ một công cụ tự động hóa cá nhân trở thành một nền tảng điều phối (Orchestrator) toàn diện chạy trên mọi môi trường mà không cần cài đặt runtime phức tạp.

---

## 🏗️ Kiến Trúc Lõi (Rust Daemon-Driven Architecture)

Hệ thống loại bỏ hoàn toàn các luồng xử lý phân mảnh bằng Node.js nặng nề trước đây. Thay vào đó, toàn bộ sức mạnh điều phối được ủy thác cho lõi **Rust Native Daemon** (Background HTTP/SSE) kết hợp với các giao diện (UI) mỏng nhẹ.

```text
┌────────────────────────────────────────────────────────┐
│               VS CODE ENVIRONMENT (GUI)                │
│                                                        │
│  [Automa VS Code Extension]                            │
│   (Thin Client / API Client)                           │
└──────────────────────────┬─────────────────────────────┘
                           │
                 ( HTTP REST / SSE )
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│             RUST CORE DAEMON (BACKGROUND)              │
│                 (automa-core serve)                    │
│                                                        │
│  1. High-Performance API Server & Event Emitter        │
│  2. Campaign Orchestrator & Fast DB (rusqlite)         │
│  3. Browser Process Manager (Stealth Mode)             │
└──────────────────────────┬─────────────────────────────┘
                           │
                   ( CDP Polling )
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│                  TARGET BROWSERS                       │
│                                                        │
│  [ Chromium / Chrome ]  ──(Loads)──> [ Automa MV3 ]    │
│  (Trình duyệt thực thi)              (Extension Gốc)   │
└────────────────────────────────────────────────────────┘
```

---

## 📖 Thuật Ngữ & Khái Niệm Xuyên Suốt (Project Terminology)

Để đảm bảo tính nhất quán giữa Backend (Rust Core), Extension Engine, VS Code IDE và Standalone Studio, toàn bộ hệ sinh thái sử dụng bảng định nghĩa thuật ngữ chuẩn hóa chia theo 4 nhóm chức năng:

### 1. 🏗️ Kiến Trúc & Runtime Engine
| Thuật Ngữ (Term) | Khái Niệm & Định Nghĩa | Phạm Vi & Giao Diện Áp Dụng |
| :--- | :--- | :--- |
| **Rust Core Daemon** | Tiến trình Backend ngầm viết bằng Rust (Axum/Tokio HTTP REST & SSE tại port `:8765`), điều phối toàn bộ tài nguyên. | Lệnh `automa-core serve`, quản lý SQLite, CDP, AES Crypto, Linters. |
| **Thin Client** | Mô hình UI mỏng (VS Code Extension, Standalone Studio) chỉ gửi lệnh API tới Daemon thay vì sinh V8 runtime con. | `automa-vscode`, `StudioApp.vue`. |
| **Standalone Studio** | Trình thiết kế trực quan Visual Canvas (Vue 3 + Vue Flow) chạy qua Web Server tĩnh của Daemon tại `/studio`. | Lệnh `pnpm run build:studio`, tích hợp SSE live stream, Storage sync. |
| **Silent Runner** | Bản build headless của extension (`dist/cli-runner`) không nạp UI nặng, chuyên dụng cho execution engine trong Chromium. | Lệnh `pnpm run build:runner`, cấu hình `webpack.runner.config.js`. |
| **Offscreen Document** | Môi trường nền MV3 (`offscreen.html`) của Chromium chứa `WorkflowEngine` để chạy ngầm và xử lý DOM. | `BackgroundOffscreen.sendMessage` trong `automa-ext`. |
| **Message Routing Prefix** | Tiền tố ngữ cảnh định tuyến tin nhắn giữa Service Worker và Offscreen Document (`background--`, `offscreen--`). | `MessageListener` trong `automa-ext`. |

### 2. 🗄️ Quản Lý Dữ Liệu & Storage
| Thuật Ngữ (Term) | Khái Niệm & Định Nghĩa | Phạm Vi & Giao Diện Áp Dụng |
| :--- | :--- | :--- |
| **Storage Tables** | Bảng dữ liệu SQLite dạng dòng/cột được quản lý bởi Daemon. Hỗ trợ lặp dòng dữ liệu và lưu trữ kết quả cào (scraping). | Endpoint `/api/storage/tables`, kết nối trực tiếp trong `WorkflowDataTable.vue`. |
| **Storage Variables** | Các biến toàn cục (`{{variables.KEY}}`) lưu trong SQLite Daemon, dùng chung xuyên suốt các kịch bản trong Campaign. | Endpoint `/api/storage/variables`, Tab Storage trong `WorkflowGlobalData.vue`. |
| **Storage Credentials** | Thông tin đăng nhập, token nhạy cảm được mã hóa bảo mật (`{{credentials.KEY}}`) bằng thuật toán AES. | Endpoint `/api/storage/credentials`, quản lý bởi Daemon SQLite. |
| **Storage Workspace** | Cây thư mục kịch bản cục bộ (`automa-vault/`), chứa các file kịch bản và cấu hình chiến dịch. | Quét bởi `GET /api/storage/files`, giao diện `StorageFileExplorer.vue`. |
| **Offline Cache & Sync Queue** | Cơ chế lưu snapshot trên Dexie IndexedDB và hàng đợi tự động đẩy thay đổi lên Rust Core khi Daemon online. | `storage-service.js` và `standalone-bridge.js`. |

### 3. ⚡ Điều Phối & Thực Thi Kịch Bản (Orchestration)
| Thuật Ngữ (Term) | Khái Niệm & Định Nghĩa | Phạm Vi & Giao Diện Áp Dụng |
| :--- | :--- | :--- |
| **Workflow** | Đồ thị kịch bản tự động hóa đơn lẻ (DAG: Directed Acyclic Graph) gồm các Blocks và Edges kết nối. | Định dạng file `*.workflow.json` hoặc `*.automa.json`. |
| **Campaign** | Chiến dịch điều phối ma trận đa luồng: kết hợp danh sách Workflows $\times$ Browsers Profiles $\times$ Storage Data. | Định dạng file `*.campaign.json` hoặc `*.campaigns.json`. |
| **Job / Task** | Một phiên thực thi kịch bản cụ thể trên một Browser Profile với định danh `jobId` duy nhất. | Endpoint `/api/jobs` và `/api/jobs/{id}/status`. |
| **SSE Realtime Stream** | Luồng sự kiện 1 chiều Server-Sent Events phát trạng thái `job_log`, `step`, `job_finish` theo thời gian thực. | Kênh `/api/events`, lắng nghe qua `useAutomaCoreHealth`. |
| **Active Node Pulse** | Hiệu ứng viền phát sáng động (`.node-running`) và Camera Auto-Focus di chuyển bám theo Block đang chạy trên Canvas. | Vue Flow dynamic class, đồng bộ thời gian thực qua SSE events. |
| **Live Schema Lint** | Trình phân tích cú pháp DAG kịch bản thời gian thực (Debounced 800ms) gọi `/api/lint` để phát hiện cảnh báo và lỗi cấu trúc. | Thư mục `automa-core/src/core/linters/`, hiển thị badge trực quan trên Studio Header. |

### 4. 🌐 Quản Lý Trình Duyệt & Tự Động Hóa (CDP & Browsers)
| Thuật Ngữ (Term) | Khái Niệm & Định Nghĩa | Phạm Vi & Giao Diện Áp Dụng |
| :--- | :--- | :--- |
| **Browser Profile** | Cấu hình môi trường trình duyệt độc lập (User Data Dir, Proxy, Cookies, Fingerprints, Storage). | Quản lý qua `/api/browsers`, TreeView `automa-vscode`. |
| **CDP (Chrome DevTools Protocol)** | Giao thức WebSocket điều khiển trình duyệt cấp thấp, hỗ trợ quản lý cookies, console và DOM. | Đóng gói trong `BrowserLauncher` & `CookieManager` của Rust Core. |
| **Stealth & Anti-Detection** | Kỹ thuật loại bỏ cờ automation (`navigator.webdriver`) và che giấu runtime để chống phát hiện bot. | Áp dụng tự động khi Daemon khởi chạy Chromium worker. |
| **Element Selector Bridge** | Tiện ích trích xuất và bắt phần tử (CSS/XPath) trực tiếp từ trang web đang mở đưa vào Block Configuration. | Tích hợp trong Studio và Extension popup. |

---

## 📦 Các Thành Phần Cốt Lõi (Submodules)

Kiến trúc dự án được thiết kế theo dạng **Monorepo** với hệ thống Submodules độc lập:

### 1. `automa-core` (Rust Core Engine)
Trái tim điều phối của toàn bộ hệ sinh thái. Hoạt động như một Native Daemon (viết bằng Rust Axum/Tokio).
- **Tốc độ & An toàn:** Xử lý đa luồng (high-concurrency), giải quyết triệt để rò rỉ bộ nhớ (Memory Leak), tốc độ mã hóa AES siêu tốc, và tương tác SQLite không giật lag.
- **Anti-Detection:** Quản lý khởi chạy trình duyệt thông qua cơ chế tàng hình cấp thấp và giao thức CDP.

### 2. `automa-vscode` (Giao Diện IDE Trung Tâm)
Hoạt động dưới dạng **Thin Client**, giao tiếp trực tiếp với `automa-core` qua HTTP REST/SSE.
- Cung cấp các Tree Views chuyên dụng để quản lý Vault, Workflows, Campaigns và Browsers.
- Nhúng các Custom Webviews để mang trải nghiệm Visual Editor (Kéo/Thả Vue Flow) vào ngay trong VS Code, nhưng tuyệt đối ủy quyền mọi tác vụ thực thi nặng cho Rust Daemon.

### 3. `automa-cli` (Wrapper Giao Diện Dòng Lệnh)
Công cụ CLI (Command-line Interface) gọn nhẹ cho tự động hóa CI/CD.
- Dùng để gọi các API nội bộ, kích hoạt Server ngầm, nạp Chromium, và đóng vai trò cầu nối cho người dùng Terminal tương tác với `automa-core`.

### 4. `automa-ext` (Động Cơ Thực Thi Trình Duyệt)
Phân nhánh (fork) độc lập chuyên sâu, đóng vai trò chạy mã lệnh trực tiếp bên trong trình duyệt mục tiêu. Đã gỡ bỏ cấu trúc polyfill rườm rà, áp dụng Webpack Override để tạo ra một cấu trúc Extension MV3 hoàn toàn tương thích với cơ chế Silent Runner.

### 5. `automa-vault` (Bảo Mật & Lưu Trữ)
Quản lý cấu trúc thư mục, tệp cấu hình Campaigns và đối chiếu Workflow & Browser.
- Cấu trúc mặc định:
  - `~/.automa/core/` (Production)
  - `~/.automa/core-dev/` (Dev Sandbox)

### 6. Thư mục `packages/` (Shared Packages)
Chứa các package dùng chung toàn hệ thống như `core`, `automa-sdk`, `automa-hub`, `workflow-runner`, được quản lý bởi Turborepo/pnpm workspaces.

---

## 🚀 Hướng Dẫn Khởi Tạo (Getting Started)

Dự án sử dụng **pnpm workspaces**, **Turborepo** và **Cargo** cho quy trình Build.

### Yêu Cầu Hệ Thống
- Node.js >= 18.x & pnpm >= 8.x
- Rust toolchain (cargo)
- VS Code >= 1.85.0

### Biên Dịch & Chạy
```bash
# 1. Tải mã nguồn cùng toàn bộ submodules
git clone --recursive https://github.com/tuquet/automa-ecosystem.git
cd automa-ecosystem

# 2. Cài đặt toàn bộ Node module & Rust dependencies
pnpm install

# 3. Đóng gói hệ sinh thái
pnpm run build

# 4. Khởi chạy môi trường phát triển (Dev Mode)
pnpm run dev
```

### Chạy Unit Test Toàn Cục
Dự án đã được thiết lập `vitest.workspace.ts` để bao phủ toàn bộ workspace.
```bash
pnpm run test
pnpm run test:coverage
```

---

## 🗺️ Định Hướng Phát Triển (Roadmap)

Chiến lược phát triển dài hạn của Automa Ecosystem được chia làm 4 giai đoạn (Horizons):

- **Horizon 1 - Ổn định (Stabilize):** Tối ưu hóa MV3, hoàn thiện tính năng kill/stop Campaign, bổ sung Test Coverage và hạ tầng CI/CD.
- **Horizon 2 - Mở rộng (Grow):** Xây dựng trang tài liệu trực tuyến, ra mắt **Workflow Hub** chia sẻ kịch bản cho cộng đồng.
- **✅ Horizon 3 - Chuyển dịch lõi (Rust Core) [HOÀN THÀNH]:** Thay thế Node.js runtime bằng Native Rust Binary (`automa-core`), đạt được tốc độ xử lý siêu việt, tối ưu bộ nhớ triệt để và kiến trúc Thin Client.
- **Horizon 4 - Nền tảng Doanh nghiệp (SaaS Platform):** Xây dựng Web Dashboard quản trị tập trung với cơ chế Cloud Sync thời gian thực (LWW), hỗ trợ cộng tác nhóm (Team Collaboration) và cung cấp Managed Cloud Runners.

👉 **Xem chi tiết Lộ Trình Giao Diện (Frontend UI Roadmap) tại:** [ROADMAP.md](./ROADMAP.md)

---

## 📚 Hệ Thống Trí Thức (Knowledge Base)

Kiến trúc tài liệu được thiết kế theo dạng **Phân tán (Decentralized Docs)** nhằm tránh tình trạng tài liệu lỗi thời. Mỗi thành phần (microservice/submodule) tự bảo trì tài liệu kỹ thuật và kiến trúc chuyên sâu ngay trong file `README.md` gốc của mình.

👉 **Hãy xem tệp [documents/Home.md](./documents/Home.md) để lấy danh sách liên kết điều hướng đến tài liệu của từng submodule.**

### Giao Tiếp API (Automa Bruno)
Bộ tài liệu đặc tả OpenAPI 3.1.0 và REST/SSE Client (`automa-core-api.json`) tương tác với Rust Core Daemon được sử dụng thông qua phần mềm **Bruno**. Tích hợp qua Git Submodule tại thư mục `automa-bruno` và `bruno/`.

---

## 🤝 Đóng Góp Phát Triển (Contributing)
Mọi chỉnh sửa kiến trúc, quy tắc Code Audit (SOLID, SoC, KISS) đều phải tuân theo hướng dẫn quy chuẩn BẮT BUỘC. Hãy đọc kỹ tệp [AGENTS.md](./.agents/AGENTS.md) trước khi thực hiện quy trình Review Code hay Quality Control (QC).
