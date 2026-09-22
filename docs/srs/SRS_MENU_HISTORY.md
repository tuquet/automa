# 📜 ĐẶC TẢ NGHIỆP VỤ SRS: MENU HISTORY (JOB TELEMETRY & AUDIT LOGS)

---

## 🎯 1. MỤC TIÊU & PHẠM VI (SCOPE & OBJECTIVES)

Menu **History** cung cấp nhật ký thực thi chi tiết (Job Execution History) và kiểm toán hiệu năng (Telemetry Performance Audit) của toàn bộ các phiên chạy workflow trên Automa Ecosystem:
- **`apps/desk`**: Cung cấp giao diện nhật ký toàn diện (`HistoryView.vue`), bộ lọc trạng thái, xem chi tiết từng bước log của job trong quá khứ, và tính toán thời gian chạy trung bình.
- **`apps/vsce`**: Cung cấp giao diện nhật ký và tích hợp Output Channel.
- **`apps/core`**: Lưu trữ lịch sử thực thi vào bảng SQLite `job_history`.

---

## 🌳 2. BỐ CỤC GIAO DIỆN & COMPONENT TREE (UI/UX LAYOUT)

```text
HistoryView.vue (hoặc LiveLogView.vue trong VS Code)
├── Header Filter Bar
│   ├── Search Input (Debounced 150ms theo Job ID / Workflow Name)
│   ├── Status Filter Dropdown (select.history.status: All / Completed / Failed / Stopped)
│   ├── Date Range Filter
│   ├── btn.history.refresh (Tải lại lịch sử)
│   └── btn.history.clear (Xóa lịch sử cũ)
├── History Job Table / Card List
│   └── Job Record Item
│       ├── Job ID & Workflow Name
│       ├── Status Badge (Green: Completed / Red: Failed / Amber: Stopped)
│       ├── Start Time & Duration (Thời gian chạy)
│       ├── Trigger Type (Manual / Cron / Webhook / Campaign)
│       ├── btn.history.viewdetails (Mở drawer xem chi tiết log)
│       └── btn.history.rerun (Chạy lại kịch bản với thông số cũ)
└── Job Details & Trace Log Drawer
    ├── Job Summary & Execution Context
    ├── Step-by-step Block Execution Timeline
    └── Raw Console Logs Viewer (với tính năng copy/export)
```

---

## ⚡ 3. DANH MỤC NÚT BẤM (BUTTON CATALOG) TRONG MENU HISTORY

| Button ID | Tên Nút / Nhãn UI | Icon | Trạng Thái FSM Hỗ Trợ | Target Action & Endpoint | `data-testid` |
|---|---|---|---|---|---|
| `btn.history.refresh` | Refresh History | `RefreshCw` | `IDLE` | Gọi `getJobHistory()` cập nhật danh sách | `btn-refresh-history` |
| `btn.history.clear` | Clear History | `Trash2` | `IDLE` | Xóa các bản ghi lịch sử cũ | `btn-clear-history` |
| `btn.history.viewdetails`| View Details | `Eye` | `IDLE` | Mở drawer xem chi tiết trace logs | `btn-view-job-details` |
| `btn.history.rerun` | Re-run Job | `RotateCcw`| `IDLE` | Tái kích hoạt workflow với cùng tham số | `btn-rerun-job` |
| `btn.history.export` | Export Logs | `Download` | `IDLE` | Xuất toàn bộ file logs ra định dạng text/JSON | `btn-export-history-logs` |

---

## 📜 4. DANH MỤC SELECT / DROPDOWN TRONG MENU HISTORY

| Select ID | Tên Dropdown | Nguồn Dữ Liệu Remote | Virtualization & Debounce | Side-effect Phản Xạ Khi Chọn | `data-testid` |
|---|---|---|---|---|---|
| `select.history.status` | Filter By Status | Static Union (`all`, `completed`, `failed`, `stopped`) | Không cần ảo hóa | Lọc danh sách bản ghi hiển thị trên bảng | `select-history-status` |
| `select.history.workflow`| Filter By Workflow| `GET /api/v1/storage/workflows` | Virtualized 1000+, Debounce 150ms | Lọc lịch sử theo từng kịch bản cụ thể | `select-history-workflow` |

---

## 🌐 5. DANH MỤC API ENDPOINTS & SSE EVENTS

| Giao Thức | Endpoint / Sự Kiện | Phương Thức | SDK Function Gọi Chuẩn | Mô Tả Nghiệp Vụ |
|---|---|:---:|---|---|
| **REST** | `/api/v1/history` | `GET` | `getJobHistory({ query: { limit, offset, search, status } })` | Lấy danh sách lịch sử phân trang từ SQLite |
| **REST** | `/api/v1/history/{id}` | `GET` | `getJobDetails()` | Lấy chi tiết trace logs của một phiên chạy |
| **SSE** | `/api/v1/events` | Stream | `globalSseClient` | Nhận sự kiện `job_completed` / `job_failed` để tự động thêm vào lịch sử |

---

## 🛡️ 6. TIÊU CHUẨN KIỂM ĐỊNH CHẤT LƯỢNG (AGENT CROSS-CHECK)

1. [ ] Danh sách lịch sử phải hỗ trợ phân trang chuẩn `limit` và `offset` trên SQLite, không tải toàn bộ gây tràn RAM.
2. [ ] Khi một job vừa chạy xong trong Menu Studio, bản ghi mới phải tự động xuất hiện trên Menu History nhờ SSE phản xạ.
3. [ ] Drawer xem log hiển thị đầy đủ thông tin: ID khối, thời gian thực thi của từng block, và thông báo lỗi chi tiết nếu thất bại.
