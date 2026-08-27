# Automa Ecosystem Knowledge Base (Hub)

Chào mừng bạn đến với trung tâm tài liệu (Documentation Hub) của Automa Ecosystem.
Hệ thống tài liệu được chuẩn hóa theo mô hình **Ma Trận 2 Chiều (2D Matrix Specification Hub)** kết hợp giữa **Tiêu Chuẩn Kỹ Thuật Ngang (Horizontal Standards)** và **Đặc Tả Nghiệp Vụ Từng Màn Hình (Vertical Menu SRS)**.

---

## 🏛️ HỆ THỐNG ĐẶC TẢ SRS MA TRẬN 2 CHIỀU (2D MATRIX SPECIFICATION HUB)

Truy cập trung tâm đặc tả chính: [**`docs/srs/README.md`**](./srs/README.md)

### 🌐 1. Tiêu Chuẩn Kỹ Thuật Dùng Chung (Horizontal Standards)
- [⚡ Đặc Tả SRS Button Business Logic & Event-Driven Schema (`SRS_HORIZONTAL_BUTTONS.md`)](./srs/SRS_HORIZONTAL_BUTTONS.md): Master catalog 37 Button actions (`btn.*`), FSM 7 trạng thái, và ma trận phản xạ reactive liên thành phần.
- [📜 Đặc Tả SRS Select & Dropdown Business Logic (`SRS_HORIZONTAL_SELECTS.md`)](./srs/SRS_HORIZONTAL_SELECTS.md): Master catalog 11 Remote Virtualized Selects (`select.*`), thuật toán cắt lát ảo hóa, và debounce tìm kiếm.
- [🏛️ Đặc Tả SRS Feature Store & Kiến Trúc Reactive Topology (`SRS_HORIZONTAL_FEATURE_STORES.md`)](./srs/SRS_HORIZONTAL_FEATURE_STORES.md): Master architecture 6 Pinia Domain Stores và SSE Event Dispatch Hub.
- [📘 Hướng Dẫn Tích Hợp & Triển Khai OpenAPI (Developer Guide)](./OPENAPI_INTEGRATION_GUIDE.md): Cẩm nang lập trình kết nối Backend Axum Daemon bằng Typed SDK `@automa/types/api`.

### 📱 2. Đặc Tả Nghiệp Vụ Từng Menu Màn Hình (Vertical Menu SRS)
1. [🎨 Menu 1: Studio Canvas & Workflow Editor (`SRS_MENU_STUDIO.md`)](./srs/SRS_MENU_STUDIO.md)
2. [🌐 Menu 2: Browsers Fleet Management (`SRS_MENU_BROWSERS.md`)](./srs/SRS_MENU_BROWSERS.md)
3. [🚀 Menu 3: Campaign Matrix Scheduler (`SRS_MENU_CAMPAIGN.md`)](./srs/SRS_MENU_CAMPAIGN.md)
4. [🗄️ Menu 4: Storage & Vault Cryptography (`SRS_MENU_STORAGE.md`)](./srs/SRS_MENU_STORAGE.md)
5. [📜 Menu 5: History & Telemetry Explorer (`SRS_MENU_HISTORY.md`)](./srs/SRS_MENU_HISTORY.md)
6. [⚙️ Menu 6: Settings & Core Daemon Configuration (`SRS_MENU_SETTINGS.md`)](./srs/SRS_MENU_SETTINGS.md)

---

## 📦 TÀI LIỆU SUBMODULES & KIỂM THỬ

1. [Automa Core (Rust Daemon)](../automa-core/README.md) - Core engine xử lý logic, HTTP server, Browser management.
2. [Automa VS Code Extension](../automa-vsce/README.md) - Extension UI (Studio) tích hợp vào Visual Studio Code.
3. [Automa Web Extension](../automa-webe/README.md) - Standalone Web Studio (`dist/studio`) và Headless Runner (`dist/cli-runner`).
4. [Automa Desktop App (Tauri)](../automa-desk/README.md) - Ứng dụng Desktop độc lập Native OS.
5. [Automa Vault](../automa-vault/README.md) - Cấu trúc lưu trữ Local Vault, Campaigns, và Browsers.
6. [🌐 Ma Trận Kiểm Thử Toàn Hệ Sinh Thái (Ecosystem Test Matrix)](./TEST_MATRIX.md) - Báo cáo kim tự tháp kiểm thử đa tầng.
