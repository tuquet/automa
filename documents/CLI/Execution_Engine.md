---
title: Execution Engine
date: 2026-08-05
tags:
  - cli
  - execution
  - core
---

# Execution Engine (Lõi Thực Thi)

> [!info]
> Execution Engine là trái tim của Automa Core, chịu trách nhiệm cho vòng đời thực thi các workflow: từ phân tích JSON, chuẩn bị dữ liệu, cho đến tiêm vào trình duyệt và thu thập log kết quả thông qua kiến trúc xử lý bất đồng bộ `tokio`.

## Các giai đoạn thực thi (Execution Workflow)

Quá trình thực thi của Daemon bám sát sơ đồ phân luồng như sau:

1. **Chuẩn bị Dữ liệu & Pre-flight**
   - Đọc JSON từ file (hoặc Vault).
   - Tự động chuẩn hóa bằng [[Data_Sanitization|WorkflowSanitizer]] (cấp NanoID, sửa lỗi cấu trúc).
   - Xác thực cú pháp và logic cơ bản với Linter (Kiểm tra JSON Schema, orphan edges, biến chưa khai báo).
   - Quét sự phụ thuộc (Dependency tree): tìm và thu thập các sub-workflows hoặc packages được tham chiếu trong workflow chính.

2. **Quản lý Cấu hình & Biến (Variables Resolution)**
   - Daemon kết hợp biến môi trường theo độ ưu tiên: `Request payload > Globals Vault > default config`.
   - Các biến Global (`$$VAR`) được tiêm thẳng vào ngữ cảnh.
   - Các tác vụ parse JSON phức tạp hoặc mã hóa bảo mật được chạy qua `tokio::task::spawn_blocking` để không block worker threads.

3. **Tiêm Dữ liệu vào Môi trường Extension (Injection Phase)**
   - Trình duyệt được khởi động cùng Automa Extension (unpackaged).
   - Chờ Service Worker sẵn sàng bằng cách dùng Chrome DevTools Protocol (CDP) polling.
   - Tiêm JSON workflow và tất cả dependency vào `chrome.storage.local`.
   - Gửi tín hiệu thực thi qua việc tạo Offscreen document hoặc thông điệp background: `background--workflow:execute`.

4. **Theo dõi Thực thi & Ghi Log (Monitoring & Logging)**
   - Lắng nghe log output thông qua SSE streaming.
   - Xử lý các sự kiện runtime với cơ chế bắt lỗi nghiêm ngặt (`thiserror`), loại bỏ `panic!`.
   - Xuất dữ liệu thực thi ra SQLite (history).
   - Đóng trình duyệt tự động sau khi kết thúc (trừ khi có cờ `--keep-browser-open`).

## Các module tham gia
- **`WorkflowRunner` / `ExecutionManager`**: Trực tiếp điều phối luồng thực thi tổng thể.
- **`WorkflowInjector`**: Chuyên tiêm workflow JSON vào Extension storage của trình duyệt đang chạy.
- **`CampaignLogger`**: Thu thập kết quả trả về, ghi ra database.
