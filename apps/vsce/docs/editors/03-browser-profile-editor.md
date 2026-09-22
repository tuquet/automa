# 🌐 Software Requirements Specification (SRS): Browser Profile Custom Editor

> [!IMPORTANT]
> ### 🔗 Core Daemon API Endpoints (`http://127.0.0.1:8765`)
> - `PUT /api/browsers/{id}` & `PATCH /api/browsers/{id}` — *Cập nhật chi tiết hồ sơ profile (Proxy, UserAgent, Name, Flags)*
> - `GET /api/browsers/{id}` — *Lấy toàn bộ thông tin chi tiết của một hồ sơ*
> - `POST /api/browsers/{id}/session` — *Khởi chạy phiên làm việc cô lập cho profile*
> - `DELETE /api/browsers/{id}/session` — *Đóng phiên làm việc cô lập*
> - `POST /api/browsers/{id}/sideload-extension` — *Nạp trực tiếp Chrome Extension bundle vào profile*
> - `GET /api/browsers/{id}/cookies` *(Proposed)* — *Xuất danh sách Cookies dưới dạng JSON*
> - `POST /api/browsers/{id}/cookies` *(Proposed)* — *Nhập danh sách Cookies JSON vào profile session*

---

## 1. Executive Summary & Scope
Trình soạn thảo **`Browser Profile Editor`** (`viewType: automa.browserEditor`) kích hoạt khi người dùng mở các tệp cấu hình trình duyệt độc lập `*.browser.json` trong VS Code. Nó cung cấp giao diện quản lý chuyên sâu cho từng hồ sơ trình duyệt, cấu hình mạng proxy, user-agent, cờ khởi chạy nâng cao và đồng bộ hóa với Rust Daemon.

- **Kích hoạt khi**: Mở tệp `*.browser.json`
- **Extension Host Controller**: [`BrowserEditorProvider.ts`](../../src/providers/BrowserEditorProvider.ts)
- **Webview UI Engine**: [`WebviewHtmlResolver.ts`](../../src/core/webview/WebviewHtmlResolver.ts) (Chế độ `isSingleEditor`)

---

## 2. Functional Requirements (FR)

### FR-1: Chỉnh Sửa Hồ Sơ Chuyên Sâu (Profile Configuration)
- **FR-1.1 Định Danh & Loại Trình Duyệt**:
  - `Display Name`: Tên hồ sơ trình duyệt.
  - `Browser Type`: Chọn giữa `Chromium` và `Firefox`.
- **FR-1.2 Cấu Hình Mạng (Proxy Configuration)**:
  - Hỗ trợ đầy đủ các giao thức proxy: HTTP, HTTPS, SOCKS5.
  - Hỗ trợ xác thực: `http://username:password@ip_address:port`.
- **FR-1.3 Dấu Vân Tay Thiết Bị (User-Agent Spoofing)**:
  - Nhập chuỗi User-Agent tùy biến để giả lập các thiết bị di động hoặc máy tính bảng.
- **FR-1.4 Cờ Khởi Động Nâng Cao (Flags / Startup Arguments)**:
  - Cấu hình các tham số dòng lệnh Chromium như `--disable-gpu`, `--no-sandbox`, `--disable-web-security`.

### FR-2: Chế Độ Xem Kép (Dual View: Form vs CodeMirror JSON)
- **FR-2.1 Form View**: Giao diện form nhập liệu thân thiện cho người dùng thông thường.
- **FR-2.2 JSON Code View**: Trình soạn thảo mã nguồn tích hợp CodeMirror có highlight cú pháp JSON dành cho lập trình viên cần chỉnh sửa thô các trường phức tạp.

### FR-3: Lưu Trữ & Đồng Bộ
- **FR-3.1 Nút `Save Profile`**: Ghi đè dữ liệu trực tiếp vào tệp `*.browser.json` và đồng bộ cấu hình vào database của Rust Daemon.

---

## 3. UI/UX & Wireframe Specification

```
+-------------------------------------------------------------------------+
| 🌐 Browser Profile: Marketing USA  [Chromium]               [💾 Save Profile] |
+-------------------------------------------------------------------------+
| [📝 Form Editor]  [📄 JSON Source]                                      |
+-------------------------------------------------------------------------+
| Display Name:     [Marketing USA                         ]              |
| Browser Type:     [Chromium                            ▼]              |
| Proxy Server:     [http://user:pass@198.51.100.1:8080    ]              |
| User Agent:       [Mozilla/5.0 (Windows NT 10.0; Win64)...]              |
+-------------------------------------------------------------------------+
```

---

## 4. RESTful API & Backend Endpoints Specification (`automa-core`)

### 4.1 Đồng Bộ Profile Lên Daemon Database
- **Endpoint**: `PUT /api/browsers/{id}`
- **Request Body**:
```json
{
  "name": "Marketing USA",
  "browser_type": "Chromium",
  "proxy": "http://user:pass@198.51.100.1:8080",
  "user_agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
  "flags": ["--disable-gpu", "--no-sandbox"]
}
```
- **Response `200 OK`**: Thông tin profile đã lưu.

### 4.2 Nạp Extension Vào Profile *(Sideload Extension)*
- **Endpoint**: `POST /api/browsers/{id}/sideload-extension`
- **Request Body**:
```json
{
  "extension_path": "c:/Users/.../automa-ext/dist"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Extension sideloaded into profile user data directory"
}
```

---

## 5. Acceptance Criteria (BDD Scenarios)

```gherkin
Scenario: Lưu profile với proxy xác thực
  Given người dùng đang mở tệp "usa.browser.json"
  When người dùng nhập proxy "socks5://auth_user:pass123@1.2.3.4:1080"
  And người dùng bấm nút "Save Profile"
  Then tệp "usa.browser.json" được ghi xuống đĩa
  And thông báo "Browser profile saved successfully" hiển thị
```
