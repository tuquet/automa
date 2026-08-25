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

---
*Ghi chú: Thư mục `docs/` chỉ đóng vai trò là một Hub điều hướng phẳng. Vui lòng cập nhật tài liệu chi tiết vào `README.md` hoặc thư mục `docs/` của các submodule.*

