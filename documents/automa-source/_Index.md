---
title: Automa Chrome Extension Architecture
date: 2026-08-05
tags:
  - extension
  - architecture
---

# 🧩 Automa Chrome Extension (automa-source)

Tài liệu này mô tả kiến trúc của tiện ích mở rộng Automa (Phase B), sử dụng MV3 Native Engine (`chrome.*`) và đã loại bỏ hoàn toàn `webextension-polyfill`.

## Các thành phần chính

- **Background Scripts**: Xử lý logic ngầm, lắng nghe workflow triggers.
- **Offscreen Documents**: (Nếu có) Xử lý logic DOM ngầm.
- **Content Scripts**: Tiêm mã vào trang web mục tiêu để thao tác tự động hóa.
- **VueFlow UI (Studio)**: Giao diện kéo thả cho phép thiết kế workflow trực quan.

Xem chi tiết trong source code tại thư mục `automa-source/`.
