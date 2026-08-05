---
title: Automa CLI
date: 2026-08-05
tags:
  - cli
  - index
---

# 💻 Automa CLI Toolkit

Chào mừng bạn đến với tài liệu cốt lõi của **Automa CLI**. Đây là "trái tim" thực thi toàn bộ logic của hệ sinh thái Automa ngoài trình duyệt. Tài liệu đã được module hóa theo phương pháp Feature-Driven.

> [!info] Điều hướng (Navigation)
> Sử dụng các liên kết dưới đây để khám phá kiến trúc bên trong CLI.

## ⚙️ Động cơ Thực thi (Core Engine)
- [[Execution_Engine]]: Phân tích vòng đời chạy của một Workflow.
- [[Browser_Management]]: CDP Polling, khởi tạo Chromium, và giao tiếp Extension MV3.
- [[Data_Sanitization]]: Tiền xử lý JSON, sửa lỗi NanoID để chống crash Studio.

## 🚀 Tính năng Nâng cao (Server & Fleet)
- [[Fleet_Management]]: Chạy workflow song song, cron scheduling và điều phối đa tiến trình.
- [[HTTP_Server_API]]: Endpoint API khi chạy CLI dưới dạng Daemon.
- [[Local_Database]]: Kiến trúc SQLite quản lý trạng thái, logs và dọn dẹp dung lượng.
