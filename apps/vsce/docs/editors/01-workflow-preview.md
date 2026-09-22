# 🎨 Software Requirements Specification (SRS): Workflow & Package Preview Editor

> [!IMPORTANT]
> ### 🔗 Core Daemon API Endpoints (`http://127.0.0.1:8765`)
> - `POST /api/jobs` — *Submit và thực thi workflow (`workflowPath`, `parameters`, `options: { browserId, headless, keepBrowserOpen, debug }`)*
> - `GET /api/jobs/{job_id}/status` — *Polling kiểm tra trạng thái và tiến độ của Job (`running`, `completed`, `failed`)*
> - `PATCH /api/jobs/{job_id}/status` — *Đánh dấu hoàn thành phiên chạy và cập nhật output*
> - `POST /api/system/studio/session` — *Khởi tạo phiên làm việc và mở Automa Web Studio trên nền web*
> - `POST /api/system/browser-binaries` — *Tự động cài đặt bản build Chromium mới nhất từ Google Cloud Storage*

---

## 1. Executive Summary & Scope
Trình soạn thảo tùy chỉnh **`Workflow Preview`** (`viewType: automa.workflowEditor`) thay thế giao diện JSON thô bằng một giao diện điều khiển tương tác trực quan khi người dùng mở các tệp `*.workflow.json` hoặc `*.package.json` trong VS Code.

- **Kích hoạt khi**: Mở tệp `*.workflow.json` hoặc `*.package.json`
- **Extension Host Controller**: [`WorkflowEditorProvider.ts`](../../src/providers/WorkflowEditorProvider.ts)
- **Webview UI Engine**: Canonical Automa Studio Canvas via [`WebviewHtmlResolver.ts`](../../src/core/webview/WebviewHtmlResolver.ts)

---

## 2. Functional Requirements (FR)

### FR-1: Điều Khiển Thực Thi & Cấu Hình Môi Trường
- **FR-1.1 Chạy Kịch Bản (Run)**: Nút `Run` kích hoạt luồng thực thi thông qua Rust Daemon. Trạng thái nút chuyển sang `Running...` kèm biểu tượng quay (`Loader2`) cho đến khi nhận được tín hiệu hoàn thành (`task:completed`).
- **FR-1.2 Giữ Trình Duyệt Mở (Keep Browser Open)**: Checkbox `Keep browser open` cho phép duy trì instance trình duyệt sau khi chạy xong để người dùng kiểm tra kết quả hoặc gỡ lỗi DOM.
- **FR-1.3 Mở Trong Web Studio (Open in Studio)**: Nút `Studio` (↗️) mở giao diện đồ họa Automa Web Studio nguyên bản để chỉnh sửa sơ đồ khối canvas kéo-thả chuyên sâu.

### FR-2: Quản Lý Tham Số Động (Parameters) & Biến (Variables)
- **FR-2.1 Parameters Tab**: Tự động phân tích các khối input của kịch bản và hiển thị bảng tham số. Người dùng có thể điền giá trị tùy ý trước khi bấm chạy.
- **FR-2.2 Variables Tab**: Hiển thị bảng danh sách các biến nội tại của workflow và cho phép ghi đè giá trị tạm thời cho phiên chạy.

### FR-3: Chuyển Đổi Nhanh Giữa UI Và JSON Thô (Source Toggle)
- Nút `Show Source` trên thanh công cụ của VS Code editor cho phép chuyển sang xem trực tiếp mã nguồn JSON gốc bất cứ lúc nào.

---

## 3. UI/UX & Wireframe Specification

```
+-------------------------------------------------------------------------+
| 📄 Scrape Product Data  [v1.0.0]     [☑ Keep browser open] [Studio] [▶ Run] |
+-------------------------------------------------------------------------+
| [Parameters]  [Variables]                                               |
+-------------------------------------------------------------------------+
| Name            | Type     | Default Value        | Current Value       |
|-----------------|----------|----------------------|---------------------|
| target_keyword  | string   | "laptop gaming"      | [laptop rtx 4060  ] |
| max_pages       | number   | 5                    | [10               ] |
+-------------------------------------------------------------------------+
```

---

## 4. RESTful API & Backend Endpoints Specification (`automa-core`)

### 4.1 Khởi Động Job Thực Thi Workflow
- **Endpoint**: `POST /api/jobs`
- **Mô tả**: Submit workflow JSON cùng các tham số động để Engine thực thi.
- **Request Body**:
```json
{
  "workflow_path": "c:/path/to/scrape.workflow.json",
  "parameters": {
    "target_keyword": "laptop rtx 4060",
    "max_pages": 10
  },
  "options": {
    "browser_id": "profile_c1f8a9",
    "headless": true,
    "keep_browser_open": false,
    "debug": false,
    "global_variables": {
      "TIMEOUT": "5000"
    }
  }
}
```
- **Response `201 Created`**:
```json
{
  "job_id": "job_99a8bc12",
  "status": "queued",
  "message": "Workflow queued for execution"
}
```

### 4.2 Kiểm Tra Trạng Thái Thực Thi (Job Status Polling / Query)
- **Endpoint**: `GET /api/jobs/{job_id}/status`
- **Response `200 OK`**:
```json
{
  "job_id": "job_99a8bc12",
  "status": "running",
  "current_node": "extract_data_node",
  "progress_percentage": 65,
  "started_at": "2026-08-24T11:15:00Z"
}
```

### 4.3 Mở Automa Web Studio
- **Endpoint**: `POST /api/system/studio/session`
- **Request Body**: `{ "workflow_path": "c:/path/to/scrape.workflow.json" }`
- **Response `200 OK`**: `{ "studio_url": "http://127.0.0.1:8765/studio?id=..." }`

### 4.4 Tự Động Cài Đặt Chromium Binaries
- **Endpoint**: `POST /api/system/browser-binaries`
- **Mô tả**: Tải và giải nén bản build Chromium mới nhất từ Google Cloud Storage về thư mục cache cục bộ của daemon.

---

## 5. Data Schemas & IPC Contracts

### IPC Message Protocol (Webview ➔ Extension Host)
```typescript
export type WorkflowPreviewMessage =
  | { type: "runWorkflow"; parameters?: Record<string, unknown>; keepBrowserOpen?: boolean }
  | { type: "saveWorkflow"; data: Record<string, unknown> }
  | { type: "openInStudio" }
  | { type: "viewLogs" };
```

---

## 6. Non-Functional Requirements (NFR)

1. **Chuẩn Hóa IPC**: Hỗ trợ đồng thời cả `message.type` và `message.command` để đảm bảo tính tương thích ngược hoàn toàn.
2. **Khử Khuẩn Dữ Liệu Tự Động (Auto-Sanitization)**: Khi tải kịch bản, nếu thiếu `nanoid` ở các nodes hoặc thiếu `version`, hệ thống tự động bổ sung mà không báo lỗi làm gián đoạn trải nghiệm người dùng.

---

## 7. Acceptance Criteria (BDD Scenarios)

```gherkin
Scenario: Chạy workflow với tham số tùy biến
  Given người dùng đang mở tệp "search.workflow.json" trên Workflow Preview
  When người dùng nhập tham số target_keyword = "dell xps"
  And người dùng tích chọn "Keep browser open" và bấm "Run"
  Then Extension gửi POST /api/jobs với parameters và keep_browser_open = true
  And nút Run hiển thị trạng thái "Running..."
```
