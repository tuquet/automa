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
Log Viewer là giao diện đọc log thực thi chi tiết của Automa. Trước đây, log được đọc từ các file `*.automa-log.json`, nhưng ở kiến trúc hiện tại, Log Viewer có khả năng lấy dữ liệu tập trung thông qua cơ sở dữ liệu **SQLite** của CLI bằng cơ chế **Virtual URI**. Trình xem này cung cấp Timeline thực thi, bảng dữ liệu (Table data), và biến (Variables view), giúp người dùng dễ dàng debug quá trình chạy.

## Kiến trúc Implementation
File nguồn chính: [[LogCustomEditorProvider.ts]] (`src/providers/LogCustomEditorProvider.ts`)
View HTML: `src/webview/log-editor.html`

Class `LogCustomEditorProvider` implements `vscode.CustomReadonlyEditorProvider` và quản lý View `automa.logEditor`. Chú ý đây là **Readonly** (chỉ đọc), người dùng không thể can thiệp sửa đổi qua giao diện này.

### Các tính năng chính trong Code

1. **Đọc Dữ Liệu qua Virtual URI**
   - Thay vì đọc file hệ thống bằng `fs.readFile`, Extension sử dụng `LogCustomEditorProvider.showLogForJobId()` khi nhận được URI dạng `automa-log://<jobId>`.
   - Hàm này sẽ gọi trực tiếp câu lệnh ngầm của CLI: `automa log <jobId> --json` để lấy đầy đủ chi tiết của job.
   - CLI trả về một payload chứa `job`, `logs`, và `results` (được đọc từ SQLite).
   - Truyền dữ liệu vào `log-editor.html` thông qua template replacement.

2. **Chế độ xem File Truyền thống (Legacy Custom Editor)**
   - Khả năng đọc file `*.automa-log.json` vẫn được giữ lại qua `resolveCustomEditor` để tương thích ngược.
   - Khi có sự kiện `onDidChange` hoặc `onDidCreate` từ file hệ thống, nội dung Webview sẽ tự động được làm mới (`updateWebview`).
   - Kỹ thuật `setTimeout(..., 50)` được áp dụng để tránh race-condition khi ghi dữ liệu.

3. **Giao diện Formatting**
   - Dữ liệu `created_at` được tự động parse bằng `toLocaleString('vi-VN')`.
   - Thời gian xử lý (`duration`) được định dạng sang miligiây (ms) hoặc giây (s).
   - Màu sắc Header (Success, Error, Stopped) cũng được sinh ra ngay từ logic của Provider trước khi nhúng vào HTML (biến class `text-vsc-error`, `text-vsc-success`, ...).

> [!TIP]
> Việc sử dụng `createFileSystemWatcher` giúp Log Viewer cực kỳ hữu dụng để mở theo dõi Live Log khi chạy một Workflow hay Campaign ở chế độ daemon background. Bạn sẽ thấy luồng log cuộn liên tục khi dữ liệu mới được đẩy vào file.
