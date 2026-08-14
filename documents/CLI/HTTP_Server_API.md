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
> `automa-core serve` khởi chạy một máy chủ HTTP ngầm (HTTP Daemon) sử dụng Rust/Axum. Máy chủ này đóng vai trò như cầu nối để các công cụ bên ngoài (ví dụ: VS Code Extension) giao tiếp, ra lệnh thực thi workflow và theo dõi kết quả thông qua REST API.

## 1. Khởi chạy HTTP Daemon

Bạn có thể chạy server với lệnh `serve`. Port mặc định là `8765`.

```bash
cargo run --bin automa-core serve --port 8765
```

Mã nguồn xử lý CLI nằm tại [src/api/server.rs](file:///c:/Users/pn.tund2/Documents/Repository/automa-ecosystem/automa-core/src/api/server.rs).

## 2. Đặc điểm kỹ thuật

Được triển khai tại [src/api/server.rs](file:///c:/Users/pn.tund2/Documents/Repository/automa-ecosystem/automa-core/src/api/server.rs):

- **Graceful Shutdown**: Lắng nghe `ctrl_c`, tự động dọn dẹp các tiến trình trình duyệt trước khi thoát.
- **Shared State Management**: Quản lý State chia sẻ qua Axum bằng `Arc<T>` kết hợp `tokio::sync::RwLock` hoặc `tokio::sync::Mutex` để đảm bảo an toàn bộ nhớ khi truy xuất đồng thời từ nhiều thread.
- **CORS & Bind IP An toàn**: 
  - Máy chủ **BẮT BUỘC** phải bind mặc định vào `127.0.0.1` (localhost) để ngăn chặn rò rỉ mạng LAN/Internet.
  - Cấu hình `tower-http` CORS **BẮT BUỘC** phải giới hạn nghiêm ngặt (chỉ cho phép localhost hoặc VS Code Webview origin), **TUYỆT ĐỐI KHÔNG** dùng `CorsLayer::permissive()`.
- **Startup Cleanup**: Khi khởi chạy, Daemon sẽ tự động gọi dọn dẹp database SQLite.

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
