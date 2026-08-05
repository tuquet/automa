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
> Execution Engine là trái tim của Automa CLI, chịu trách nhiệm cho vòng đời thực thi các workflow: từ phân tích JSON, chuẩn bị dữ liệu, cho đến tiêm vào trình duyệt và thu thập log kết quả.

## Các giai đoạn thực thi (Execution Workflow)

Quá trình thực thi của CLI bám sát sơ đồ phân luồng như sau:

1. **Chuẩn bị Dữ liệu & Pre-flight**
   - Đọc JSON từ file (hoặc Vault).
   - Tự động chuẩn hóa bằng [[Data_Sanitization|WorkflowSanitizer]] (cấp NanoID, sửa lỗi cấu trúc).
   - Xác thực cú pháp và logic cơ bản với Linter (Kiểm tra JSON Schema, orphan edges, biến chưa khai báo).
   - Quét sự phụ thuộc (Dependency tree): tìm và thu thập các sub-workflows hoặc packages được tham chiếu trong workflow chính.

2. **Quản lý Cấu hình & Biến (Variables Resolution)**
   - CLI kết hợp biến môi trường theo độ ưu tiên: `CLI flag > .vscode/settings.json > global DB > default config`.
   - Các biến Global (`$$VAR`) được tiêm thẳng vào ngữ cảnh.
   - Nếu chạy ở chế độ tương tác (interactive), CLI có thể prompt người dùng nhập các tham số trigger.

3. **Tiêm Dữ liệu vào Môi trường Extension (Injection Phase)**
   - Trình duyệt được khởi động cùng Automa Extension (unpackaged).
   - Chờ Service Worker sẵn sàng bằng cách dùng Chrome DevTools Protocol (CDP) polling.
   - Tiêm JSON workflow và tất cả dependency vào `chrome.storage.local`.
   - Gửi tín hiệu thực thi qua việc tạo Offscreen document hoặc thông điệp background: `background--workflow:execute`.

4. **Theo dõi Thực thi & Ghi Log (Monitoring & Logging)**
   - Lắng nghe log output thông qua IndexedDB (Polling) hoặc CDP (CLI_NOTIFY console logs).
   - Xử lý các sự kiện runtime, thu thập error nếu workflow thất bại.
   - Xuất dữ liệu thực thi ra SQLite (history) và tạo file JSON báo cáo (`*.automa-log.json`).
   - Đóng trình duyệt tự động sau khi kết thúc (trừ khi có cờ `--keep-browser-open`).

## Các module tham gia
- **`WorkflowRunner` / `ExecutionManager`**: Trực tiếp điều phối luồng thực thi tổng thể.
- **`WorkflowInjector`**: Chuyên tiêm workflow JSON vào Extension storage của trình duyệt đang chạy.
- **`FleetLogger`**: Thu thập kết quả trả về, ghi ra database.
