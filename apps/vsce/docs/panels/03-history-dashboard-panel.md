# 📊 Software Requirements Specification (SRS): History / Dashboard Sidebar Panel

> [!IMPORTANT]
> ### 🔗 Core Daemon API Endpoints (`http://127.0.0.1:8765`)
> - `GET /api/jobs` — *Lấy danh sách các tiến trình kịch bản đang chạy (Active Runners)*
> - `DELETE /api/jobs/{job_id}` — *Hủy khẩn cấp một Job đang thực thi (Kill Job)*
> - `GET /api/history` — *Truy xuất danh sách lịch sử thực thi từ SQLite (`?limit=50&offset=0`)*
> - `GET /api/history/{job_id}/logs` — *Lấy toàn bộ mảng log chi tiết của một phiên chạy lịch sử*
> - `DELETE /api/history/{job_id}` — *Xóa một bản ghi lịch sử cụ thể*
> - `DELETE /api/history` — *Xóa sạch toàn bộ lịch sử thực thi*
> - `GET /api/events` — *Kênh Server-Sent Events (SSE) phát sự kiện realtime (`job:started`, `job:finished`, `browser:status`)*

---

## 1. Executive Summary & Scope
Panel **`HISTORY`** (`view: automa.dashboard`) cung cấp bảng điều khiển trung tâm (Dashboard) thời gian thực, giám sát các tiến trình tự động hóa đang hoạt động (Active Runners), hiển thị các chỉ số đo lường hiệu suất (Metrics) và truy xuất lịch sử thực thi kịch bản lưu trong cơ sở dữ liệu SQLite.

- **Vị trí UI**: Primary Sidebar (`automa-activity-bar` ➔ `automa.dashboard`)
- **Extension Host Command Handler**: [`historyCommands.ts`](../../src/commands/historyCommands.ts)
- **Live Log Panel Engine**: [`LiveLogPanel.ts`](../../src/panels/LiveLogPanel.ts)

---

## 2. Functional Requirements (FR)

### FR-1: Đo Lường & Báo Cáo Chỉ Số (Metrics Dashboard)
- **FR-1.1 Bốn Chỉ Số Trọng Tâm**:
  - `Total Campaigns`: Tổng số kịch bản chiến dịch trong workspace.
  - `Active Runners`: Số lượng tiến trình thực thi đang chạy đồng thời (có hiệu ứng nhấp nháy 🟢 khi > 0).
  - `Total Executions`: Tổng số phiên chạy đã được ghi nhận trong lịch sử SQLite.
  - `Success Rate`: Tỉ lệ phần trăm các phiên chạy thành công (định dạng `98.5%`).

### FR-2: Giám Sát Tiến Trình Thời Gian Thực (Active Runners)
- **FR-2.1 Danh Sách Job Đang Chạy**: Tự động hiển thị thẻ Runner cho mỗi tiến trình đang thực thi, bao gồm Tên Workflow / Campaign và Thời điểm bắt đầu (`Started: Just now` / `Started: 2m ago`).
- **FR-2.2 Dừng Khẩn Cấp (Emergency Stop)**: Nhấn nút `Stop` màu đỏ để gửi lệnh `DELETE /api/jobs/{id}` tới Daemon, hủy ngay lập tức phiên chạy và đóng browser instance tương ứng.

### FR-3: Điều Khiển Chiến Dịch & Lập Lịch (Campaigns Quick Control)
- **FR-3.1 Danh Sách Chiến Dịch Cục Bộ**: Hiển thị tên, phiên bản và trạng thái lịch trình Cron (`⏰ 0 9 * * *`).
- **FR-3.2 Bật/Tắt Lập Lịch (Toggle Cron)**: Cho phép kích hoạt hoặc tạm dừng lịch chạy tự động trực tiếp trên Dashboard.
- **FR-3.3 Chạy Nhanh Chiến Dịch (Run Campaign)**: Nút `Run` để kích hoạt chiến dịch ngay từ Dashboard.

### FR-4: Quản Lý Lịch Sử Thực Thi (Execution History)
- **FR-4.1 Xem Chi Tiết Log**: Nhấp vào từng phiên chạy đã hoàn thành để mở trình xem log chi tiết ([`LiveLogPanel.ts`](../../src/panels/LiveLogPanel.ts)).
- **FR-4.2 Xóa Lịch Sử**: Cho phép xóa từng bản ghi riêng lẻ hoặc xóa sạch toàn bộ lịch sử (`Clear History`).

---

## 3. UI/UX & Wireframe Specification

```
+-------------------------------------------------------------+
| [Total Campaigns: 5]  [Active Runners: 1 🟢]                |
| [Total Execs: 142  ]  [Success Rate:   98%]                 |
+-------------------------------------------------------------+
| 🟢 Active Runners (1)                                       |
|   • Scrape Google Search (Started: 12s ago)        [⏹️ Stop] |
+-------------------------------------------------------------+
| 🚀 Campaigns (2)                                   [🔄 Sync]|
|   • Daily Lead Gen v1.0.0 (⏰ 0 8 * * *) [Toggle Cron] [▶ Run] |
|   • E-commerce Price Sync v2.1.0        [Toggle Cron] [▶ Run] |
+-------------------------------------------------------------+
| 📜 History (Recent)                              [🗑️ Clear] |
|   • [✔ Success] Daily Lead Gen (10:00:15 - 45s)             |
|   • [✖ Failed ] Price Sync (08:30:00 - Error 404)           |
+-------------------------------------------------------------+
```

