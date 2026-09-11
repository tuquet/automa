# 📚 AUTOMA ECOSYSTEM: HỆ THỐNG ĐẶC TẢ SRS MA TRẬN 2 CHIỀU (2D MATRIX SPECIFICATION HUB)

> 🔙 Quay lại Trung tâm tài liệu: [**`docs/README.md`**](../README.md) | [**`docs/Home.md`**](../Home.md)

---

## 🏛️ 1. TỔNG QUAN KIẾN TRÚC MA TRẬN 2 CHIỀU

Hệ thống tài liệu đặc tả của Automa Ecosystem được tổ chức theo mô hình **Ma Trận 2 Chiều (2D Matrix Specification Hub)** kết hợp giữa **Tiêu Chuẩn Kỹ Thuật Ngang (Horizontal Standards)** và **Đặc Tả Nghiệp Vụ Dọc Từng Màn Hình (Vertical Menu Specs)**:

```mermaid
flowchart TD
    subgraph HorizontalStandards ["1. TIÊU CHUẨN KỸ THUẬT NGANG (HORIZONTAL STANDARDS)"]
        H1["SRS Button Business Logic & Event-Driven<br/>(docs/srs/SRS_HORIZONTAL_BUTTONS.md)"]
        H2["SRS Select & Dropdown Business Logic<br/>(docs/srs/SRS_HORIZONTAL_SELECTS.md)"]
        H3["SRS Feature Store & Reactive State Topology<br/>(docs/srs/SRS_HORIZONTAL_FEATURE_STORES.md)"]
        H4["SRS UI Components & Shadcn Design System<br/>(docs/srs/SRS_HORIZONTAL_UI_COMPONENTS.md)"]
        H5["OpenAPI Integration Guide<br/>(docs/OPENAPI_INTEGRATION_GUIDE.md)"]
    end

    subgraph VerticalMenus ["2. ĐẶC TẢ NGHIỆP VỤ DỌC TỪNG MENU (VERTICAL MENU SRS)"]
        M1["🎨 Studio Canvas & Graph Editor<br/>(docs/srs/SRS_MENU_STUDIO.md)"]
        M2["🌐 Anti-detect Browser Fleet<br/>(docs/srs/SRS_MENU_BROWSERS.md)"]
        M3["🚀 Campaign Matrix Fleet<br/>(docs/srs/SRS_MENU_CAMPAIGN.md)"]
        M4["🗄️ SQLite Global Storage & Vault<br/>(docs/srs/SRS_MENU_STORAGE.md)"]
        M5["📜 Job History & Telemetry Logs<br/>(docs/srs/SRS_MENU_HISTORY.md)"]
        M6["⚙️ System Settings & Core Config<br/>(docs/srs/SRS_MENU_SETTINGS.md)"]
    end

---

## 🧠 TRIẾT LÝ KIẾN TRÚC MA TRẬN 2 CHIỀU (THE 2D MATRIX MINDSET)

Tại sao Automa Ecosystem không tổ chức tài liệu theo từng thư mục code truyền thống mà chọn mô hình **Ma Trận 2 Chiều (2D Matrix)**?

Code thay đổi liên tục: hàm có thể refactor, UI có thể di dời từ Desktop sang Extension. Nhưng **Ma Trận 2 Chiều thiết lập một giao ước bất biến (Architectural Contract)** bảo đảm toàn bộ hệ thống luôn khớp nhau:

### 1. Phân Định Hai Chiều Trừu Tượng:
- **Trục Ngang (Horizontal Standards - Hạ Tầng Dùng Chung)**:
  - Giải quyết các bài toán hạ tầng dùng chung không phụ thuộc vào màn hình: Máy trạng thái nút bấm (Button FSM), Tìm kiếm ảo hóa (Remote Virtualized Select), Quản trị state phản xạ (Pinia Reactive Stores), và Design System thích ứng theme (Shadcn-Vue Tokens).
  - Mục tiêu: **Nhất Quán 100% (Consistency) & Tái Sử Dụng Triệt Để (Zero Code Duplication)** trên cả 3 nền tảng: Desktop Tauri, VS Code Extension, và Web Extension.
- **Trục Dọc (Vertical Menu Specs - Nghiệp Vụ Chuyên Biệt)**:
  - Giải quyết bài toán nghiệp vụ của từng màn hình chức năng: Studio Canvas, Anti-detect Browsers, Campaign Matrix, Storage Vault, History Telemetry, và Settings.
  - Mục tiêu: **Tập trung hóa Domain Logic (Domain-Driven Design)**.

### 2. Ba Quy Tắc Bất Biến Của Ma Trận (The 3 Matrix Invariants):
1. **Zero Ad-Hoc Components**: Màn hình nghiệp vụ dọc **nghiêm cấm tự sáng tạo nút bấm hay dropdown tùy tiện**. Mọi nút bấm bắt buộc phải kế thừa canonical ID (`btn.*`) và tuân thủ FSM 7 bước từ Trục Ngang.
2. **Zero Polling & Passive Reactivity**: Mọi màn hình dọc không được viết hàm `setInterval` hay thăm dò định kỳ. Trạng thái chỉ được cập nhật khi nhận tín hiệu từ SSE `/api/v1/events` hoặc WebSocket `/api/v1/ws` thông qua Pinia Stores.
3. **Zero Frontend Contract Invention**: Không một màn hình nào được phép tự viết type payload giả lập (`Record<string, unknown>` hay `as any`). Toàn bộ giao tiếp bắt buộc phải import trực tiếp từ SDK `@automa/types/api`.

---

## 📑 2. MỤC LỤC TRUY CẬP ĐẶC TẢ CHI TIẾT

### 🌐 A. Nhóm Tiêu Chuẩn Kỹ Thuật Dùng Chung (Horizontal Standards)
1. [**SRS Button Business Logic & Event-Driven Schema (`SRS_HORIZONTAL_BUTTONS.md`)**](./SRS_HORIZONTAL_BUTTONS.md): Master catalog 37 Button actions (`btn.*`), máy trạng thái FSM 7 bước, và ma trận phản xạ reactive liên thành phần.
2. [**SRS Select & Dropdown Business Logic Schema (`SRS_HORIZONTAL_SELECTS.md`)**](./SRS_HORIZONTAL_SELECTS.md): Master catalog 11 Remote Virtualized Selects (`select.*`), thuật toán cắt lát ảo hóa (Virtualization Slices), và Debounce tìm kiếm.
3. [**SRS Feature Store & Reactive State Topology (`SRS_HORIZONTAL_FEATURE_STORES.md`)**](./SRS_HORIZONTAL_FEATURE_STORES.md): Master architecture 6 Pinia Domain Stores và SSE Event Dispatch Hub.
4. [**SRS UI Components & Shadcn Design System (`SRS_HORIZONTAL_UI_COMPONENTS.md`)**](./SRS_HORIZONTAL_UI_COMPONENTS.md): Master architecture 19 linh kiện nguyên tử Shadcn-Vue, Theme Variable Inversion, và lệnh CLI đồng bộ/đối chiếu tự động (`sync:ui`, `add:ui`, `audit:ui`).
5. [**OpenAPI Integration Guide (`OPENAPI_INTEGRATION_GUIDE.md`)**](../OPENAPI_INTEGRATION_GUIDE.md): Cẩm nang lập trình kết nối Backend Axum Daemon bằng Typed SDK `@automa/types/api`.

---

### 📱 B. Nhóm Đặc Tả Nghiệp Vụ Từng Màn Hình (Vertical Menu SRS)
1. [**SRS Menu 1: Studio Canvas & Workflow Editor (`SRS_MENU_STUDIO.md`)**](./SRS_MENU_STUDIO.md):
   - Soạn thảo đồ thị VueFlow, Blocks palette drawer, Smart Connect, Action Header, Run Modal, Dynamic Parameters, Lint diagnostics, và Live Debugger Console.
2. [**SRS Menu 2: Browsers Fleet Management (`SRS_MENU_BROWSERS.md`)**](./SRS_MENU_BROWSERS.md):
   - Quản lý Profile Anti-detect, Thác giải quyết Browser 3 cấp (Cascading Waterfall), Auto-detect Chrome/Brave/Edge, Quản lý phiên Chromium `startBrowser()`, Dừng khẩn cấp Kill-all.
3. [**SRS Menu 3: Campaign Matrix Scheduler (`SRS_MENU_CAMPAIGN.md`)**](./SRS_MENU_CAMPAIGN.md):
   - Ma trận Campaign Matrix Grid, điều phối chạy song song nhiều profile, phân bổ slots, theo dõi tiến độ thời gian thực `campaign_slot_progress`.
4. [**SRS Menu 4: Storage & Vault Cryptography (`SRS_MENU_STORAGE.md`)**](./SRS_MENU_STORAGE.md):
   - Bảng dữ liệu SQLite động, Biến công khai `{{variables.*}}`, Mật mã Vault mã hóa `HMAC-SHA256 + AES-256-CBC` `{{secrets.*}}`, Workspace File Explorer.
5. [**SRS Menu 5: History & Telemetry Explorer (`SRS_MENU_HISTORY.md`)**](./SRS_MENU_HISTORY.md):
   - Lịch sử thực thi Job, bộ lọc trạng thái, xem chi tiết trace log từng block, thống kê thời gian và hiệu suất.
6. [**SRS Menu 6: Settings & Core Daemon Configuration (`SRS_MENU_SETTINGS.md`)**](./SRS_MENU_SETTINGS.md):
   - Cấu hình Daemon Host/Port `:8765`, Giám sát Heartbeat Health, Master Passphrase, Giao diện Dark/Light/System, Đường dẫn lưu trữ Workspace.
