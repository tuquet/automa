---
title: Workflow Preview
date: 2026-08-05
tags:
  - vscode
  - feature
  - workflow
  - custom-editor
---

# Workflow Preview

## Tổng quan
Workflow Preview là một Custom Visual Editor trong Automa VS Code Extension, được thiết kế để mở và xem trước các file `*.automa.json`. Giao diện này cung cấp trải nghiệm trực quan cho người dùng thay vì phải đọc mã JSON thuần túy.

Nó cho phép xem cấu trúc, tinh chỉnh thông số (Trigger Parameters), thiết lập các biến toàn cục (Global Data), cấu hình (Settings), và xem/cập nhật thông tin Metadata (Properties).

## Kiến trúc Implementation
File nguồn chính: [[WorkflowPreviewEditorProvider.ts]] (`src/providers/WorkflowPreviewEditorProvider.ts`)
View HTML: `src/webview/workflow-preview.html` (và `package-preview.html` cho dạng Reusable Package)

Class `WorkflowPreviewEditorProvider` implements `vscode.CustomTextEditorProvider` để đăng ký loại view `automa.workflowPreview`.

### Các tính năng chính trong Code

1. **Auto-Sanitization**
   - Khi file được load, extension sẽ gọi `WorkflowSanitizer.sanitize(json)` (từ `src/core/Sanitizer`).
   - Nếu phát hiện và sửa đổi được các lỗi cấu trúc (ví dụ ID node không hợp lệ), nó sẽ ngầm tạo một `vscode.WorkspaceEdit` để cập nhật lại cấu trúc JSON hợp lệ vào bộ đệm (document buffer).

2. **Parameter Extraction (Trích xuất tham số tự động)**
   - Khám phá các tham số đầu vào được dùng ngầm qua biểu thức chính quy (Regex):
     - Dạng mustache: `{{variables.xyz}}`
     - Dạng hàm: `automaRefData('variables', 'xyz')`
   - Quét cấu trúc `drawflow.nodes` để tìm node kiểu `BlockTrigger` hoặc có nhãn là `trigger`, sau đó lấy mảng `parameters`.
   - Kết hợp các tham số này để tạo giao diện nhập giá trị lúc chạy (Run).
   - Tự động điền giá trị mặc định cho các biến ngầm định nếu có khai báo trong `automa.vault.run.globalVariables` của Workspace Settings.

3. **Chế độ hiển thị linh hoạt (Package vs Workflow)**
   - Nhận diện `isPackage` nếu `settings.asBlock === true` hoặc JSON chứa các mảng `inputs`/`outputs`.
   - Dựa vào cờ này, Provider sẽ render `package-preview.html` hoặc `workflow-preview.html` tương ứng.

4. **Webview Communication**
   Sử dụng cơ chế `postMessage` của Webview để xử lý các hành động từ UI:
   - `runWorkflow`: Kích hoạt hàm `runWorkflowCommand()` cùng các tham số người dùng nhập.
   - `saveWorkflow`: Nhận thông tin Metadata mới (Name, Description, Settings...) và lưu ngược lại vào `document` sử dụng `WorkspaceEdit`.
   - `openInStudio`: Gọi VS Code command `automa.openInStudio`.

5. **Theo dõi thay đổi (Document Watcher)**
   - Lắng nghe `vscode.workspace.onDidChangeTextDocument` để update Webview tự động khi JSON bị thay đổi (từ các công cụ khác hoặc khi chuyển đổi sang JSON Text Editor).

> [!INFO]
> File template HTML nhận dữ liệu qua việc *string replace* các placeholder như `{{JSON_NAME}}`, `{{INJECT_PARAMS_DATA}}` trước khi gán vào `webviewPanel.webview.html`.
