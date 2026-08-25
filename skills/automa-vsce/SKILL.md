---
name: automa-vsce
description: Hướng dẫn phát triển VS Code Extension cho Automa (automa-vsce), tích hợp Linter Diagnostics, Context Menu commands và VS Code Tasks.
---

# Automa VS Code Extension (`automa-vsce`)

**BẮT BUỘC** tuân thủ quy định kiến trúc và quy trình phát triển submodule `automa-vsce`.

---

## 1. Extension Architecture & Key Responsibilities

`automa-vsce` **BẮT BUỘC** đảm nhiệm các vai trò sau:

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

## 4. Daemon API Communication & Typed SDK Invariant

- **BẮT BUỘC** sử dụng Typed SDK client (`@automa/types/api`) tự động sinh từ OpenAPI (ví dụ: `getHealth()`, `createClient()`, `getBrowsers()`, `startBrowserSession()`, `submitJob()`) đặt tại `src/core/api/client/`.
- **TUYỆT ĐỐI KHÔNG** tự viết các lệnh `fetch('http://127.0.0.1:8765/...')` thủ công hoặc hardcode URL endpoints trong các services.
- **TUYỆT ĐỐI KHÔNG** gọi lệnh CLI trực tiếp thông qua `child_process.exec` hay `vscode.ProcessExecution` để thực thi script (ngoại trừ lệnh khởi động Daemon). Mọi yêu cầu xử lý **BẮT BUỘC** gửi qua API tới Daemon.
- **SSE & Real-time Progress (Zero-Latency Polling)**: Đối với các tác vụ chạy ngầm tốn thời gian (khởi động browser, chạy workflow), **TUYỆT ĐỐI KHÔNG** dùng vòng lặp `while` hoặc `setInterval` để gọi polling thủ công `/status`. **BẮT BUỘC** sử dụng cơ chế Server-Sent Events (SSE) thông qua hàm `sse()` / `subscribeEventsSse()` của SDK.
- **OpenAPI TypeScript ESM & Bundling**:
  - File sinh mã từ `@hey-api/openapi-ts` trong package ESM (`@automa/types`) **BẮT BUỘC** dùng đuôi mở rộng `.js` tường minh (`from './sdk.gen.js'`).
  - `automa-vsce/tsup.config.ts` **BẮT BUỘC** cấu hình `noExternal: ["@automa/types"]` để inline mã nguồn SDK vào CommonJS bundle `dist/extension.js`.

---

## 5. Native Debugger UI Reuse & 1-Click Toolbar UX

- **1-Click Toolbar UX Preference**:
  - Ưu tiên tối đa các nút bấm trực quan 1-Click trên thanh tiêu đề Toolbar (`editor/title`, `view/title`) như `Open in Studio` (`$(link-external)`), `Live Log` (`$(output)`).
  - **HẠN CHẾ / KHÔNG LẠM DỤNG** menu chuột phải (`explorer/context`) gây rối mắt cho người dùng.
- **Clean Command Palette & Internal IPC Guard**:
  - Các lệnh chỉ phục vụ tương tác nội bộ của Webview qua IPC (`launchBrowser`, `deleteBrowser`, `editBrowser`, `deleteHistoryItem`) **TUYỆT ĐỐI KHÔNG** khai báo trong `package.json: contributes.commands`.
- **Zero Dummy UI & Action Completeness Invariant (Cấm Nút Bấm / Hành Động "Ma")**:
  - Toàn bộ các nút bấm (Buttons), Context Menu Items, Icon Actions, hoặc Toolbar Controls hiển thị trên giao diện (Webviews, Custom Editors, Toolbars, TreeViews) **BẮT BUỘC** có implementation xử lý hoàn chỉnh 100% (kết nối 2 chiều giữa Webview `sendMessage` và Provider `onDidReceiveMessage`, kèm thông báo phản hồi toast/thị giác rõ ràng khi hoàn tất).
  - **TUYỆT ĐỐI KHÔNG** để lại các nút bấm rỗng (no-op), không có handler, mock placeholder, hoặc nuốt lỗi âm thầm (silent failure). Nếu một tính năng chưa hoàn thiện, **BẮT BUỘC** ẩn hoàn toàn khỏi UI để không gây khó chịu cho người dùng.
- **TUYỆT ĐỐI KHÔNG** xây dựng lại UI Inspector bên trong VS Code.
- **BẮT BUỘC** dùng Daemon để gọi Automa Studio nguyên bản từ trình duyệt thông qua API.
- Extension đóng vai trò là **Thin Client**, chỉ hiển thị giao diện cấu hình tĩnh hoặc Welcome Panel và đẩy mọi tác vụ nặng sang Daemon xử lý.

---

## 6. Build, Packaging & Instant F5 Debugging

