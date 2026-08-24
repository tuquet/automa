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
- **BẮT BUỘC** sử dụng SDK tự động sinh (auto-generated) từ OpenAPI là `@hey-api/client-fetch` (ví dụ: `getBrowsers()`, `startBrowser()`) đặt tại `src/core/api/client/` để giao tiếp với Daemon thay vì tự viết các hàm `fetch` thô.
- **SSE & Real-time Progress (Zero-Latency Polling)**: Đối với các tác vụ chạy ngầm tốn thời gian (khởi động browser, chạy workflow), **TUYỆT ĐỐI KHÔNG** dùng vòng lặp `while` hoặc `setInterval` để gọi polling thủ công `/status`. **BẮT BUỘC** sử dụng cơ chế Server-Sent Events (SSE) thông qua hàm `sse()` của `@hey-api`.
  - *Lưu ý TypeScript (Node.js Fetch Streams)*: Đối tượng `response.body` trả về từ Node 18+ `fetch` có hỗ trợ `Symbol.asyncIterator`, nhưng kiểu DOM mặc định của TS sẽ không nhận dạng được. Bạn **BẮT BUỘC** ép kiểu để tránh lỗi biên dịch `tsc`: `for await (const chunk of (res.body as any))` thay vì gọi `.getReader()`.
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
   - **BẮT BUỘC** tận dụng Web Server của Daemon bằng cách sử dụng `vscode.env.openExternal` để mở URL `http://127.0.0.1:${port}/studio`. **TUYỆT ĐỐI KHÔNG** sử dụng `ProcessExecution` để chạy lệnh `automa-cli studio`.


---

## 9. Quality Control & Testing Architecture

**BẮT BUỘC** tuân thủ tháp kiểm thử (Bottom-Up) cho VS Code Extension:

1. **Unit Testing (`vitest`)**:
   - **Thư mục**: `src/test/core/`
   - Các API cốt lõi như `TaskRunner`, `DaemonService`, và `GlobalSseListener` **BẮT BUỘC** được test độc lập bằng `vitest`.
   - **Mocking**: Extension Host API (`vscode`) không tồn tại trong môi trường Vitest. Bạn **BẮT BUỘC** cập nhật và duy trì các hàm mock trong `src/test/setup.ts` (ví dụ mock `vscode.window`, `vscode.workspace`, `vscode.Uri`).
   - **ESM Caveat**: Không sử dụng `require()` động trong các file nguồn chạy trên nền Vitest. **BẮT BUỘC** dùng `await import()` để tránh lỗi `ERR_REQUIRE_ESM`.

2. **E2E Integration Testing (`@vscode/test-electron` + `mocha`)**:
   - **Thư mục**: `src/test/e2e/`
   - Dùng để kiểm tra khả năng kích hoạt của Extension (Activation), khởi tạo UI, và Command Registration bên trong một Extension Host thực sự.
   - Đảm bảo các đường dẫn phân giải tĩnh được sử dụng an toàn thông qua `fileURLToPath` thay cho `__dirname` vì Extension này sử dụng chuẩn Node ESM.

---

## 10. VS Code Webview Semantic CSS Tokens & UX Standards

1. **Border & Divider Semantic Tokens**:
   - **TUYỆT ĐỐI KHÔNG** sử dụng `var(--vscode-widget-border)` cho các đường viền nội bộ (Card borders, list row dividers, section header borders) vì đây là token của Floating Overlay Widgets gây chói sáng.
   - **BẮT BUỘC DÙNG**:
     - **Card Border**: `var(--vscode-panel-border, rgba(128, 128, 128, 0.18))` hoặc `var(--vscode-editorGroup-border)`.
     - **Section Header Divider**: `var(--vscode-sideBarSectionHeader-border, var(--vscode-panel-border, rgba(128, 128, 128, 0.18)))`.
     - **Row / Table Divider**: `var(--vscode-panel-border, rgba(128, 128, 128, 0.12))` hoặc `.vscode-divider`.

2. **Webview Accessibility (a11y)**:
   - Các phần tử click được dạng `<span>` hoặc `<div>` **BẮT BUỘC** khai báo: `role="button"`, `tabindex="0"`, và `@keydown.enter.prevent` / `@keydown.space.prevent`.

3. **Actionable Empty States**:
   - Mọi trạng thái rỗng **BẮT BUỘC** hướng dẫn người dùng bước tiếp theo (ví dụ: `(Right click or run Automa: Add Variable to create)`).

