# 🌐 Software Requirements Specification (SRS): Browsers Sidebar Panel

> [!IMPORTANT]
> ### 🔗 Core Daemon API Endpoints (`http://127.0.0.1:8765`)
> - `GET /api/v1/browsers` — *Lấy danh sách toàn bộ browser instances từ SQLite DB*
> - `POST /api/v1/browsers` — *Khởi tạo browser instance mới vào SQLite DB*
> - `GET /api/v1/browsers/{id}` — *Lấy thông tin chi tiết của một browser*
> - `PUT /api/v1/browsers/{id}` — *Cập nhật proxy, UA, name, browser_type*
> - `DELETE /api/v1/browsers/{id}` — *Xóa browser khỏi hệ thống và database SQLite*
> - `POST /api/v1/browsers/{id}/session` — *Khởi chạy phiên trình duyệt (Launch Browser)*
> - `DELETE /api/v1/browsers/{id}/session` — *Dừng phiên trình duyệt (Stop Browser)*
> - `DELETE /api/v1/browsers/sessions` — *Dừng khẩn cấp toàn bộ các browser đang chạy*
> - `POST /api/v1/browsers/import-csv` — *Nạp proxy & browser hàng loạt từ file CSV vào SQLite*
> - `POST /api/v1/browsers/{id}/extensions` — *Sideload Extension vào browser*

---

## 1. Executive Summary & Scope
Panel **`BROWSERS`** (`view: automa.browsers`) là trung tâm quản lý toàn bộ thực thể trình duyệt (Browser instances) của người dùng trong hệ sinh thái Automa. Toàn bộ dữ liệu được quản lý **Database-First qua SQLite DB của Automa Core**, không quét hay phụ thuộc vào file trên ổ đĩa. Nó cung cấp giao diện quản lý đa tài khoản, cấu hình mạng (Proxy), dấu vân tay trình duyệt (User-Agent), và điều khiển vòng đời tiến trình duyệt web độc lập.

- **Vị trí UI**: Primary Sidebar (`automa-activity-bar` ➔ `automa.browsers`)
- **Extension Host Controller**: [`BrowsersTreeDataProvider.ts`](../../src/providers/BrowsersTreeDataProvider.ts)
- **Editor & Webview Engine**: [`BrowserEditorProvider.ts`](../../src/providers/BrowserEditorProvider.ts)

---

## 2. Functional Requirements (FR)

### FR-1: Quản lý Trình duyệt (Browser Lifecycle)
- **FR-1.1 Tạo Browser Mới (SQLite DB-First)**: Người dùng bấm `+` (Header) hoặc `New Browser` (Webview). Hệ thống gọi API `POST /api/v1/browsers` lưu trực tiếp vào SQLite DB. Nếu là browser đầu tiên, tự động gán làm Default Browser.
- **FR-1.2 Khởi chạy Trình duyệt (Launch)**: Khi bấm `Launch`, Extension Host gửi yêu cầu tới Rust Daemon (`POST /api/v1/browsers/{id}/session`). Khi daemon khởi chạy tiến trình Chromium thành công, trạng thái browser chuyển sang `● Active` với chấm trạng thái xanh động (animate-pulse).
- **FR-1.3 Dừng Trình duyệt (Kill/Stop)**: Khi browser đang chạy, nút chuyển thành `Stop` màu đỏ. Nhấn nút sẽ gửi lệnh `DELETE /api/v1/browsers/{id}/session` để đóng tiến trình sạch sẽ (graceful shutdown), ngăn chặn tiến trình zombie.
- **FR-1.4 Đặt làm Mặc định (Default Browser)**: Người dùng có thể nhấn `Set Default` (⭐). Browser mặc định sẽ được đánh dấu bằng huy hiệu `Default ⭐` và đồng bộ qua cấu hình `automa.run.defaultBrowser`.
- **FR-1.5 Xóa Browser (Delete)**: Bấm biểu tượng `Trash2` để xóa bỏ browser khỏi hệ thống và database SQLite.

