# 📜 Software Requirements Specification (SRS): Live Log Viewer Custom Editor

> [!IMPORTANT]
> ### 🔗 Core Daemon API Endpoints (`http://127.0.0.1:8765`)
> - `GET /api/events` — *Kênh Server-Sent Events (SSE) streaming logs thời gian thực (`event: job:log`, `event: job:status`)*
> - `GET /api/internal/worker/events` — *Kênh SSE nội bộ kết nối trực tiếp với Headless Browser Worker*
> - `POST /api/jobs/{job_id}/logs` — *Ghi nhận một mục log mới từ worker lên Daemon*
> - `GET /api/history/{job_id}/logs` — *Truy xuất toàn bộ mảng log lịch sử đã lưu trữ cho một Job*

---

## 1. Executive Summary & Scope
Trình xem log **`Live Log Viewer`** (`viewType: automa.logEditor`) là công cụ giám sát và phân tích quá trình thực thi kịch bản tự động hóa. Nó nhận luồng streaming thời gian thực qua Server-Sent Events (SSE) từ Rust Daemon hoặc đọc lại tệp log lịch sử `*automa-log.json`.

- **Kích hoạt khi**: Chạy một Workflow/Campaign hoặc mở tệp `*automa-log.json`
- **Extension Host Controller**: [`LogEditorProvider.ts`](../../src/providers/LogEditorProvider.ts)
- **Webview UI Engine**: [`LiveLogView.vue`](../../webview-ui/src/views/LiveLogView.vue)

---

## 2. Functional Requirements (FR)

### FR-1: Streaming Log Thời Gian Thực (SSE Ingestion)
- **FR-1.1 Nhận Luồng Log Liên Tục**: Lắng nghe sự kiện từ kênh SSE của Daemon mà không gây nghẽn luồng xử lý chính.
- **FR-1.2 Phân Cấp Mức Độ Log (Log Levels)**:
  - `INFO`: Thông báo tiến trình (màu xanh dương).
  - `WARN`: Cảnh báo điều kiện biên (màu vàng hổ phách).
  - `ERROR`: Lỗi thực thi DOM / mạng / timeout (màu đỏ).
- **FR-1.3 Nhãn Thời Gian Chi Tiết**: Ghi nhận timestamp chính xác đến từng mili-giây cho mỗi log entry.

### FR-2: Bộ Lọc & Tìm Kiếm Hiệu Năng Cao (High-Speed Filtering)
- **FR-2.1 Lọc Cấp Độ (Level Filter Dropdown)**: Chọn xem `All Levels`, `Info`, `Warn`, hoặc `Error`.
- **FR-2.2 Tìm Kiếm Tức Thì (Instant Search)**: Ô input tìm kiếm theo chuỗi ký tự, lọc tức thì trong danh sách log mà không thực hiện `JSON.stringify` lặp lại để đảm bảo mượt mà.
- **FR-2.3 Tự Động Cuộn (Auto-scroll)**: Checkbox `Auto-scroll` giữ màn hình luôn cuộn theo dòng log mới nhất đang đổ về.

---

## 3. UI/UX & Wireframe Specification

```
+-------------------------------------------------------------------------+
| [🔍 Filter log output...        ] [Level: All Levels ▼] [☑ Auto-scroll] |
+-------------------------------------------------------------------------+
| 10:15:30.120 [INFO ] Initializing Chromium instance profile "marketing" |
| 10:15:31.450 [INFO ] Navigating to https://example.com/login            |
| 10:15:32.890 [WARN ] Cloudflare challenge detected, waiting for solve  |
| 10:15:35.010 [INFO ] Challenge solved successfully                      |
| 10:15:36.200 [ERROR] Element button#submit not found after timeout 5000ms |
+-------------------------------------------------------------------------+
```

---

## 4. RESTful API & Backend Endpoints Specification (`automa-core`)

### 4.1 Kênh Server-Sent Events Cục Bộ (Job SSE Events)
- **Endpoint**: `GET /api/events`
- **Giao Thức**: `text/event-stream`
- **Cấu Trúc Sự Kiện**:
```
event: job:log
data: {"job_id":"job_99a8bc12","timestamp":"2026-08-24T11:15:30.120Z","level":"info","message":"Block [Click Element] executed successfully in 120ms"}

event: job:status
data: {"job_id":"job_99a8bc12","status":"completed","ended_at":"2026-08-24T11:16:00.000Z"}
```

### 4.2 Gửi Log Từ Worker Lên Daemon (Job Log Submission)
- **Endpoint**: `POST /api/jobs/{job_id}/logs`
- **Request Body**:
```json
{
  "level": "info",
  "message": "Extracted 50 product items from search results",
  "block_id": "extract_data_n3",
  "timestamp": "2026-08-24T11:15:35.000Z"
}
```
- **Response `200 OK`**: `{ "success": true }`

### 4.3 Đọc Lịch Sử Toàn Bộ Log Cho Một Job
- **Endpoint**: `GET /api/history/{job_id}/logs`
- **Response `200 OK`**:
```json
[
  { "timestamp": "2026-08-24T11:15:30.120Z", "level": "info", "message": "Initializing browser" },
  { "timestamp": "2026-08-24T11:15:36.200Z", "level": "error", "message": "Timeout waiting for selector #submit" }
]
```

---

## 5. Non-Functional Requirements (NFR)

1. **Hiệu Năng Stream Tối Đa**: Xử lý mượt mà lên tới 1,000 dòng log/giây mà không gây sụt giảm khung hình (duy trì 60 FPS).
2. **Quản Lý Bộ Nhớ Trình Duyệt**: Tự động dọn dẹp các event listener trên `window` khi component Vue unmount (`onUnmounted`).

---

## 6. Acceptance Criteria (BDD Scenarios)

```gherkin
Scenario: Lọc log lỗi khi kịch bản gặp sự cố
  Given Live Log Viewer đang hiển thị 500 dòng log hỗn hợp
  When người dùng chọn Level = "Error"
  Then chỉ các dòng có badge [ERROR] màu đỏ được hiển thị
  And số lượng dòng log hiển thị khớp với số lỗi thực tế
```
