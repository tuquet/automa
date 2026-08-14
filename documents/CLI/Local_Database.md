---
title: Cơ sở dữ liệu Cục bộ (Local Database)
date: 2026-08-05
tags:
  - cli
  - database
  - sqlite
  - logs
---

# 🗄️ Cơ sở dữ liệu Cục bộ (SQLite)

> [!info] Vai trò của SQLite trong CLI
> Automa CLI sử dụng SQLite (`better-sqlite3`) để lưu trữ lịch sử thực thi, trạng thái các job (công việc), và thông tin log (nhật ký) của từng bước thực thi trong quá trình chạy. Điều này giúp tính năng lịch sử (`automa history`) và truy vấn log chi tiết (`automa log <jobId>`) hoạt động nhanh, độc lập và ổn định.

## 1. Cấu trúc Database

Cơ sở dữ liệu được lưu tại đường dẫn cấu hình mặc định: `~/.automa-cli/run/log.sqlite` (hoặc `~/.automa-cli-dev/run/log.sqlite` khi ở môi trường dev local, có thể bị ghi đè hoàn toàn thông qua biến môi trường `AUTOMA_HOME`). 
Mã nguồn khởi tạo: [core/db/index.ts](file:///c:/Users/pn.tund2/Documents/Repository/automa-ecosystem/automa-cli/src/core/db/index.ts).

### Đặc điểm khởi tạo:
- Chế độ **WAL** (`journal_mode = WAL`): Giúp tăng hiệu năng đọc/ghi đồng thời, tránh lock khi có nhiều browser đang chạy song song trong Campaign và báo cáo log về cùng lúc.

### Schema

#### Bảng `jobs`
Lưu trữ thông tin tổng quan của mỗi lần chạy workflow.
- `id` (TEXT PRIMARY KEY): Thường có dạng `cli-job-<timestamp>` hoặc được gắn bởi hệ thống.
- `name` (TEXT): Tên của workflow/job.
- `data` (TEXT): Payload của workflow dưới dạng JSON. Bổ sung trường `results` sau khi chạy xong để trả về variables và table outputs.
- `options` (TEXT): Cấu hình chạy (ví dụ timeouts, settings) dạng JSON.
- `status` (TEXT): Trạng thái của job (`running`, `success`, `error`, v.v.).
- *(Các trường `created_at` và `updated_at` tự sinh).*

#### Bảng `logs`
Lưu trữ log chi tiết từng bước (step) cho các job.
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `job_id` (TEXT): Khóa ngoại tham chiếu `jobs(id)` với `ON DELETE CASCADE`.
- `type` (TEXT): Loại log (info, error, warning, success, v.v.).
- `message` (TEXT): Nội dung chi tiết của log.

## 2. API Quản lý Job (JobRepository)

Logic tương tác với database được module hoá tại [core/db/JobRepository.ts](file:///c:/Users/pn.tund2/Documents/Repository/automa-ecosystem/automa-cli/src/core/db/JobRepository.ts).

### Các hàm chính:
- `createJob(jobId, name, data, options, status)`: Tạo record trong bảng `jobs` (trả về boolean nếu thành công).
- `updateJobStatus(jobId, status)`: Cập nhật cột `status`.
- `finishJob(jobId, status, results, duration)`: Cập nhật trạng thái kèm theo kết quả đầu ra (`results`), được `ExecutionManager` gọi khi một luồng chạy kết thúc.
- `insertLog(jobId, type, message)`: Thêm một bản ghi vào bảng `logs`. Bỏ qua một cách im lặng (silent fail) nếu có lỗi.
- `getJobStatus(jobId)`: Truy vấn trạng thái của job.
- `getJobLogs(jobId)`: Lấy mảng toàn bộ logs theo `job_id`, sắp xếp tăng dần theo ID (thứ tự thời gian).

### Cơ chế dọn dẹp tự động (Cleanup)
Vì số lượng log của workflow có thể phình to rất nhanh, `JobRepository.cleanupOldJobs()` sẽ được gọi mỗi khi HTTP Server khởi động, để xoá dữ liệu rác:
- Chặn lại tối đa **100 Jobs mới nhất**.
- Chặn lại các **logs thuộc về 100 Jobs** đó (xóa `logs` không nằm trong danh sách 100 Jobs mới nhất).
- Điều này giúp tránh database bị đầy ổ cứng người dùng.

## 3. Các lệnh CLI liên quan

Dữ liệu được lưu trữ trong SQLite này sẽ được truy xuất trực tiếp bởi các lệnh của người dùng:

- **Lệnh `automa history`**: Hiển thị bảng danh sách các jobs chạy gần đây (tối đa theo flag `--limit`). Hỗ trợ xuất bằng `--json`.
- **Lệnh `automa log <jobId>`**: Lấy chi tiết các step logs (qua hàm `getJobLogs`) của một `jobId` cụ thể in ra dạng text hoặc JSON.
