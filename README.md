<div align="center">
  <img src="automa-vscode/assets/logo.png" width="128" height="128" alt="Automa Ecosystem Logo" />
  <h1>Automa Ecosystem</h1>
  <p><strong>Nền tảng Orchestration Đa Trình Duyệt Chuẩn Doanh Nghiệp (Enterprise-Grade)</strong></p>
</div>

<br/>

Chào mừng đến với **Automa Ecosystem**. Phiên bản hiện tại là một hệ sinh thái mạnh mẽ được tái thiết kế với triết lý **Offline-First**, hoạt động hoàn toàn độc lập và không phụ thuộc vào các dịch vụ Cloud bên ngoài, mang lại khả năng quản lý dữ liệu an toàn và tự động hóa đa trình duyệt vượt trội.

Tầm nhìn của chúng tôi là chuyển đổi Automa từ một công cụ tự động hóa cá nhân trở thành một nền tảng điều phối (Orchestrator) toàn diện chạy trên mọi môi trường mà không cần cài đặt runtime phức tạp.

---

## 🏗️ Kiến Trúc Lõi (Daemon-Driven Architecture)

Hệ thống loại bỏ hoàn toàn các luồng xử lý phân mảnh, thay vào đó vận hành dựa trên cơ chế Daemon Server trung tâm (Background HTTP/SSE) kết hợp giao diện Webview.

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
│             LOCAL NODE DAEMON (BACKGROUND)             │
│                 (automa-cli serve)                     │
│                                                        │
│  1. API Server & Event Emitter                         │
│  2. Campaign Orchestrator & Workflow Runner            │
│  3. Browser Process Manager (Puppeteer)                │
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

### 1. Automa VS Code Extension (`automa-vscode`)
Giao diện điều khiển trung tâm (GUI). Hoạt động hoàn toàn dưới dạng **Thin Client**, không nhúng các ứng dụng Webview (Vue) nặng nề. Giao tiếp với Daemon qua HTTP REST/CDP để mở Web Studio gốc trên trình duyệt độc lập:
- **AI Agent Skills & Linter:** Cung cấp bộ kỹ năng (skills) chuyên sâu giúp các trợ lý AI tự động sinh mã (generate) ra các workflow hoàn chỉnh, đảm bảo tuân thủ nghiêm ngặt cấu trúc chuẩn.
- **Campaign & Runner Management:** Giám sát trực quan các chiến dịch tự động hóa (Campaigns) đang hoạt động ngầm. Hỗ trợ theo dõi log đa luồng theo thời gian thực và quản lý vòng đời tiến trình.

### 2. Local Node Daemon (`automa-cli`)
Trái tim điều phối của toàn bộ hệ sinh thái. Hoạt động như một HTTP Server nền (cổng mặc định `8765`).
- **Tái sử dụng Process:** Quản lý bộ nhớ thông minh, chống thất thoát RAM (Memory Leak) và xử lý triệt để các tiến trình "Zombie".
- **Anti-Detection:** Khởi chạy trình duyệt bằng giao thức CDP (Chrome DevTools Protocol) thay vì các wrapper tiêu chuẩn, giúp giảm thiểu rủi ro bị hệ thống bot-detection ngăn chặn.

### 3. Động Cơ Gốc (`automa-ext`)
Đây là phân nhánh (fork) độc lập chuyên sâu, đóng vai trò thực thi mã lệnh trên trình duyệt. Đã gỡ bỏ hoàn toàn kiến trúc rườm rà cũ (polyfill) để chuyển dịch sang API `chrome.*` (MV3 Native), đảm bảo tốc độ và tính ổn định tuyệt đối trên các bản Chrome mới nhất.

### 4. Môi Trường Sandbox & Vault
Hệ sinh thái thông minh trong việc nhận diện môi trường. Nếu phát hiện nhà phát triển đang sửa lỗi (Debug/Dev), hệ thống tự động bẻ lái mọi lưu lượng dữ liệu (SQLite, Config, Profile) sang vùng an toàn `~/.automa-cli-dev`. Khả năng override mạnh mẽ thông qua biến môi trường `AUTOMA_HOME` cho mọi máy chủ.

---

## 🚀 Hướng Dẫn Khởi Tạo (Getting Started)

Dự án được quản lý dưới dạng **pnpm workspaces** (Monorepo).

### Yêu Cầu
- Node.js >= 18.x
- pnpm >= 8.x
- VS Code >= 1.80.0

### Biên Dịch & Chạy
```bash
# 1. Tải mã nguồn
git clone https://github.com/tuquet/automa-ecosystem.git
cd automa-ecosystem

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
