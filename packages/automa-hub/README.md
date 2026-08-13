<div align="center">
  <h1>Automa Hub (automa-hub)</h1>
  <p><strong>Nền tảng chia sẻ Kịch bản (Workflow Marketplace & Registry)</strong></p>
</div>

---

`automa-hub` là một Module nền tảng thuộc chiến lược **Horizon 2 (Grow)** của Hệ sinh thái Automa. Nó đóng vai trò như một Package Registry (tương tự npm), cho phép cộng đồng lập trình viên và người dùng tự động hóa dễ dàng chia sẻ, tìm kiếm và tải xuống các Workflow/Campaign.

---

## 🚀 Tính Năng Lõi

- **Khám phá (Discovery):** Giao diện tìm kiếm Workflow dựa trên thẻ (Tags), ngành nghề (Marketing, SEO, Data Scraping) và độ phổ biến.
- **Cài đặt 1 Click:** Tích hợp trực tiếp với `automa-cli`. Bạn chỉ cần gõ lệnh `automa install <tên-workflow>`, hệ thống sẽ tự tải về và giải nén vào Local Vault của bạn.
- **Bảo chứng Phiên bản (Versioning):** Mỗi kịch bản đẩy lên Hub đều được quản lý theo Semantic Versioning, giúp người dùng an tâm cập nhật mà không sợ gãy vỡ (breaking changes) tiến trình cũ.
- **Schema Validation:** Mọi workflow trước khi được đưa lên Hub đều phải đi qua bộ lọc **Auto-Sanitization & Linting** nội bộ để đảm bảo cấu trúc JSON hợp lệ và bảo mật.

## 🏗️ Trạng Thái Phát Triển

Phân hệ này hiện đang trong giai đoạn phát triển (Work-in-Progress). Kiến trúc dự kiến:
- **Backend:** Supabase / Node.js (Quản lý User Auth và Meta-data).
- **Frontend:** Next.js (Web Marketplace) hoặc tích hợp thẳng vào VS Code Webview.
- **Storage:** Lưu trữ các gói JSON nén trên Cloud Storage.