### FR-2: Chỉnh sửa Nhanh Cấu hình Mạng & Thiết bị (Inline Editing)
- **FR-2.1 Form Chỉnh sửa Trực tiếp**: Nhấn nút `Edit` để mở form inline mà không cần chuyển trang:
  - `Display Name`: Tên định danh profile.
  - `Proxy URL`: Hỗ trợ định dạng `http://host:port`, `socks5://host:port` và `http://user:password@host:port`.
  - `Custom User-Agent`: Chuỗi User-Agent tùy biến.
  - `Browser Type`: Chọn `Chromium` hoặc `Firefox`.
- **FR-2.2 Xuất tệp `*.browser.json` (Export)**: Cho phép xuất profile ra file `.browser.json` trong thư mục dự án để chia sẻ hoặc lưu trữ trên Git repository.

### FR-3: Tìm kiếm & Lọc Hồ sơ (Search & Filter)
- **FR-3.1 Lọc Tức Thì (Instant Search)**: Ô input tìm kiếm trên cùng tự động lọc danh sách theo tên profile, ID, loại trình duyệt hoặc địa chỉ IP của Proxy mà không gây độ trễ.
- **FR-3.2 Đồng Bộ Thủ Công (Refresh)**: Nút `Refresh` để gửi yêu cầu lấy danh sách mới nhất từ Rust Daemon.

---

## 3. UI/UX & Wireframe Specification

```
+-------------------------------------------------------------+
| [🔍 Filter...            ] [+ New] [🔄]                      |
+-------------------------------------------------------------+
| 🟢 Default Profile                   [⭐ Default] [⚙️ Edit] |
|   Type: Chromium (● Active)                                 |
|   Proxy: http://192.168.1.100:8080                          |
|   [⏹️ Stop]                                     [🗑️ Delete] |
+-------------------------------------------------------------+
| ⚪ Social Bot Profile               [⭐ Set Default] [⚙️ Edit] |
|   Type: Firefox                                             |
|   [▶️ Launch]                                   [🗑️ Delete] |
+-------------------------------------------------------------+
```

- **Trạng thái Trống (Empty State)**: Khi chưa có profile nào, hiển thị thông báo ngắn gọn: `No browser profiles.` kèm nút trung tâm `[+ Create Browser]`.
- **Trạng thái Mất Kết Nối (Daemon Offline)**: Hiển thị cảnh báo ngắn gọn `Automa Core Daemon Offline` và nút `Retry`.

---

## 4. RESTful API & Backend Endpoints Specification (`automa-core`)

### 4.1 Lấy Danh Sách Browser Profiles
- **Endpoint**: `GET /api/browsers`
- **Mô tả**: Truy xuất toàn bộ hồ sơ trình duyệt được lưu trong SQLite Database (`AutomaDb`).
- **Response `200 OK`**:
```json
[
  {
    "id": "profile_c1f8a9",
    "name": "Marketing USA Profile",
    "browser_type": "Chromium",
    "proxy": "http://user:pass@198.51.100.1:8080",
    "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
    "is_default": true,
    "status": "running"
  }
]
```

### 4.2 Tạo Browser Profile Mới
- **Endpoint**: `POST /api/browsers`
- **Request Body**:
```json
{
  "name": "Social Media Bot",
  "browser_type": "Chromium",
  "proxy": "socks5://127.0.0.1:9050",
  "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...",
  "is_default": false
}
```
- **Response `201 Created`**:
```json
{
  "id": "profile_e98b2c",
  "name": "Social Media Bot",
  "browser_type": "Chromium",
  "proxy": "socks5://127.0.0.1:9050",
  "user_agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)...",
  "is_default": false,
  "status": "stopped"
}
```

### 4.3 Khởi Chạy Phiên Trình Duyệt (Launch Session)
- **Endpoint**: `POST /api/browsers/{id}/session`
- **Mô tả**: Spawn tiến trình Chromium/Firefox độc lập với thư mục User Data Directory (UDD) riêng biệt cho profile đó.
- **Response `200 OK`**:
```json
{
  "success": true,
  "browser_id": "profile_c1f8a9",
  "status": "running",
  "ws_endpoint": "ws://127.0.0.1:9222/devtools/browser/uuid-here"
}
```
- **Error `404 Not Found`**:
```json
{ "error": "Browser profile with ID 'profile_c1f8a9' not found" }
```