* **Packaging VSIX**:
  **BẮT BUỘC** dùng cờ `--no-dependencies`:
  ```bash
  npx @vscode/vsce package --no-dependencies
  ```

* **Instant F5 Debugging Flow**:
  - Khi Orchestrator (`pnpm dev:all`) đang chạy, `automa-vsce` đã được biên dịch liên tục bởi `tsup --watch`.
  - **TUYỆT ĐỐI KHÔNG** cấu hình `preLaunchTask` chạy lệnh `pnpm run build` (hoặc `build:webview`) trong `.vscode/launch.json` để tránh tắc nghẽn build 10-15s do `lucide-vue-next`.
  - Bỏ `preLaunchTask` để đảm bảo F5 mở Extension Development Host **tức thì (< 0.5 giây)**.

---

## 7. UI State Sync Architecture

**BẮT BUỘC** áp dụng các cơ chế sau để đồng bộ VS Code Sidebar:
- **`createFileSystemWatcher`**: Trigger `refresh()` khi có thay đổi file `.json`, `.yaml`.
- **`onDidChangeVisibility`**: Tự động fetch data khi chuyển tab.
- **`EventEmitter`**: Gọi `this._onDidChangeTreeData.fire(undefined)` để vẽ lại cây thư mục (sử dụng `EventEmitter<T | undefined>()` để tuân thủ quy tắc `noConfusingVoidType` của Biome).

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
   - **Thư mục**: `src/test/core/`, `src/test/commands/`, `src/test/providers/`
   - Các API cốt lõi như `TaskRunner`, `DaemonService`, và `GlobalSseListener` **BẮT BUỘC** được test độc lập bằng `vitest`.
   - **Strict TypeScript & Zero-Warning Mandate**: **TUYỆT ĐỐI KHÔNG** dùng `// biome-ignore` hay `as any` để bỏ qua lỗi linter trong tests. **BẮT BUỘC** dùng `vi.mocked(...)` với kiểu `Awaited<ReturnType<typeof fn>>` hoặc domain types chuẩn từ `@automa/types` & `@automa/types/api`.
   - **OpenAPI Type Alignment**: `getBrowsers()` trả về `BrowserResponse[]` từ OpenAPI client, phân biệt rõ với `Browser` domain model.
   - **Mocking**: Extension Host API (`vscode`) không tồn tại trong môi trường Vitest. Bạn **BẮT BUỘC** cập nhật và duy trì các hàm mock trong `src/test/setup.ts` (ví dụ mock `vscode.window`, `vscode.workspace`, `vscode.Uri`, `MockEventEmitter<T = unknown>`).
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

---

## 11. Sidebar 3-Panel Architecture & Flat List Standard

1. **Cấu trúc 3 Panel Tinh Gọn (GitHub Actions Standard)**:
   - `⚡ AUTOMATIONS` (`automa.workspace`): Workflows, Campaigns, Packages.
   - `🌐 BROWSERS` (`automa.browsers`): Browser Profiles Manager.
   - `🔒 STORAGE` (`automa.storage`): Secrets, Variables, Tables.
   - **Gỡ bỏ hoàn toàn**: Panel `DASHBOARD` khỏi Activity Bar để tránh chia nhỏ chiều cao sidebar và trùng lặp kịch bản.
   - **Xóa bỏ từ khóa Vault**: Toàn bộ giao diện VS Code Extension **BẮT BUỘC** dùng `Storage` thay cho `Vault`.

2. **Flat List Namespace Tagging (Zero Nested Folders)**:
   - Trong `AutomaFilesProvider`, **TUYỆT ĐỐI KHÔNG** tạo cây thư mục lồng nhau sâu tạo ra 4 cấp chevron rỗng (`automa-vault > google.com > fleets > file`).
   - **BẮT BUỘC** hiển thị danh sách phẳng trực quan kèm namespace badge: `[parent/namespace]` (ví dụ: `[google.com/fleets] • v1.28.0 • 8 blocks`).

3. **Concise Terms Invariant**:
   - Sử dụng các nhãn ngắn gọn, súc tích:
     - `Workflows (N)`, `Campaigns (N)`, `Packages (N)`
     - `Secrets (N)`, `Variables (N)`, `Tables (N)`

---

## 12. Visual Form vs Raw JSON UX Standards

1. **Zero Raw JSON Burden**:
   - Người dùng cuối không bắt buộc phải biết cú pháp JSON để nhập liệu hay cấu hình bảng dữ liệu.
2. **Visual Form Mode (Mặc định)**:
   - Tự động nhận diện các cột sẵn có trong bảng để render các ô `input` trực quan tương ứng.
   - Cung cấp nút `+ Add Column` để thêm cặp `[ Column Name ] : [ Value ]` linh hoạt khi bảng rỗng hoặc muốn thêm cột mới.
   - Tự động parse kiểu dữ liệu (`number`, `boolean`, `array`, `object`).
