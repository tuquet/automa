# 🚀 Software Requirements Specification (SRS): Campaign Matrix Custom Editor

> [!IMPORTANT]
> ### 🔗 Core Daemon API Endpoints (`http://127.0.0.1:8765`)
> - `POST /api/v1/jobs` — *Kích hoạt và điều phối chiến dịch ma trận (Queue/Parallel, Workflows, Browsers)*
> - `GET /api/v1/jobs/{campaign_job_id}/status` — *Theo dõi tiến độ thực thi của Campaign Job*
> - `DELETE /api/v1/jobs/{campaign_job_id}` — *Hủy khẩn cấp toàn bộ các tác vụ con trong chiến dịch*
> - `GET /api/v1/browsers` — *Truy xuất danh sách Browsers từ SQLite DB để gán vào chiến dịch*
> - `GET /api/v1/campaigns/{id}/matrix-status` — *Lấy ma trận trạng thái chi tiết cho từng cặp Workflow - Browser*

---

## 1. Executive Summary & Scope
Trình soạn thảo **`Campaign Matrix`** (`viewType: automa.campaignEditor`) là giao diện điều khiển trung tâm cho các chiến dịch tự động hóa quy mô lớn (`*.campaigns.json`). Nó cho phép kết hợp linh hoạt nhiều Workflow chạy trên nhiều Browser instances khác nhau với các chế độ thực thi tuần tự (Queue) hoặc song song (Parallel).

- **Kích hoạt khi**: Mở tệp `*.campaigns.json`
- **Extension Host Controller**: [`CampaignEditorProvider.ts`](../../src/providers/CampaignEditorProvider.ts)
- **Webview UI Engine**: [`WebviewHtmlResolver.ts`](../../src/core/webview/WebviewHtmlResolver.ts)

---

## 2. Functional Requirements (FR)

### FR-1: Quản Lý Cấu Hình Chiến Dịch (Campaign Configuration)
- **FR-1.1 Tên Chiến Dịch & Phiên Bản**: Chỉnh sửa tên chiến dịch và theo dõi phiên bản cấu hình (`v1.0.0`).
- **FR-1.2 Chế Độ Thực Thi (Execution Mode)**:
  - `Queue (Sequential)`: Thực thi tuần tự từng workflow và browser để giảm tải CPU/RAM.
  - `Parallel`: Thực thi đồng thời trên tất cả các instance trình duyệt được chỉ định.
- **FR-1.3 Lập Lịch Cron Tự Động (Cron Schedule)**: Cấu hình biểu thức Cron (ví dụ: `0 */2 * * *`).

### FR-2: Bộ Chọn & Quản Lý Workflows (Workflow Selection)
- **FR-2.1 Danh Sách Workflows**: Dropdown `Select workflow...` liệt kê các workflow được cấu hình hoặc mở.
- **FR-2.2 Thêm Workflow (`+ Add`)**: Gán một workflow vào chiến dịch kèm tên và ID.
- **FR-2.3 Bật/Tắt Trực Tiếp (Enable/Disable Checkbox)**: Mỗi workflow có một checkbox cho phép tạm ngưng thực thi mà không cần xóa khỏi tệp JSON.
- **FR-2.4 Xóa Workflow (Remove)**: Nút `Trash2` để loại bỏ workflow khỏi chiến dịch.

### FR-3: Bộ Chọn & Quản Lý Browsers (Browser Assignment)
- **FR-3.1 Lấy Danh Sách Browsers từ SQLite DB**: Dropdown `Select browser...` nạp toàn bộ các browser instances từ API `/api/v1/browsers`.
- **FR-3.2 Thêm Browser (`+ Add`)**: Gán browser instance vào ma trận thực thi của chiến dịch.
- **FR-3.3 Xóa Browser (Remove)**: Nút `Trash2` để loại bỏ browser khỏi chiến dịch.

### FR-4: Lưu Trữ & Kích Hoạt Ma Trận
- **FR-4.1 Cờ Chưa Lưu (`(Unsaved)`)**: Hiển thị trạng thái màu vàng khi có thay đổi chưa được ghi xuống đĩa.
- **FR-4.2 Nút `Save`**: Lưu cấu hình đã chỉnh sửa trực tiếp vào tệp `*.campaigns.json`.
- **FR-4.3 Nút `Run`**: Gửi yêu cầu thực thi toàn bộ chiến dịch tới Rust Daemon qua `submitJob()`.

---

## 3. UI/UX & Wireframe Specification

