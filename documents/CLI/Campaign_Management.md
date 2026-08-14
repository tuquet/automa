---
title: Quản lý Hạm đội (Campaign Management)
date: 2026-08-05
tags:
  - cli
  - Campaign
  - orchestration
---

# 🚀 Quản lý Hạm đội (Campaign Management)

> [!info] Tính năng cốt lõi
> Tính năng **Campaign Management** (`automa Campaign`) cho phép cấu hình và điều phối nhiều trình duyệt chạy song song, mỗi trình duyệt (member) có một profile riêng và thực thi các workflow theo lịch trình hoặc dependency (phụ thuộc).

## 1. Tổng quan lệnh `Campaign`

Lệnh `Campaign` là entry point để tương tác với cấu trúc hạm đội được định nghĩa trong file `.Campaigns.json`.

```bash
automa Campaign start ./Campaigns/marketing.Campaigns.json --run-now
```

### Các tuỳ chọn (Options)
- `[path]`: Đường dẫn tới file cấu hình `.Campaigns.json`.
- `-p, --project <name>`: Tên project bên trong vault (mặc định: `crm`).
- `-v, --vault-path <path>`: Đường dẫn chỉ định vault của dự án.
- `--run-now`: Bỏ qua các ràng buộc về lịch trình (schedule) và chạy tất cả các task ngay lập tức.

## 2. Luồng hoạt động (Workflow Flow)

Dựa trên mã nguồn tại [src/core/campaign/mod.rs](file:///c:/Users/pn.tund2/Documents/Repository/automa-ecosystem/automa-core/src/core/campaign/mod.rs), quy trình khởi động một Campaign bao gồm các bước sau:

1. **Phân tích và kiểm tra JSON**: Đọc file `.Campaigns.json`.
2. **Kiểm tra tính hợp lệ (Linter Service Gateway)**: Sử dụng `LinterService.validate(CampaignData, "Campaign")` để đảm bảo file JSON chuẩn Schema. Nếu có lỗi, quá trình sẽ dừng ngay (Fail fast).
3. **Pre-flight Checks**:
   - Quét qua toàn bộ `members` và `tasks`.
   - Kiểm tra xem `workflow_id` của từng task có thực sự tồn tại trong thư mục Vault hay không.
   - Kiểm tra `depends_on`: Đảm bảo các task phụ thuộc tham chiếu đúng đến các `task_id` hợp lệ bên trong cùng member.
4. **Uỷ quyền cho Orchestrator**: Khởi tạo `CampaignOrchestrator` để tiến hành thực thi và lập lịch song song.

## 3. Lên lịch & Concurrency

### Lập lịch (Scheduling)
Mỗi task trong hạm đội có thể được lập lịch với các loại sau:
- `on-start`: Khởi chạy ngay khi Campaign bắt đầu.
- `cron`: Khởi chạy theo biểu thức Cron (ví dụ: `*/5 * * * *`).
- `once`: Khởi chạy một lần vào một thời điểm ISO 8601 cụ thể.
- `delay`: Khởi chạy sau một khoảng thời gian (ví dụ: `5m`, `30s`).

> [!warning] Lưu ý về Process
> Khi bạn chạy lệnh `automa Campaign start` với các task có lịch `cron` hoặc `delay`, process (tiến trình) sẽ được giữ ở trạng thái sống liên tục. Để dừng lại, hãy dùng `Ctrl+C` hoặc lệnh `automa Campaign stop`.

### Concurrency Modes
Các task trong cùng một browser member có thể được xử lý với các chiến lược (Concurrency) khác nhau:
- `queue`: Xếp hàng, chạy tuần tự từng task.
- `parallel`: Chạy song song không cần chờ.
- `skip`: Bỏ qua nếu browser đang bận xử lý task khác.

## 4. Logging & Báo cáo
Mọi log của các task trong Campaign đều được quản lý bởi `CampaignLogger`. Các file log sẽ được lưu cục bộ dưới định dạng `<taskId>_<timestamp>.automa-log.json` và trạng thái sẽ được đồng bộ hoá vào database SQLite nội bộ.
