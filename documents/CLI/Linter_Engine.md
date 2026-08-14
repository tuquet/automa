---
title: Linter Engine
date: 2026-08-05
tags:
  - cli
  - linter
  - validation
  - cross-reference
---

# Linter Engine (`automa lint`)

> [!info]
> Linter Engine là trái tim của hệ thống kiểm lỗi tĩnh trong hệ sinh thái Automa. Nó không chỉ kiểm tra cú pháp JSON đơn thuần mà còn có khả năng "nhìn xuyên thấu" qua lại giữa các file trong Vault để đảm bảo tính toàn vẹn của liên kết.

## Các chức năng chính

### 1. Phân tích cú pháp cơ bản (Schema Validation)
Được cung cấp bởi `LinterService.validate(workflowData, 'workflow')`. Nó kiểm tra:
- Các trường bắt buộc như `id`, `name`, `icon`.
- Định dạng hợp lệ của `id` (phải là chuẩn nanoid hoặc `uuid`).
- Khóa `drawflow` và `edges` phải chính xác, các block kết nối không bị đứt đoạn vô lý.

### 2. Kiểm tra tham chiếu chéo (Cross-Reference Validation)
Đây là tính năng độc quyền của Automa CLI khi làm việc với Automa Vault.
Khi chạy lệnh:
```bash
automa lint "Campaigns/search.Campaigns.json" -v .
```
CLI sẽ kích hoạt `WorkflowRepository.findWorkflowRecursive` và tiến hành:

#### Đối với Campaign (`.Campaigns.json`)
- **Quét Profiles**: Mỗi `browser_id` được khai báo trong thành viên hạm đội (Campaign members) sẽ được đối chiếu với thư mục `profiles/` trong Vault. Nếu không tìm thấy file `<browser_id>.profile.json`, Linter sẽ cảnh báo `[Missing Profile]`.
- **Quét Workflows**: Tương tự, nếu `workflow_id` không tồn tại ở bất kỳ đâu trong thư mục `workflows/`, Linter sẽ cảnh báo `[Missing Workflow]`.

#### Đối với Workflow (`.automa.json` hoặc `.workflow.json`)
- **Block Execute Workflow**: Phân tích sâu vào tham số của block `execute-workflow`. Nếu tham số `workflowId` trỏ đến một ID không có thực trong hệ thống thư mục, Linter sẽ cảnh báo `[Missing Workflow Reference]`. Điều này đặc biệt hữu dụng cho các hệ thống chia nhỏ workflow thành nhiều hàm con (Sub-workflows).

## Tích hợp VS Code (Diagnostics)
Các cảnh báo sinh ra bởi `LinterService` sẽ được VS Code Extension hứng trọn, từ đó tạo ra các **đường gạch chân lượn sóng màu đỏ (Errors) hoặc màu cam (Warnings)** ngay trên file JSON mà người dùng đang mở.
 Xem chi tiết: [[Linter_Diagnostics]]
