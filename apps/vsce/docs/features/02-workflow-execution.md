# ⚡ Software Requirements Specification (SRS): Workflow Execution Engine

> [!IMPORTANT]
> ### 🔗 Core Daemon API Endpoints (`http://127.0.0.1:8765`)
> - `POST /api/jobs` — *Đăng ký và submit Job thực thi workflow hoặc package*
> - `GET /api/jobs` — *Lấy danh sách toàn bộ các job đang hoạt động (Active Runners)*
> - `GET /api/jobs/{job_id}/status` — *Polling trạng thái thực thi của job*
> - `PATCH /api/jobs/{job_id}/status` — *Cập nhật trạng thái hoàn thành và kết quả thực thi*
> - `DELETE /api/jobs/{job_id}` — *Dừng khẩn cấp tiến trình thực thi*
> - `GET /api/events` — *Kênh SSE phát sự kiện bắt đầu và kết thúc của job*

---

## 1. Executive Summary & Scope
Tài liệu này đặc tả toàn bộ yêu cầu phần mềm cho luồng thực thi kịch bản (Execution Engine), cơ chế truyền tham số động (Parameter Injection), các cờ điều khiển trình duyệt và xử lý vòng đời tác vụ tự động hóa giữa **Automa VS Code** và **Rust Core Daemon**.

- **Thành Phần Thực Thi**: [`TaskRunner.ts`](../../src/core/TaskRunner.ts) & [`DaemonService.ts`](../../src/core/daemon/DaemonService.ts)
- **Lệnh Điều Khiển**: [`runWorkflow.ts`](../../src/commands/runWorkflow.ts) & [`runCampaign.ts`](../../src/commands/runCampaign.ts)

---

## 2. Functional Requirements (FR)

### FR-1: Các Điểm Kích Hoạt Thực Thi (Trigger Points)
- **FR-1.1 Inline Play Button**: Nút `$(play)` trên cây thư mục `WORKSPACE`.
- **FR-1.2 Context Menu Explorer**: Menu chuột phải trên file `*.workflow.json` ➔ `Automa Toolkit` > `Run Workflow`.
- **FR-1.3 Custom Editor Header**: Nút `Run` trên thanh điều khiển của `WorkflowPreviewEditorProvider`.
- **FR-1.4 Quick Pick Target Resolution**: Nếu gọi lệnh từ Command Palette (`Automa: Run Workflow`), hệ thống hiển thị danh sách Quick Pick để người dùng chọn tệp cần chạy.

### FR-2: Cơ Chế Nạp Tham Số & Biến Môi Trường (Parameters & Variables)
- **FR-2.1 Gộp Biến Toàn Cục (Global Variables Merging)**: Các biến cấu hình trong `automa.vault.run.globalVariables` tự động được hợp nhất vào biến đầu vào của Engine.
- **FR-2.2 Tham Số Động Theo Lượt Chạy**: Các giá trị nhập từ giao diện Webview Preview được ưu tiên ghi đè lên giá trị mặc định của tệp JSON.

### FR-3: Các Cờ Điều Khiển (Execution Flags)
| Cấu Hình Settings | Kiểu Dữ Liệu | Mặc Định | Ý Nghĩa Kỹ Thuật |
| :--- | :--- | :--- | :--- |
| `automa.run.defaultBrowser` | `string` | `"daemon_worker"` | ID của Browser Profile được dùng để chạy. |
| `automa.vault.run.closeBrowserOnFinish` | `boolean` | `true` | Tự động đóng browser khi hoàn thành luồng. |
| `automa.vault.run.headless` | `boolean` | `true` | Chạy ẩn không mở cửa sổ đồ họa Chromium. |
| `automa.vault.run.debug` | `boolean` | `false` | Ghi log chi tiết từng lệnh DOM. |

### FR-4: Hủy Tác Vụ Khẩn Cấp (Emergency Cancellation)
- Bấm nút `Stop` trên Status Bar hoặc Dashboard để gửi yêu cầu hủy tác vụ (`DELETE /api/jobs/{id}`) tới Rust Daemon.

---

## 3. RESTful API & Backend Endpoints Specification (`automa-core`)

### 3.1 Nạp Job Thực Thi (Submit Job)
- **Endpoint**: `POST /api/jobs`
- **Request Body**:
```json
{
  "workflow_path": "c:/repo/automa-vault/google.com/search.workflow.json",
  "parameters": {
    "keyword": "automa ecosystem",
    "pages": 5
  },
  "options": {
    "browser_id": "profile_c1f8a9",
    "headless": true,
    "keep_browser_open": false,
    "debug": false,
    "global_variables": {
      "ENV": "production"
    }
  }
}
```
- **Response `201 Created`**:
```json
{
  "job_id": "job_1199aacc",
  "status": "queued",
  "message": "Job registered successfully"
}
```

### 3.2 Hoàn Thành / Đóng Dấu Job (Finish Job)
- **Endpoint**: `PATCH /api/jobs/{job_id}/status`
- **Request Body**:
```json
{
  "status": "completed",
  "error_message": null,
  "execution_output": { "total_rows_extracted": 150 }
}
```
- **Response `200 OK`**: `{ "success": true }`

### 3.3 Hủy Khẩn Cấp Job (Kill Job)
- **Endpoint**: `DELETE /api/jobs/{job_id}`
- **Response `200 OK`**: `{ "success": true, "job_id": "job_1199aacc", "status": "killed" }`

---

## 4. Non-Functional Requirements (NFR)

1. **Kiến Trúc Daemon-First (Zero Spawning)**: Tuyệt đối không spawn tiến trình Node.js CLI cục bộ. Toàn bộ lệnh chạy phải gửi qua REST API `POST /api/jobs` của Rust Daemon.
2. **Khả Năng Tự Phục Hồi (Auto-Boot Daemon)**: Nếu Daemon chưa chạy, Extension Host tự động khởi động tiến trình background `automa-core` và chờ tín hiệu Healthy trước khi gửi job.

---

## 5. Acceptance Criteria (BDD Scenarios)

```gherkin
Scenario: Thực thi workflow với cờ keepBrowserOpen
  Given kịch bản "login.workflow.json"
  When người dùng chạy kịch bản với tùy chọn keepBrowserOpen = true
  Then Daemon giữ nguyên phiên trình duyệt sau khi chạy xong bước cuối cùng
  And thông báo "Workflow completed successfully" hiển thị
```
