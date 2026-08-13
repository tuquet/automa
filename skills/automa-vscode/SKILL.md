---
name: automa-vscode
description: Hướng dẫn phát triển VS Code Extension cho Automa (automa-vscode), tích hợp Linter Diagnostics, Context Menu commands và VS Code Tasks.
---

# Automa VS Code Extension (`automa-vscode`)

**BẮT BUỘC** tuân thủ quy định kiến trúc và quy trình phát triển submodule `automa-vscode`.

---

## 1. Extension Architecture & Key Responsibilities

`automa-vscode` **BẮT BUỘC** đảm nhiệm các vai trò sau:
1. **Context Menu Commands**: Cung cấp thao tác cho file `.json`:
   - `Automa: Lint Check Workflow/Package`
   - `Automa: Open in Automa Studio`
   - `Automa: Execute Workflow`
2. **Diagnostics Provider (Linter Integration)**: Hiển thị lỗi từ Daemon API `/api/lint` lên panel **Problems**.
3. **Auto-Sanitization on Load**: Tự động chuyển đổi cấu hình node cũ thành nanoID hợp lệ trước khi đẩy vào Studio.

---

## 2. Integration with Linter & Diagnostics

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
> **Linter UX Constraint**: **BẮT BUỘC** báo cáo sai lệch schema không nghiêm trọng dưới dạng `Warning`, **TUYỆT ĐỐI KHÔNG** dùng `Error`.

---

## 3. Auto-Sanitization Protocol

**KHI MỞ** workflow legacy:
1. **Phát hiện**: Lắng nghe sự kiện mở Studio.
2. **Sanitize trước khi Load**:
   - **BẮT BUỘC** thay thế ID dạng `n1` bằng `nanoid(21)` khớp `/^[A-Za-z0-9_-]{21}$/`.
   - **BẮT BUỘC** cập nhật kết nối edge handles.
   - **BẮT BUỘC** gán `type: 'BlockBasic'` nếu thuộc tính `type` bị thiếu.
3. **Inject**: Đẩy JSON sạch vào `browser.storage.local`.

---

## 4. Daemon API Communication

- **BẮT BUỘC** sử dụng REST/HTTP: Lớp `TaskRunner.ts` luôn gọi API qua HTTP POST/GET (ví dụ: `submitJob`).
- **TUYỆT ĐỐI KHÔNG** gọi lệnh CLI trực tiếp thông qua `child_process.exec` hay `vscode.ProcessExecution` để thực thi script (ngoại trừ lệnh khởi động Daemon). Mọi yêu cầu xử lý **BẮT BUỘC** gửi qua API tới Daemon.

---

## 5. Native Debugger UI Reuse

- **TUYỆT ĐỐI KHÔNG** xây dựng lại UI Inspector bên trong VS Code.
- **BẮT BUỘC** dùng Daemon để gọi Automa Studio nguyên bản từ trình duyệt thông qua API.
- Extension đóng vai trò là **Thin Client**, chỉ hiển thị giao diện cấu hình tĩnh hoặc Welcome Panel và đẩy mọi tác vụ nặng sang Daemon xử lý.

---

## 6. Build, Packaging & Tasks

* **Packaging VSIX**:
  **BẮT BUỘC** dùng cờ `--no-dependencies`:
  ```bash
  npx @vscode/vsce package --no-dependencies
  ```

* **Composite Debugging Flow (F5)**:
  **BẮT BUỘC** sử dụng task tổng `Workspace: Dev VSCode` (`F5`) để chạy song song:
  1. `Workspace: Dev Source Runner`
  2. `Workspace: Dev VSCode Host`

---

## 7. UI State Sync Architecture

**BẮT BUỘC** áp dụng các cơ chế sau để đồng bộ VS Code Sidebar:
- **`createFileSystemWatcher`**: Trigger `refresh()` khi có thay đổi file `.json`, `.yaml`.
- **`onDidChangeVisibility`**: Tự động fetch data khi chuyển tab.
- **`EventEmitter`**: Gọi `this._onDidChangeTreeData.fire()` để vẽ lại cây thư mục.

---

## 8. Welcome Panel & UI Integration

1. **Welcome Panel Siêu Nhẹ (Thin Client):**
   - **TUYỆT ĐỐI KHÔNG** dùng Webview kết hợp Webpack để load các ứng dụng Vue/React nặng nề vào VS Code Extension.
   - **BẮT BUỘC** sử dụng chuỗi HTML tĩnh thuần túy với các biến CSS gốc của VS Code (`var(--vscode-editor-background)`, v.v.) để trang hiển thị tức thì mà không tiêu tốn tài nguyên.

2. **Cơ chế gọi Studio:**
   - **TUYỆT ĐỐI KHÔNG** nhúng Studio vào tab VS Code.
   - **BẮT BUỘC** tận dụng API của Daemon bằng cách gửi yêu cầu HTTP đến `http://127.0.0.1:${port}/api/system/open-studio`.
