---
title: Log Viewer
date: 2026-08-05
tags:
  - vscode
  - feature
  - log
  - custom-editor
---

# Log Viewer

## Tổng quan
Log Viewer là giao diện đọc log thực thi chi tiết của Automa, áp dụng cho các file `*.automa-log.json`. Trình xem này cung cấp Timeline thực thi, bảng dữ liệu (Table data), và biến (Variables view), giúp người dùng dễ dàng debug quá trình chạy.

## Kiến trúc Implementation
File nguồn chính: [[LogCustomEditorProvider.ts]] (`src/providers/LogCustomEditorProvider.ts`)
View HTML: `src/webview/log-editor.html`

Class `LogCustomEditorProvider` implements `vscode.CustomReadonlyEditorProvider` và quản lý View `automa.logEditor`. Chú ý đây là **Readonly** (chỉ đọc), người dùng không thể can thiệp sửa đổi qua giao diện này.

### Các tính năng chính trong Code

1. **Đọc và Phân tích File File**
   - Đọc nội dung JSON bằng `fs.readFile`.
   - Tách các object chính: `job` (thông tin luồng), `logs` (timeline các node execution), và `results` (bảng, biến).
   - Truyền dữ liệu vào `log-editor.html` thông qua template replacement.

2. **Real-time File Watching (Tự động cập nhật)**
   - Khác với `CustomTextEditorProvider` có sẵn bộ lắng nghe document, với File log, extension sử dụng `vscode.workspace.createFileSystemWatcher` để theo dõi file trên đĩa cứng trực tiếp.
   - Khi có sự kiện `onDidChange` hoặc `onDidCreate`, nội dung Webview sẽ tự động được làm mới (`updateWebview`).
   - Kỹ thuật `setTimeout(..., 50)` được áp dụng để tránh race-condition đọc file trong khi Daemon đang ghi dữ liệu (mid-write).

3. **Giao diện Formatting**
   - Dữ liệu `created_at` được tự động parse bằng `toLocaleString('vi-VN')`.
   - Thời gian xử lý (`duration`) được định dạng sang miligiây (ms) hoặc giây (s).
   - Màu sắc Header (Success, Error, Stopped) cũng được sinh ra ngay từ logic của Provider trước khi nhúng vào HTML (biến class `text-vsc-error`, `text-vsc-success`, ...).

> [!TIP]
> Việc sử dụng `createFileSystemWatcher` giúp Log Viewer cực kỳ hữu dụng để mở theo dõi Live Log khi chạy một Workflow hay Fleet ở chế độ daemon background. Bạn sẽ thấy luồng log cuộn liên tục khi dữ liệu mới được đẩy vào file.
