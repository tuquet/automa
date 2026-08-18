<div align="center">
  <img src="automa-vscode/assets/logo.png" width="128" height="128" alt="Automa Ecosystem Logo" />
  <h1>Automa Ecosystem</h1>
  <p><strong>Nền tảng Orchestration Đa Trình Duyệt Chuẩn Doanh Nghiệp (Enterprise-Grade)</strong></p>
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

==========================================================
                 LOCAL VAULT & STORAGE
==========================================================
  (Mặc định) ──> 📁 ~/.automa-cli/      (Production)
  (Khi Dev)  ──> 📁 ~/.automa-cli-dev/  (Dev Sandbox)
```

### 1. Rust Core Engine (`automa-core`)
Trái tim điều phối của toàn bộ hệ sinh thái. Hoạt động như một Native Daemon (viết bằng Rust Axum/Tokio).
- **Tốc độ & An toàn:** Xử lý đa luồng (high-concurrency), giải quyết triệt để rò rỉ bộ nhớ (Memory Leak), tốc độ mã hóa AES siêu tốc, và tương tác SQLite không giật lag.
- **Anti-Detection:** Quản lý khởi chạy trình duyệt thông qua cơ chế tàng hình cấp thấp và giao thức CDP.

### 2. Automa CLI Wrapper (`automa-cli`)
Công cụ giao diện dòng lệnh (Command-line Interface) gọn nhẹ.
- **Cầu nối giao tiếp:** Dùng để gọi các API nội bộ, kích hoạt Server ngầm, nạp Chromium, và đóng vai trò cầu nối cho người dùng Terminal tương tác với `automa-core`.

### 3. Automa VS Code Extension (`automa-vscode`)
Giao diện điều khiển trung tâm (GUI). Hoạt động hoàn toàn dưới dạng **Thin Client**, không nhúng các ứng dụng Webview (Vue) nặng nề. 
- Giao tiếp với Daemon qua HTTP REST/SSE để thao tác Workspace, xem log thời gian thực, và điều phối các chiến dịch tự động hóa (Campaigns) ngầm một cách mượt mà.

### 4. Động Cơ Thực Thi Gốc (`automa-ext`)
Phân nhánh (fork) độc lập chuyên sâu, đóng vai trò chạy mã lệnh trực tiếp bên trong trình duyệt mục tiêu. Đã gỡ bỏ cấu trúc polyfill rườm rà, áp dụng Webpack Override để tạo ra một cấu trúc Extension MV3 hoàn toàn tương thích với cơ chế Silent Runner.

---

## 🚀 Hướng Dẫn Khởi Tạo (Getting Started)

Dự án được quản lý dưới dạng **pnpm workspaces** kết hợp với hệ sinh thái Rust Cargo (Monorepo).

### Yêu Cầu
- Node.js >= 18.x & pnpm >= 8.x
- Rust toolchain (cargo)
- VS Code >= 1.80.0

### Biên Dịch & Chạy
```bash
# 1. Tải mã nguồn
git clone https://github.com/tuquet/automa-ecosystem.git
cd automa-ecosystem

# 2. Cài đặt toàn bộ Node module & Rust dependencies
pnpm install

# 3. Đóng gói hệ sinh thái
pnpm run build

# 4. Khởi chạy môi trường phát triển (Dev Mode)
pnpm run dev
```

---

## 🗺️ Định Hướng Phát Triển (Roadmap)

Chiến lược phát triển dài hạn của Automa Ecosystem được chia làm 4 giai đoạn (Horizons):

- **Horizon 1 - Ổn định (Stabilize):** Tối ưu hóa MV3, hoàn thiện tính năng kill/stop Campaign, bổ sung Test Coverage và hạ tầng CI/CD.
- **Horizon 2 - Mở rộng (Grow):** Xây dựng trang tài liệu trực tuyến, ra mắt **Workflow Hub** chia sẻ kịch bản cho cộng đồng.
- **✅ Horizon 3 - Chuyển dịch lõi (Rust Core) [HOÀN THÀNH]:** Thay thế Node.js runtime bằng Native Rust Binary (`automa-core`), đạt được tốc độ xử lý siêu việt, tối ưu bộ nhớ triệt để và kiến trúc Thin Client.
- **Horizon 4 - Nền tảng Doanh nghiệp (SaaS Platform):** Xây dựng Web Dashboard quản trị tập trung với cơ chế Cloud Sync thời gian thực (LWW), hỗ trợ cộng tác nhóm (Team Collaboration) và cung cấp Managed Cloud Runners.

---

## 📚 Hệ Thống Trí Thức (Knowledge Base)

Tất cả tài liệu kiến trúc chuyên sâu, quy tắc (Guidelines) và giải phẫu tính năng được lưu trữ dưới dạng **Obsidian Vault** tại thư mục `documents/`. Hãy xem tệp `documents/Home.md` để bắt đầu nghiên cứu cấu trúc thiết kế của hệ sinh thái.d automa-ecosystem

# 2. Cài đặt toàn bộ module
pnpm install

# 3. Đóng gói hệ sinh thái
pnpm run build

# 4. Khởi chạy môi trường phát triển (Dev Mode)
pnpm run dev
```

---

## 🗺️ Định Hướng Phát Triển (Roadmap)

Chiến lược phát triển dài hạn của Automa Ecosystem được chia làm 4 giai đoạn (Horizons):

- **Horizon 1 - Ổn định (Stabilize):** Tối ưu hóa MV3, hoàn thiện tính năng kill/stop Campaign, bổ sung Test Coverage và chuẩn bị hạ tầng CI/CD để phát hành bản chính thức lên VS Code Marketplace.
- **Horizon 2 - Mở rộng (Grow):** Xây dựng trang tài liệu trực tuyến (VitePress), ra mắt **Workflow Hub** chia sẻ kịch bản cho cộng đồng và mở rộng khả năng biên dịch CI/CD.
- **Horizon 3 - Chuyển dịch lõi (Rust Core):** *Mục tiêu tối thượng*. Thay thế Node.js runtime hiện tại bằng Native Rust Binary (`automa-core`), đạt được tốc độ khởi động <100ms, giảm RAM 80% và phân phối phần mềm **không cần cài đặt Node.js** (Zero-dependency).
- **Horizon 4 - Nền tảng Doanh nghiệp (SaaS Platform):** Xây dựng Web Dashboard quản trị tập trung với cơ chế Cloud Sync thời gian thực (LWW), hỗ trợ cộng tác nhóm (Team Collaboration) và cung cấp Managed Cloud Runners.

---

## 📚 Hệ Thống Trí Thức (Knowledge Base)

Tất cả tài liệu kiến trúc chuyên sâu, quy tắc (Guidelines) và giải phẫu tính năng được lưu trữ dưới dạng **Obsidian Vault** tại thư mục `documents/`. Hãy xem tệp `documents/Home.md` để bắt đầu nghiên cứu cấu trúc thiết kế của hệ sinh thái.