3. **JSON Mode (Tùy chọn)**:
   - Chỉ đóng vai trò là một Tab phụ (Advanced Mode) cho phép power users copy/paste hàng loạt, đồng bộ 2 chiều (two-way sync) với Form mode.

---

## 13. Webview data-testid & Testing Invariants

1. **Toàn Diện `data-testid`**:
   - Mọi thành phần tương tác trong Webviews (`TableView`, `BrowserManagerView`, `CampaignMatrixView`, `LiveLogView`, `WorkflowEditorView`) **BẮT BUỘC** có thuộc tính `data-testid` tường minh để phục vụ Unit & E2E Testing (ví dụ: `table-search-input`, `add-row-modal`, `browser-row-${id}`, `campaign-save-btn`, `log-entry-${idx}`).
2. **Vitest Mocking Setup**:
   - File `src/test/setup.ts` **BẮT BUỘC** mock đầy đủ `vscode.MarkdownString` và `vscode.ViewColumn` để ngăn ngừa lỗi `TypeError` âm thầm trong các Provider.

---

## 14. Webview Runner UX & Live Terminal Console Standards

Mọi Webview Editor hoặc Runner UI trong `automa-vsce` **BẮT BUỘC** tuân thủ các chuẩn mực sau khi thực thi tác vụ:

1. **Auto-Switching Live Console Tab**:
   - Khi người dùng nhấn nút **Run**, UI **BẮT BUỘC** tự động chuyển sang tab `Output & Logs` (hoặc mở Drawer Console) để hiển thị ngay luồng log đang chạy.

2. **Real-time Status & Execution Metrics**:
   - **Header State**:
     - Đang chạy: `🟢 Running Workflow...` (Pulse animation) kèm bộ đếm thời gian `⏱ 00:03.2s`.
     - Thành công: `✅ Execution Completed in X.Xs`.
     - Thất bại: `🔴 Execution Failed in X.Xs` (Kèm nút xem chi tiết lỗi).
   - **Quick Action Toolbar**: `[⏹ Stop]`, `[▶ Run Again]`, `[🗑 Clear Logs]`, `[🔍 Output Panel]`.

3. **Terminal Console Formatting**:
   - Sử dụng font `font-mono text-[11px]`, nền `bg-[var(--vscode-terminal-background)]`.
   - Phân biệt màu sắc log level rõ ràng:
     - `[INFO]`: Màu xanh Cyan / Blue (`text-blue-400`).
     - `[WARN]`: Màu vàng Warning (`text-yellow-400`).
     - `[ERROR]`: Màu đỏ Error (`text-red-400 font-semibold`).
   - Tự động auto-scroll xuống dòng log mới nhất (`logContainer.scrollTop = logContainer.scrollHeight`).

4. **Dual Telemetry Bridge (IPC + OutputChannel)**:
   - Trong Provider (`WorkflowPreviewEditorProvider.ts`):
     - Gắn listener vào `TaskRunner.telemetryEmitter`.
     - Chuyển tiếp log về Webview: `webviewPanel.webview.postMessage({ type: 'task:log', data: logText })`.
     - Ghi đồng thời vào `Logger.getOutputChannel()?.appendLine(...)`.
   - Luôn sử dụng `outputChannel.show(false)` khi bắt đầu thực thi job để đảm bảo panel Output không bị ẩn ngầm.

---

## 15. Strict Typing & Canonical Schema Reference Protocol

Mọi thành phần trong `automa-vsce` **BẮT BUỘC** tiêu thụ các Types và Schema từ `@automa/types` & `@automa/types/api`:

1. **Zero Ad-hoc Signatures**:
   - **CẤM**: `params?: Record<string, unknown>`, `runOptions?: { keepBrowserOpen?: boolean }`, `(nodeOrUri as Record<string, unknown>).fsPath`.
   - **BẮT BUỘC**: Sử dụng `SubmitJobOptions`, `SubmitJobPayload`, `ExecuteCampaignRequest`, `StorageVariable`, `StorageCredential`, `Workflow`, `WorkflowNode`, `Campaign`.
2. **Type-Safe Target Resolvers**:
   - Sử dụng `resolveTargetUri(nodeOrUri)` trả về `vscode.Uri | null` thay vì ép kiểu thô `as Record<string, unknown>`.
3. **OpenAPI API Client Invariant**:
   - Sử dụng các API client methods chuẩn (`submitJob`, `executeCampaign`, `addStorageVariable`, `addStorageCredential`, `encryptSecret`) với payload types tương ứng.
4. **Strongly-typed IPC Routers**:
   - Giao tiếp giữa Webview và Extension Host **BẮT BUỘC** định nghĩa bằng Discriminated Unions trong `@automa/types/ipc` (`WorkflowPreviewMessage`, `CampaignPreviewMessage`, `TableEditorMessage`, `ExecutionTelemetryMessage`).