```
+-------------------------------------------------------------------------+
| 🚀 Daily Lead Gen Matrix  [v1.0.0]  (Unsaved)              [💾 Save] [▶ Run] |
+-------------------------------------------------------------------------+
| ⚙️ Configuration                                                        |
|   Name: [Daily Lead Gen Matrix]                                         |
|   Execution Mode: [Queue (Sequential) ▼]                                |
|   Cron: [0 9 * * *            ]                                         |
+-------------------------------------------------------------------------+
| 📄 Workflows (2)               [Select workflow... ▼] [+ Add]           |
|   • [☑] 1. Google Search Leads                            [🗑️ Delete]   |
|   • [☑] 2. Extract Business Info                          [🗑️ Delete]   |
+-------------------------------------------------------------------------+
| 🌐 Browsers (2)                [Select profile...  ▼] [+ Add]           |
|   • 🟢 Chrome US Proxy (192.168.1.1)                      [🗑️ Delete]   |
|   • 🟢 Firefox EU Proxy (10.0.0.1)                        [🗑️ Delete]   |
+-------------------------------------------------------------------------+
```

---

## 4. RESTful API & Backend Endpoints Specification (`automa-core`)

### 4.1 Kích Hoạt Thực Thi Chiến Dịch Ma Trận
- **Endpoint**: `POST /api/jobs`
- **Mô tả**: Submit toàn bộ cấu hình campaign ma trận để Daemon quản lý việc điều phối các luồng chạy.
- **Request Body**:
```json
{
  "campaign_path": "c:/path/to/daily.campaigns.json",
  "concurrency_mode": "parallel",
  "workflows": [
    { "id": "wf_search", "name": "Google Search Leads", "enabled": true },
    { "id": "wf_extract", "name": "Extract Business Info", "enabled": true }
  ],
  "browsers": [
    { "id": "profile_c1f8a9", "name": "Chrome US Proxy" },
    { "id": "profile_e98b2c", "name": "Firefox EU Proxy" }
  ]
}
```
- **Response `201 Created`**:
```json
{
  "job_id": "campaign_job_1189ac",
  "status": "running",
  "total_matrix_tasks": 4,
  "message": "Campaign matrix dispatched successfully"
}
```

### 4.2 Lấy Tiến Trình Toàn Bộ Ma Trận *(Proposed / Future Contract)*
- **Endpoint**: `GET /api/campaigns/{campaign_job_id}/matrix-status`
- **Response `200 OK`**:
```json
{
  "campaign_id": "campaign_job_1189ac",
  "status": "running",
  "completed_tasks": 2,
  "failed_tasks": 0,
  "total_tasks": 4,
  "matrix": [
    { "workflow": "wf_search", "browser": "profile_c1f8a9", "status": "completed", "duration_ms": 15200 },
    { "workflow": "wf_search", "browser": "profile_e98b2c", "status": "running", "duration_ms": 8400 },
    { "workflow": "wf_extract", "browser": "profile_c1f8a9", "status": "queued" },
    { "workflow": "wf_extract", "browser": "profile_e98b2c", "status": "queued" }
  ]
}
```

---

## 5. Data Schemas & IPC Contracts

### IPC Message Protocol (Webview ➔ Extension Host)
```typescript
export type CampaignEditorCommand =
  | { type: "saveCampaign"; payload: CampaignData }
  | { type: "runCampaign"; path: string }
  | { type: "ready" };

export interface CampaignData {
  name: string;
  version?: string;
  cron?: string;
  settings?: {
    concurrency_mode?: "queue" | "parallel";
    cron?: string;
  };
  workflows: Array<{ id: string; name?: string; enabled?: boolean }>;
  browsers: Array<{ id: string; name?: string }>;
}
```

---

## 6. Non-Functional Requirements (NFR)

1. **Chống Ghi Đè Dữ Liệu Ngầm (Reactivity Isolation)**: Sử dụng cờ `isDirty` kết hợp kiểm tra `filePath` để ngăn chặn việc background sync từ daemon tự động ghi đè dữ liệu form người dùng đang nhập dở.
2. **Khởi Tạo Tức Thì (Instant Data Injection)**: Danh bạ `workflows` và `browsers` được Extension Host nạp sẵn vào HTML payload ngay khi mở Custom Editor lần đầu.

---

## 7. Acceptance Criteria (BDD Scenarios)

```gherkin
Scenario: Thêm workflow mới vào Campaign Matrix
  Given người dùng đang mở tệp "daily.campaigns.json"
  When người dùng chọn "Scrape Amazon" từ dropdown và bấm "+ Add"
  Then danh sách Workflows có thêm dòng "Scrape Amazon"
  And tiêu đề hiển thị cờ "(Unsaved)"
  When người dùng bấm "Save"
  Then tệp "daily.campaigns.json" trên đĩa được cập nhật với workflow mới
```
