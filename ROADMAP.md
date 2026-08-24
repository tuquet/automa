# Automa Ecosystem - Enterprise Anti-Detect & Architecture Roadmap

Tài liệu này quy hoạch lộ trình phát triển toàn diện của hệ sinh thái Automa, bao gồm cả hệ thống Core API (Backend Rust) và Giao diện VS Code Extension (Frontend UI). Mục tiêu tối thượng là biến VS Code thành một IDE tự động hóa quy mô lớn (Enterprise Automation) theo chuẩn mực của các hệ thống anti-detect browser hiện đại.

---

## 1. Kiến trúc Thực thi & Đồng bộ (Core Architecture)

| Tính năng | Mô tả chi tiết | Trạng thái ưu tiên |
|---|---|---|
| **Session Lock** | Cấp phát Lock khi khởi chạy Browser. Tránh xung đột do nhiều tiến trình/nhân sự mở cùng lúc làm hỏng Database Cookie. | `[COMPLETED]` |
| **Giao thức CDP** | API Session Start trả về WebSocket Debugger URL (`ws://127.0.0.1:xxxx/...`) để cho phép đính kèm (attach) Puppeteer/Playwright. | `[COMPLETED]` |
| **Graceful Teardown** | Đợi tiến trình Chrome tắt an toàn, đảm bảo mọi dữ liệu tạm (History, LocalStorage) được ghi xong vào đĩa trước khi giải phóng Browser. | `[COMPLETED]` |
| **Cloud Syncing** | Mã hóa và nén (Zip) thư mục Browser sau khi Stop, tự động tải lên lưu trữ đám mây (S3) để đồng bộ làm việc nhóm. | `[PLANNED]` |
| **Quản trị Rác (GC)** | Có cronjob ngầm dọn dẹp thư mục Cache/Image rác của các Browser nội bộ (Local) để giải phóng dung lượng ổ cứng. | `[TRUNG HẠN]` |

---

## 2. Lộ trình REST API (Backend Specification)

Toàn bộ hệ thống tuân thủ chuẩn RESTful API không sử dụng động từ trong URL path.

### 2.1 Nhóm Quản lý Browser (Browser Operations)
| Phương thức | Endpoint | Chức năng | Trạng thái |
|---|---|---|---|
| `GET` | `/api/browsers` | Liệt kê toàn bộ Browsers | `[COMPLETED]` |
| `GET` | `/api/browsers/{id}` | Lấy chi tiết thông tin một Browser | `[COMPLETED]` |
| `POST` | `/api/browsers` | Tạo Browser mới | `[COMPLETED]` |
| `PUT` / `PATCH` | `/api/browsers/{id}` | Cập nhật cấu hình toàn diện hoặc từng phần của Browser | `[COMPLETED]` |
| `DELETE` | `/api/browsers/{id}` | Xóa một Browser (và dọn dẹp thư mục dữ liệu) | `[COMPLETED]` |
| `POST` | `/api/browsers/{id}/session` | Khởi chạy Browser Session (trả về WebSocket Debugger URL) | `[COMPLETED]` |
| `DELETE` | `/api/browsers/{id}/session` | Đóng Browser Session an toàn và đồng bộ dữ liệu | `[COMPLETED]` |
| `DELETE` | `/api/browsers/sessions` | Đóng toàn bộ các Browser Sessions đang hoạt động | `[COMPLETED]` |
| `POST` | `/api/browsers/import-csv` | Tạo hàng loạt Browser từ file CSV | `[TRUNG HẠN]` |
| `POST` | `/api/browsers/export-csv` | Xuất danh sách Browser ra CSV | `[TRUNG HẠN]` |

### 2.2 Nhóm Quản trị Thực thi & SSE (Execution & Realtime Events)
| Phương thức | Endpoint | Chức năng | Trạng thái |
|---|---|---|---|
| `GET` | `/api/events` | Kênh SSE (Server-Sent Events) phát luồng sự kiện Real-time (Job & Browser Session changes) | `[COMPLETED]` |
| `POST` | `/api/jobs` | Gửi Job thực thi kịch bản Automa gắn với Browser cụ thể | `[COMPLETED]` |
| `GET` | `/api/jobs` | Lấy danh sách active Jobs | `[COMPLETED]` |
| `GET` | `/api/jobs/{job_id}/status` | Kiểm tra trạng thái thực thi của một Job | `[COMPLETED]` |
| `DELETE` | `/api/jobs/{job_id}` | Hủy/Dừng thực thi một Job | `[COMPLETED]` |
| `POST` | `/api/jobs/{job_id}/logs` | Ghi nhận runtime logs từ worker | `[COMPLETED]` |

### 2.3 Nhóm Cấu hình Nâng cao (Storage, Proxy & Extensions)
| Phương thức | Endpoint | Chức năng | Trạng thái |
|---|---|---|---|
| `GET` / `POST` | `/api/storage/variables` | Lấy và tạo Variables trong Vault | `[COMPLETED]` |
| `GET` / `POST` | `/api/storage/credentials` | Lấy và tạo Credentials trong Vault | `[COMPLETED]` |
| `GET` / `POST` | `/api/storage/tables` | Lấy và tạo Tables trong Vault | `[COMPLETED]` |
| `GET` / `POST` | `/api/storage/tables/{id}/rows` | Lấy và ghi dữ liệu hàng (Rows) của Table | `[COMPLETED]` |
| `POST` | `/api/browsers/{id}/extensions` | Sideload (cài đặt ngầm) Chrome Extension | `[TRUNG HẠN]` |

---

## 3. Lộ trình VS Code Extension UI (Frontend Specification)

### 3.1 Browser Manager (Native TreeView & Dashboard)
Giao diện quản lý chính nằm ở thanh Sidebar (Activity Bar) của VS Code.

| Tính năng UI | API Tiêu thụ (Tích hợp) | Trạng thái |
|---|---|---|
| **Danh sách Browsers** | Gọi `GET /api/browsers` để vẽ cây thư mục. | `[COMPLETED]` |
| **Live Status (🟢/🔴)** | Lắng nghe SSE từ `GET /api/events` để đổi màu icon theo thời gian thực khi trạng thái Browser thay đổi. | `[COMPLETED]` |
| **Bảng điều khiển (Context Menu)** | Chuột phải vào Browser: `Start Session`, `Stop Session`, `Delete`, `Edit`. | `[COMPLETED]` |
| **Bulk Actions (Thao tác nhóm)** | Hỗ trợ thao tác hàng loạt trên TreeView và Campaign Editor. | `[COMPLETED]` |

### 3.2 Campaign Visual Editor (Custom Webview Form)
Giao diện Campaign Editor chỉnh sửa tệp `*.campaign.json` / `*.campaigns.json` để ánh xạ Browser và Workflows thành các Tasks tự động hóa.

| Tính năng UI | Dữ liệu & API Tiêu thụ | Trạng thái |
|---|---|---|
| **Mapping Browsers & Tasks** | Ánh xạ danh sách `browsers` vào từng Task tương ứng. | `[COMPLETED]` |
| **Dropdown Selection** | Tự động quét `**/*.browser.json` và `**/*.workflow.json` để hiển thị trong Webview. | `[COMPLETED]` |
| **One-Click Run** | Gửi yêu cầu thực thi Campaign tới `automa-core` qua `POST /api/jobs`. | `[COMPLETED]` |
