---
name: automa-vscode
description: Hướng dẫn phát triển VS Code Extension cho Automa (automa-vscode), tích hợp Linter Diagnostics, Context Menu commands và VS Code Tasks.
---

# Automa VS Code Extension (`automa-vscode`)

Tài liệu này cung cấp hướng dẫn kiến trúc và quy trình phát triển cho submodule **Automa VS Code Extension** (`automa-vscode`).

---

## 1. Extension Architecture & Key Responsibilities

Submodule `automa-vscode` đóng vai trò là giao diện tích hợp trực tiếp trong môi trường IDE người dùng:
1. **Context Menu Commands**: Cho phép nhấp chuột phải vào file `.json` đại diện cho Workflow hoặc Package để gọi các thao tác:
   - `Automa: Lint Check Workflow/Package`
   - `Automa: Open in Automa Studio`
   - `Automa: Execute Workflow`
2. **Diagnostics Provider (Linter Integration)**: Đọc kết quả từ Linter (`automa-cli-lint`) và hiển thị lỗi trực tiếp lên panel **Problems** của VS Code.
3. **Auto-Sanitization on Load**: Tự động chuyển đổi cấu hình node cũ (ví dụ: node ID `n1`, thiếu `type`) thành nanoID hợp lệ trước khi đẩy dữ liệu vào Studio.

---

## 2. Integration with Linter & Diagnostics

VS Code Extension tích hợp trực tiếp bộ quy tắc của `automa-cli-lint`:

```typescript
import * as vscode from 'vscode';

const diagnosticCollection = vscode.languages.createDiagnosticCollection('automa-linter');

export function updateDiagnostics(document: vscode.TextDocument, lintErrors: Array<{ line: number; message: string; severity: 'error' | 'warning' }>) {
  const diagnostics: vscode.Diagnostic[] = lintErrors.map(err => {
    const range = new vscode.Range(err.line, 0, err.line, 100);
    const severity = err.severity === 'error' 
      ? vscode.DiagnosticSeverity.Error 
      : vscode.DiagnosticSeverity.Warning;
    return new vscode.Diagnostic(range, err.message, severity);
  });

  diagnosticCollection.set(document.uri, diagnostics);
}
```

> [!IMPORTANT]
> **Linter UX Constraint**: Trong môi trường Editor (VS Code Extension), các sai lệch schema cấu trúc không nghiêm trọng NÊN được báo dưới dạng `Warning` thay vì `Error` để tránh gây phiền hà cho người dùng trong quá trình phác thảo workflow.

---

## 3. Auto-Sanitization Protocol

Khi người dùng mở một workflow legacy từ cộng đồng (thường có node ID dạng `n1`, `n2` hoặc thiếu trường `type` root):
1. **Phát hiện**: Lắng nghe sự kiện mở Studio từ Context Menu hoặc Command Palette.
2. **Sanitize trước khi Load**:
   - Thay thế tất cả ID dạng `n1` bằng `nanoid(21)` khớp regex `/^[A-Za-z0-9_-]{21}$/`.
   - Cập nhật lại kết nối edge handles tương ứng.
   - Gán mặc định `type: 'BlockBasic'` nếu thuộc tính `type` bị thiếu.
3. **Inject**: Đẩy JSON đã được làm sạch vào `browser.storage.local` thông qua Service Worker Popup Injector.

---

## 4. Build, Packaging & Tasks

Quản lý chu kỳ phát triển của `automa-vscode`:

* **Development Watch**:
  ```bash
  npm run watch
  ```
* **Packaging VSIX**:
  ```bash
  npx @vscode/vsce package
  ```
* **VS Code Task Integration**:
  Trong `.vscode/tasks.json` của workspace, cấu hình task `Build VSCode Extension` để tự động compile trước khi nhấn `F5` chạyExtension Development Host.

---

## 5. UI State Sync Architecture

Để đảm bảo VS Code Sidebar (TreeViews) luôn phản ánh đúng trạng thái thực tế của file system mà không cần người dùng nhấn nút Refresh thủ công:
- **`createFileSystemWatcher`**: Lắng nghe sự kiện (create/change/delete) trên các file `.json`, `.yaml` trong `.vault/` hoặc `globals/` để trigger `refresh()` lên `ProviderManager`.
- **`onDidChangeVisibility`**: Tự động fetch data mới nhất mỗi khi người dùng chuyển tab và focus vào một panel cụ thể.
- **`EventEmitter`**: Gọi `this._onDidChangeTreeData.fire()` để ép VS Code vẽ lại cây thư mục.