### 4.4 Dừng Phiên Trình Duyệt (Stop Session)
- **Endpoint**: `DELETE /api/browsers/{id}/session`
- **Mô tả**: Gửi tín hiệu đóng trình duyệt và dọn dẹp Chromium process instance.
- **Response `200 OK`**:
```json
{ "success": true, "message": "Browser session stopped successfully" }
```

### 4.5 Cập Nhật Profile
- **Endpoint**: `PUT /api/browsers/{id}` hoặc `PATCH /api/browsers/{id}`
- **Request Body**:
```json
{
  "name": "Updated Profile Name",
  "proxy": "http://10.0.0.1:8080",
  "user_agent": "Mozilla/5.0...",
  "browser_type": "Chromium"
}
```
- **Response `200 OK`**: Thông tin profile sau khi cập nhật.

### 4.6 Xóa Profile
- **Endpoint**: `DELETE /api/browsers/{id}`
- **Response `200 OK`**:
```json
{ "success": true, "deleted_id": "profile_c1f8a9" }
```

### 4.7 Dừng Toàn Bộ Browser Đang Chạy (Emergency Kill)
- **Endpoint**: `DELETE /api/browsers/sessions`
- **Response `200 OK`**:
```json
{ "success": true, "stopped_count": 3 }
```

### 4.8 Xuất / Nhập Cookies *(Proposed / Future Contract)*
- **Endpoint**: `GET /api/browsers/{id}/cookies` (Xuất cookies JSON)
- **Endpoint**: `POST /api/browsers/{id}/cookies` (Nhập cookies JSON vào session)

---

## 5. Data Schemas & IPC Contracts

### IPC Message Protocol (Webview ➔ Extension Host)
```typescript
export type BrowserPanelCommand =
  | { type: "createBrowser" }
  | { type: "launchBrowser"; id: string }
  | { type: "killBrowser"; id: string }
  | { type: "setDefaultBrowser"; id: string }
  | { type: "updateBrowser"; id: string; data: { name?: string; proxy?: string; user_agent?: string; browser_type?: string } }
  | { type: "exportBrowserToJson"; id: string; data: Record<string, unknown> }
  | { type: "deleteBrowser"; id: string }
  | { type: "refresh" };
```

---

## 6. Non-Functional Requirements (NFR)

1. **Hiệu Năng & Độ Nhạy (Responsiveness)**: Thời gian lọc danh sách tìm kiếm < 5ms cho tối đa 100 profiles.
2. **Bảo Mật (Security & CSP)**:
   - Áp dụng strict Content Security Policy (`script-src 'nonce-...'`).
   - Mật khẩu trong URL Proxy (`user:pass@...`) không được lưu ở dạng plaintext ngoài phạm vi SQLite được mã hóa.
3. **Chống Race Condition**: Khi nhận SSE event trạng thái trình duyệt, cờ `isDirty` ngăn không cho state ngầm đè mất nội dung người dùng đang nhập vào form inline edit.

---

## 7. Acceptance Criteria (BDD Scenarios)

```gherkin
Scenario: Khởi chạy trình duyệt thành công từ Sidebar
  Given Rust Daemon đang chạy trên cổng 8765
  And danh sách có một profile "Profile A" ở trạng thái "stopped"
  When người dùng nhấn nút "Launch" trên thẻ "Profile A"
  Then Extension gửi yêu cầu POST /api/browsers/profile-a/session
  And trạng thái của "Profile A" chuyển sang "● Active" kèm nút "Stop"

Scenario: Lưu chỉnh sửa Proxy inline
  Given người dùng đang mở form Edit cho "Profile B"
  When người dùng nhập proxy "http://10.0.0.1:8080" và bấm "Save"
  Then Extension gửi yêu cầu PATCH /api/browsers/profile-b với dữ liệu proxy mới
  And form edit đóng lại và hiển thị thông tin proxy mới
```
