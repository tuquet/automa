<div align="center">
  <h1>Automa Knowledge Base (documents)</h1>
  <p><strong>Cơ Sở Dữ Liệu Tri Thức & Kiến Trúc (Obsidian Vault)</strong></p>
</div>

---

Thư mục `documents/` không chỉ là nơi chứa file Markdown đơn thuần, mà là một **Obsidian Vault** hoàn chỉnh, đóng vai trò là "bộ não" lưu trữ toàn bộ kiến trúc, quy tắc thiết kế (Guidelines) và tài liệu kỹ thuật của Hệ sinh thái Automa.

---

## 🧭 Cấu Trúc Phân Hệ Tài Liệu

Tài liệu được chia thành các phân hệ tương ứng với cấu trúc Monorepo để dễ dàng tra cứu:

- **`Core/`**: Chứa triết lý sản phẩm, lộ trình dài hạn (Roadmaps), cấu trúc lưu trữ và quy tắc bảo mật.
- **`CLI/`**: Giải phẫu chi tiết về Node Daemon, hệ thống Anti-detection, Linter Engine và cơ chế HTTP Server.
- **`VSCode/`**: Tài liệu cho nhóm phát triển VS Code Extension (Cách gọi RPC, Webview UI, Linter Diagnostics).
- **`Ext/`**: Giải phẫu kiến trúc MV3 gốc, cơ chế loại bỏ Polyfill và quy tắc Alias lúc Build.

## 🚀 Hướng Dẫn Truy Cập (Dành cho Dev & AI)

1. **Mở bằng Obsidian (Dành cho Con người):**
   - Tải và cài đặt phần mềm [Obsidian](https://obsidian.md/).
   - Chọn "Open folder as vault" và trỏ vào thư mục `documents/` này.
   - Bấm `Ctrl+G` để mở Graph View và xem mối quan hệ giữa các module hệ thống.
   
2. **Truy xuất tự động (Dành cho AI Agents):**
   - Tất cả các Assistant/Agents khi làm việc với codebase này **bắt buộc** phải đọc file `Home.md` và `_meta/All_Documents.base` đầu tiên để hiểu bức tranh toàn cảnh trước khi viết code.

## 📝 Quy Tắc Đóng Góp (Contribution Rules)

- Mỗi khi có sự thay đổi lớn về kiến trúc (Ví dụ: Thêm tính năng IPC mới, thay đổi luồng Runner), Developer/AI Agent **phải chủ động cập nhật** tài liệu tương ứng trong Vault này.
- Sử dụng thẻ Tag (như `#cli`, `#vscode`, `#core`) ở phần Frontmatter của file để hệ thống Dataview tự động phân loại.
