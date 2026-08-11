---
title: Hướng dẫn Build & Phát triển
date: 2026-08-10
tags:
  - extension
  - build
  - dev
---

# 🚀 Hướng dẫn Build & Phát triển Automa Source

Bên cạnh các script build tiêu chuẩn của một tiện ích mở rộng Chrome (`build`, `dev`, `build:prod`), nhánh fork `automa-ext` trong hệ sinh thái của chúng ta được bổ sung thêm các chiến lược build đặc thù để phục vụ cho sự tích hợp chéo (cross-integration).

## Các Lệnh Build Đặc Thù (Cross-Integration)

### 1. `npm run build:runner`
Lệnh này được sử dụng riêng để tạo ra một bản phân phối "Headless" cho **Automa CLI**. 

- **Mục đích:** Khi CLI kích hoạt Chromium/Chrome để chạy workflow ngầm, nó chỉ cần phần Core Engine (Background, Content Scripts, Offscreen) mà không cần giao diện người dùng.
- **Cơ chế hoạt động:** 
  - Đặt cờ biến môi trường `TARGET_ENV=runner` (`__IS_RUNNER__ = true`).
  - Webpack sẽ bỏ qua toàn bộ các entry của UI như `popup`, `newtab`, `sandbox`, `params`...
  - Thay đổi linh hoạt `manifest.json`: Tự động xoá các key như `action`, `options_ui`, `chrome_url_overrides`, `sandbox`. Tên extension được đổi thành `Automa (Runner)`.
  - Giúp dung lượng thư mục đầu ra cực kỳ nhỏ gọn và tải nhanh hơn trên Headless Browser.
- **Output:** Thư mục `build-runner/`.

### 2. `npm run build:vscode`
Lệnh này phục vụ cho việc nhúng trình biên tập Workflow (VueFlow Canvas) vào trực tiếp giao diện của **Automa VS Code Extension**.

- **Mục đích:** Tận dụng lại 100% source code UI của Studio thay vì phải code lại Webview cho VS Code.
- **Cơ chế hoạt động:**
  - Sử dụng file cấu hình Webpack riêng biệt là `webpack.vscode.config.js`.
  - Thay thế `webextension-polyfill` bằng `webextension-polyfill/vscode-compat.js` (file chuyên dụng để giao tiếp giữa Webview và VS Code Extension Host thông qua `acquireVsCodeApi`).
  - Chỉ tập trung build phần UI cốt lõi (entry `newtab`), không build Service Worker hay Content Scripts.
- **Output:** Xuất thẳng mã nguồn (bundle) sang thư mục `../automa-vscode/webview-ui/dist`.

---
*Ghi chú: Việc tách bạch môi trường build này đảm bảo mã nguồn gốc (upstream) không bị ảnh hưởng, giữ nguyên khả năng tương thích và dễ dàng cập nhật (cherry-pick) từ kho lưu trữ chính thức.*
