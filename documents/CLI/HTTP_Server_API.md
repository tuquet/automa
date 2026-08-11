---
title: HTTP Server API (Daemon)
date: 2026-08-05
tags:
  - cli
  - server
  - api
  - daemon
---

# 🌐 HTTP Server API (Daemon)

> [!info] Tổng quan
> `automa serve` khởi chạy một máy chủ HTTP ngầm (HTTP Daemon) sử dụng Express. Máy chủ này đóng vai trò như cầu nối để các công cụ bên ngoài (ví dụ: VS Code Extension) giao tiếp, ra lệnh thực thi workflow và theo dõi kết quả thông qua REST API.

## 1. Khởi chạy HTTP Daemon

Bạn có thể chạy server với lệnh `serve`. Port mặc định là `8765`.

```bash
automa serve --port 8765
```

Mã nguồn xử lý CLI nằm tại [ServeCommand.ts](file:///c:/Users/pn.tund2/Documents/Repository/automa-ecosystem/automa-cli/src/commands/ServeCommand.ts).

## 2. Đặc điểm kỹ thuật

Được triển khai tại [core/server/index.ts](file:///c:/Users/pn.tund2/Documents/Repository/automa-ecosystem/automa-cli/src/core/server/index.ts):

- **Graceful Shutdown**: Lắng nghe `SIGINT` và `SIGTERM`, tự động dọn dẹp các tiến trình trình duyệt (`BrowserManager.destroyAll()`) trước khi thoát.
- **Auto-shutdown (Heartbeat)**: Tích hợp cơ chế timeout `30 phút` (`HEARTBEAT_INTERVAL`). Nếu không có bất kỳ request nào đến trong 30 phút, server sẽ tự động tắt để giải phóng tài nguyên. Mỗi khi có request mới, thời gian heartbeat sẽ được làm mới.
- **CORS & Payload**: Hỗ trợ Cross-Origin requests (`cors`) và giới hạn payload JSON lớn (`100mb`) để có thể nhận toàn bộ nội dung của Workflow.
- **Startup Cleanup**: Khi khởi chạy, Daemon sẽ tự động gọi `JobRepository.cleanupOldJobs()` để dọn dẹp database.

## 3. REST API Endpoints

### 3.1. Health Check
Kiểm tra trạng thái của server.
- **URL**: `GET /api/health`
- **Response (200 OK)**:
  ```json
  { "status": "ok", "version": "1.0.0" }
  ```

### 3.2. Thực thi Workflow (Async)
Nhận payload Workflow JSON và đưa vào hàng đợi thực thi ẩn (Asynchronous execution).
- **URL**: `POST /api/jobs/run`
- **Body**: 
  ```json
  {
    "workflowData": { /* JSON của Workflow */ },
    "options": { /* Cấu hình tuỳ chọn */ }
  }
  ```
- **Xử lý**: 
  1. Kiểm tra tính hợp lệ bằng `LinterService`.
  2. Tạo một `jobId` định dạng `cli-job-<timestamp>`.
  3. Uỷ quyền cho `ExecutionManager.executeWithRetries()` để chạy nền, không await để trả response về ngay.
- **Response (202 Accepted)**:
  ```json
  {
    "success": true,
    "jobId": "cli-job-1784881475",
    "message": "Job queued successfully"
  }
  ```

### 3.3. Xem trạng thái Job
Theo dõi trạng thái của một job bằng `jobId`. Đọc từ SQLite.
- **URL**: `GET /api/jobs/:id/status`
- **Response (200 OK)**:
  ```json
  { "jobId": "cli-job-1784881475", "status": "success" }
  ```

### 3.4. Xem log chi tiết của Job
Truy xuất toàn bộ quá trình chạy (step-by-step logs).
- **URL**: `GET /api/jobs/:id/logs`
- **Response (200 OK)**:
  ```json
  {
    "jobId": "cli-job-1784881475",
    "logs": [
      { "id": 1, "job_id": "...", "type": "info", "message": "..." }
    ]
  }
  ```

> [!tip] VS Code Integration
> Thường thì bạn không cần tự khởi chạy Daemon bằng lệnh `automa serve`. Automa VS Code Extension sẽ tự động phát hiện và khởi động Daemon ẩn dưới nền khi workspace được kích hoạt. Lỗi trùng port (`EADDRINUSE`) cũng sẽ được xử lý gọn gàng.
