# Automa Ecosystem - Enterprise Anti-Detect & Architecture Roadmap

Tài liệu này quy hoạch lộ trình phát triển toàn diện của hệ sinh thái Automa, bao gồm cả hệ thống Core API (Backend Rust) và Giao diện VS Code Extension (Frontend UI). Mục tiêu tối thượng là biến VS Code thành một IDE tự động hóa quy mô lớn (Enterprise Automation) theo chuẩn mực của các hệ thống như GoLogin.

---

## 1. Kiến trúc Thực thi & Đồng bộ (Core Architecture)

| Tính năng | Mô tả chi tiết | Trạng thái ưu tiên |
|-----------|---------------|-------------------|
| **Session Lock** | Cấp phát Lock khi khởi chạy Browser. Tránh xung đột do nhiều tiến trình/nhân sự mở cùng lúc làm hỏng Database Cookie. | `[IN PROGRESS]` |
| **Giao thức CDP** | API Start không chỉ mở Browser mà phải trả về **WebSocket Debugger URL** (`ws://127.0.0.1:xxxx/...`) để cho phép đính kèm (attach) Puppeteer/Playwright. | `[PLANNED]` |
| **Graceful Teardown** | Đợi tiến trình Chrome tắt an toàn, đảm bảo mọi dữ liệu tạm (History, LocalStorage) được ghi xong vào đĩa trước khi mở khóa Browser. | `[PLANNED]` |
| **Cloud Syncing** | Mã hóa và nén (Zip) thư mục Browser sau khi Stop, tự động tải lên lưu trữ đám mây (S3) để đồng bộ làm việc nhóm. | `[PLANNED]` |
| **Quản trị Rác (GC)** | Có cronjob ngầm dọn dẹp thư mục Cache/Image rác của các Browser nội bộ (Local) để giải phóng dung lượng ổ cứng. | `[TRUNG HẠN]` |

---

## 2. Lộ trình REST API (Backend Specification)

Bảng dưới đây quy định danh sách các API Endpoint, phân loại theo chức năng và tiến độ thực thi.

### 2.1 Nhóm Quản lý Browser (Browser Operations)
| Phương thức | Endpoint | Chức năng | Trạng thái |
|---|---|---|---|
| `GET` | `/api/v1/browser` | Liệt kê toàn bộ Browsers | `[NGẮN HẠN]` |
| `GET` | `/api/v1/browser/:id` | Lấy chi tiết thông tin một Browser | `[NGẮN HẠN]` |
| `POST` | `/api/v1/browser` | Tạo Browser mới | `[NGẮN HẠN]` |
| `PUT` | `/api/v1/browser/:id` | Cập nhật cấu hình toàn diện của Browser | `[NGẮN HẠN]` |
| `PATCH` | `/api/v1/browser/:id/resolution` | Thay đổi kích thước/độ phân giải màn hình | `[NGẮN HẠN]` |
| `PATCH` | `/api/v1/browser/:id/language` | Thay đổi ngôn ngữ trình duyệt | `[NGẮN HẠN]` |
| `DELETE`| `/api/v1/browser/:id` | Xóa một Browser (và dọn dẹp vật lý) | `[NGẮN HẠN]` |
| `POST`  | `/api/v1/browser/delete-batch` | Xóa hàng loạt Browsers (nhận list IDs) | `[NGẮN HẠN]` |
| `POST` | `/api/v1/browser/:id/clone` | Nhân bản một Browser thành Browser mới | `[NGẮN HẠN]` |
| `POST` | `/api/v1/browser/import-csv` | Tạo hàng loạt Browser từ file CSV | `[TRUNG HẠN]` |
| `POST` | `/api/v1/browser/export-csv` | Xuất danh sách Browser ra CSV | `[TRUNG HẠN]` |

### 2.2 Nhóm Quản lý Tiến trình (Daemon Local Execution)
| Phương thức | Endpoint | Chức năng | Trạng thái |
|---|---|---|---|
| `GET`  | `/api/v1/events` | Kênh SSE (Server-Sent Events) phát luồng trạng thái Real-time (Start/Stop) | `[NGẮN HẠN]` |
| `POST` | `/api/v1/browser/start` | Khởi chạy Browser (trả về thông tin WebSocket URL) | `[NGẮN HẠN]` |
| `POST` | `/api/v1/browser/stop` | Đóng Browser an toàn và đồng bộ dữ liệu | `[NGẮN HẠN]` |
| `POST` | `/api/v1/browser/:id/execute` | Chèn Workflow (Kịch bản Automa) vào Browser và chạy tự động | `[TRUNG HẠN]` |
| `GET`  | `/api/v1/browser/active` | Lấy danh sách các Browser đang chạy (kèm Debug Port) | `[NGẮN HẠN]` |
| `GET`  | `/api/v1/browser/:id/status` | Kiểm tra trạng thái Live/Dead của 1 Browser cụ thể | `[NGẮN HẠN]` |

### 2.3 Nhóm Cấu hình Nâng cao (Proxy, Cookies & Extensions)
| Phương thức | Endpoint | Chức năng | Trạng thái |
|---|---|---|---|
| `PATCH` | `/api/v1/browser/:id/proxy` | Gán hoặc cập nhật Proxy (HTTP/SOCKS5) cho 1 Browser | `[TRUNG HẠN]` |
| `PATCH` | `/api/v1/browser/proxy/many`| Gán Proxy chung cho hàng loạt Browser | `[TRUNG HẠN]` |
| `GET` | `/api/v1/browser/:id/cookies` | Trích xuất (Export) Cookies hiện tại của Browser | `[TRUNG HẠN]` |
| `POST` | `/api/v1/browser/:id/cookies` | Nhồi (Import) Cookies vào SQLite của Browser | `[TRUNG HẠN]` |
| `POST` | `/api/v1/browser/:id/extensions` | Sideload (cài đặt ngầm) Chrome Extension (vd: MetaMask) | `[TRUNG HẠN]` |

