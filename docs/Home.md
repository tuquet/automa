# Automa Ecosystem Knowledge Base (Hub)

Chào mừng bạn đến với trung tâm tài liệu (Documentation Hub) của Automa Ecosystem.
Từ ngày 18/08/2026, kiến trúc tài liệu đã được chuyển đổi thành dạng phân tán (Decentralized Docs) để tránh lỗi thời.
Toàn bộ tài liệu chi tiết của từng thành phần (microservices) đã được di chuyển vào file `README.md` của chính nó.

Vui lòng truy cập các liên kết dưới đây để đọc tài liệu:

1. [Automa Core (Rust Daemon)](../automa-core/README.md)
   - Core engine xử lý logic, HTTP server, Browser management.
2. [Automa VS Code Extension](../automa-vsce/README.md)
   - Extension UI (Studio) tích hợp vào Visual Studio Code.
   - [📊 Ma Trận Kiểm Thử VS Code Extension (107/107 tests)](../automa-vsce/docs/TEST_MATRIX.md)
3. [Automa Web Extension](../automa-webe/README.md)
   - Extension UI (Studio) và Background MV3 Native Engine, đã gỡ bỏ hoàn toàn polyfill.
4. [Automa Desktop App (Tauri)](../automa-desk/README.md)
   - Ứng dụng Desktop độc lập Native OS.
5. [Automa Vault](../automa-vault/README.md)
   - Cấu trúc lưu trữ Local Vault, Campaigns, và Browsers.
6. [🌐 Ma Trận Kiểm Thử Toàn Hệ Sinh Thái (Ecosystem Test Matrix)](./TEST_MATRIX.md)
   - Báo cáo và kim tự tháp kiểm thử đa tầng (Rust Backend 21 tests, VS Code 107 tests, Webview E2E, Root E2E).
7. [⚡ Đặc Tả SRS Button Business Logic & Event-Driven Schema](./SRS_BUTTON_BUSINESS_LOGIC_EVENT_DRIVEN.md)
   - Đặc tả máy trạng thái FSM, Zero-Dummy UI và ánh xạ 100% nút bấm (`btn.*`) với Automa Core OpenAPI / WebSocket / SSE.
8. [📜 Đặc Tả SRS Select & Dropdown Business Logic (Remote, Virtualized, Search)](./SRS_SELECT_BUSINESS_LOGIC_EVENT_DRIVEN.md)
   - Đặc tả dropdown chuẩn hóa (`select.*`), nạp dữ liệu Remote API, Virtual Scrolling, Fuzzy/Debounce Search và Event-driven Invalidation.
9. [📘 Hướng Dẫn Tích Hợp & Triển Khai OpenAPI (Developer Guide)](./OPENAPI_INTEGRATION_GUIDE.md)
   - Cẩm nang thực hành chuẩn công nghiệp (REST, SSE, WebSocket, Code Recipes, Error Handling, Vue 3 Pinia Composable).
10. [🏛️ Đặc Tả SRS Feature Store & Kiến Trúc Reactive Topology](./SRS_FEATURE_STORE_REACTIVE_ARCHITECTURE.md)
   - Đặc tả 6 Domain Feature Stores, cơ chế phản xạ reactive thời gian thực (SSE/WS to Store), và giao thức kiểm tra chéo dành cho Agent.

---
*Ghi chú: Thư mục `docs/` chỉ đóng vai trò là một Hub điều hướng phẳng. Vui lòng cập nhật tài liệu chi tiết vào `README.md` hoặc thư mục `docs/` của các submodule.*