---

## 4. RESTful API & Backend Endpoints Specification (`automa-core`)

### 4.1 Lấy Danh Sách Tiến Trình Đang Hoạt Động (Active Jobs)
- **Endpoint**: `GET /api/jobs`
- **Mô tả**: Truy xuất toàn bộ các job đang có trạng thái `running` hoặc `queued`.
- **Response `200 OK`**:
```json
[
  {
    "id": "job_8f2b1a",
    "workflow_name": "Daily Lead Gen",
    "workflow_path": "campaigns/daily.campaigns.json",
    "started_at": "2026-08-24T11:00:00Z",
    "status": "running",
    "browser_id": "profile_c1f8a9"
  }
]
```

### 4.2 Hủy Khẩn Cấp Một Job (Kill Job)
- **Endpoint**: `DELETE /api/jobs/{job_id}`
- **Response `200 OK`**:
```json
{
  "success": true,
  "job_id": "job_8f2b1a",
  "status": "killed",
  "message": "Job terminated and browser instance cleaned up"
}
```

### 4.3 Truy Xuất Lịch Sử Thực Thi (Job History)
- **Endpoint**: `GET /api/history?limit=50&offset=0`
- **Response `200 OK`**:
```json
[
  {
    "id": "job_7e1c9d",
    "workflow_name": "Scrape Amazon Prices",
    "status": "completed",
    "started_at": "2026-08-24T10:30:00Z",
    "ended_at": "2026-08-24T10:31:15Z",
    "duration_ms": 75000,
    "error_message": null
  },
  {
    "id": "job_6d0a8b",
    "workflow_name": "Login Facebook",
    "status": "failed",
    "started_at": "2026-08-24T09:15:00Z",
    "ended_at": "2026-08-24T09:15:20Z",
    "duration_ms": 20000,
    "error_message": "Element input#email not found after timeout 10000ms"
  }
]
```

### 4.4 Lấy Mảng Log Chi Tiết Cho Một Job
- **Endpoint**: `GET /api/history/{job_id}/logs`
- **Response `200 OK`**:
```json
[
  {
    "timestamp": "2026-08-24T10:30:01.120Z",
    "level": "info",
    "message": "Navigating to https://amazon.com"
  },
  {
    "timestamp": "2026-08-24T10:30:05.450Z",
    "level": "info",
    "message": "Extracted 25 product items"
  }
]
```

### 4.5 Xóa Lịch Sử Thực Thi
- **Xóa một bản ghi**: `DELETE /api/history/{job_id}`
- **Xóa toàn bộ lịch sử**: `DELETE /api/history`

### 4.6 Kênh Server-Sent Events Toàn Cục (Global SSE Stream)
- **Endpoint**: `GET /api/events`
- **Mô tả**: Kênh SSE phát sự kiện thời gian thực tới Dashboard để cập nhật giao diện không cần reload:
  - `job:started`: Phát khi có job mới bắt đầu.
  - `job:finished`: Phát khi job hoàn thành hoặc thất bại kèm mã kết quả.
  - `browser:status`: Cập nhật trạng thái instance trình duyệt.

---

## 5. Data Schemas & IPC Contracts

### IPC Message Protocol (Webview ➔ Extension Host)
```typescript
export type DashboardCommand =
  | { type: "runCampaign"; path: string }
  | { type: "toggleCron"; path: string }
  | { type: "openCampaign"; path: string }
  | { type: "killJob"; id: string }
  | { type: "showLog"; id: string }
  | { type: "deleteHistory"; id: string }
  | { type: "clearHistory" }
  | { type: "refresh" };
```

---

## 6. Non-Functional Requirements (NFR)

1. **Tần Suất Cập Nhật (Polling & SSE)**: Dashboard duy trì kết nối SSE để nhận sự kiện `job:started`, `job:finished` và cập nhật tức thời mà không cần reload trang.
2. **Xử Lý Trạng Thái Mất Kết Nối (Offline Fallback)**: Nếu Rust Daemon chưa chạy hoặc bị tắt đột ngột, hiển thị giao diện tối giản `Automa Core Daemon Offline` và nút `Retry` thay vì thông báo lỗi liên tục.

---

## 7. Acceptance Criteria (BDD Scenarios)

```gherkin
Scenario: Dừng job đang chạy từ Dashboard
  Given đang có 1 job "job-999" trong danh sách Active Runners
  When người dùng nhấn nút "Stop" trên dòng của job "job-999"
  Then Extension gửi DELETE /api/jobs/job-999 tới Daemon
  And job biến mất khỏi danh sách Active Runners và số lượng Active Runners giảm 1
```