### 2.4 Nhóm Mở rộng (Future Backlog)
| Phương thức | Endpoint | Chức năng | Trạng thái |
|---|---|---|---|
| `GET` | `/api/v1/browser/fingerprint` | Lấy mẫu Fingerprint ẩn danh ngẫu nhiên | `[FUTURE]` |
| `PATCH` | `/api/v1/browser/:id/fingerprint`| Làm mới (Refresh) toàn bộ dấu vân tay của Browser | `[FUTURE]` |
| `POST` | `/api/v1/browser/:id/web` | Khởi chạy Browser từ xa trên Cloud Container/VPS | `[FUTURE]` |
| `DELETE`| `/api/v1/browser/:id/web` | Đóng tiến trình Browser trên Cloud | `[FUTURE]` |

---

## 3. Lộ trình VS Code Extension UI (Frontend Specification)

Phần này quy định cách giao diện người dùng tiêu thụ (consume) các API Backend ở trên.

### 3.1 Browser Browser Manager (Native TreeView)
Giao diện quản lý chính nằm ở thanh Sidebar (Activity Bar) của VS Code.

| Tính năng UI | API Tiêu thụ (Tích hợp) | Trạng thái |
|-------------|-------------------------|------------|
| **Danh sách Browser** | Gọi `GET /api/v1/browser` để vẽ cây thư mục. | `[NGẮN HẠN]` |
| **Live Status (🟢/🔴)**| Lắng nghe SSE từ `GET /api/v1/events` để đổi màu icon theo thời gian thực khi trạng thái Browser thay đổi (Tránh spam API). | `[NGẮN HẠN]` |
| **Bảng điều khiển (Context Menu)** | Chuột phải vào Browser để hiện Menu: `Khởi chạy (Start)`, `Đóng (Stop)`, `Xóa (Delete)`, `Chạy Kịch Bản (Execute)`. Cấu hình gọi các endpoint tương ứng. | `[NGẮN HẠN]` |
| **Bulk Actions (Thao tác nhóm)** | Cho phép tick chọn (Checkbox) nhiều Browser trên TreeView để gọi `POST /api/v1/browser/delete-batch` (Xóa hàng loạt). | `[NGẮN HẠN]` |

### 3.2 Browser Editor (Custom Webview Form)
Khi bấm vào "Edit" hoặc "Create New" trên một Browser, VS Code sẽ mở một cửa sổ Webview rộng hiển thị Form nhập liệu cấu hình nâng cao.

| Tính năng UI | API Tiêu thụ (Tích hợp) | Trạng thái |
|-------------|-------------------------|------------|
| **Cấu hình Cơ bản** | Gọi `POST /api/v1/browser` (Tạo mới) và `PUT /api/v1/browser/:id` (Cập nhật). | `[NGẮN HẠN]` |
| **Tùy chỉnh Màn hình/Ngôn ngữ**| Các dropdown cho phép gọi nhanh `PATCH .../resolution` hoặc `PATCH .../language` mà không cần Save toàn bộ form. | `[NGẮN HẠN]` |
| **Quản trị Proxy** | Tab riêng nhập HTTP/SOCKS5. Nút "Apply" sẽ gọi `PATCH /api/v1/browser/:id/proxy`. Khởi tạo tính năng "Check Live Proxy" trước khi lưu. | `[TRUNG HẠN]` |

### 3.3 Automation Data Hub (Quản lý Dữ liệu)
Giao diện quản trị tài sản (Assets) đính kèm theo từng Browser.

| Tính năng UI | API Tiêu thụ (Tích hợp) | Trạng thái |
|-------------|-------------------------|------------|
| **Cookie Manager** | Bảng hiển thị (Table) dạng Read-only. Cung cấp 2 nút: "Export to Clipboard" (`GET .../cookies`) và "Import from File" (`POST .../cookies`). | `[TRUNG HẠN]` |
| **Extension Sideloading** | Giao diện cho phép chọn folder (Local path) của tiện ích mở rộng (như MetaMask) qua File Dialog của VS Code, gọi API `POST .../extensions`. | `[TRUNG HẠN]` |
| **CSV Import/Export** | Tích hợp vào Command Palette (`Ctrl+Shift+P` -> `Automa: Import Browsers từ CSV`). Mở hộp thoại chọn file CSV và đẩy lên `/api/v1/browser/import-csv`. | `[TRUNG HẠN]` |

### 3.4 Visual Debugger (Tương lai)
Khi tính năng Headless CDP hoàn thiện, Extension sẽ tích hợp sâu với quy trình thực thi.

| Tính năng UI | API Tiêu thụ (Tích hợp) | Trạng thái |
|-------------|-------------------------|------------|
| **Attach Debugger** | Khi bấm Start, API trả về `WS Debugger URL`. VS Code sẽ tự động attach (đính kèm) Terminal hoặc Console tab vào WS này để bắt log mạng và Javascript lỗi. | `[FUTURE]` |
| **Cloud Dashboard** | Màn hình riêng quản lý các VPS/Container đang chạy Browser từ xa, gọi API `/api/v1/browser/:id/web`. | `[FUTURE]` |
