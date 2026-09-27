# Automa Web Studio Standalone

Thư mục này chứa toàn bộ mã nguồn của **Automa Web Studio Standalone** — trình soạn thảo quy trình tự động hóa đồ thị trực quan (Visual Workflow Canvas Editor) chạy độc lập trên nền web mà không phụ thuộc vào Chrome Extension APIs.

## 📚 Tài liệu Đặc tả Yêu cầu Kỹ thuật (SRS)

Xem chi tiết đặc tả kỹ thuật, kiến trúc, sơ đồ luồng dữ liệu và yêu cầu chức năng tại:
👉 **[Software Requirements Specification (SRS.md)](./SRS.md)**

---

## 🚀 Lệnh Phát triển & Biên dịch

```bash
# Chạy Studio ở chế độ Live Dev (Hot-Reload)
pnpm run dev:source:studio

# Biên dịch bản build Standalone (xuất ra dist/studio/)
pnpm run build:studio

# Chạy toàn bộ hệ sinh thái (Rust Backend + Studio + VS Code)
pnpm run dev:all
```

## 🌐 Đường dẫn truy cập cục bộ
Khi `automa-core` đang chạy trên cổng `8765`:
```text
http://127.0.0.1:8765/studio/
```
