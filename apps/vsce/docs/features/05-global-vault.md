# 🔐 Software Requirements Specification (SRS): Global Storage & Secrets Management

> [!IMPORTANT]
> ### 🔗 Core Daemon API Endpoints (`http://127.0.0.1:8765`)
> - `POST /api/secrets/encryption` — *Dịch vụ mã hóa dữ liệu nhạy cảm chuẩn AES-256-GCM*
> - `GET /api/storage/variables` — *Lấy toàn bộ biến toàn cục*
> - `POST /api/storage/variables` — *Thêm hoặc cập nhật biến toàn cục*
> - `DELETE /api/storage/variables/{id}` — *Xóa biến toàn cục*
> - `GET /api/storage/credentials` — *Lấy danh sách tài khoản đã mã hóa*
> - `POST /api/storage/credentials` — *Lưu thông tin đăng nhập mới vào database SQLite*
> - `DELETE /api/storage/credentials/{id}` — *Xóa thông tin đăng nhập*
> - `GET /api/storage/tables` — *Lấy danh sách các bảng SQLite*
> - `POST /api/storage/tables` — *Tạo bảng dữ liệu mới*
> - `DELETE /api/storage/tables/{id}` — *Xóa bảng dữ liệu*
> - `GET /api/storage/tables/{id}/rows` — *Đọc các dòng trong bảng dữ liệu*
> - `POST /api/storage/tables/{id}/rows` — *Chèn thêm dòng dữ liệu mới*

---

## 1. Executive Summary & Scope
Đặc tả yêu cầu phần mềm cho hệ thống quản lý dữ liệu bảo mật toàn cục (**Global Storage**). Cung cấp cơ chế lưu trữ mã hóa chuẩn quân sự cho Credentials, Variables và các Bảng dữ liệu SQLite dùng chung trên toàn bộ các kịch bản tự động hóa.

- **Vị trí UI**: Primary Sidebar (`automa.storage` ➔ `Global Storage`)
- **Extension Host Provider**: [`StorageTreeDataProvider.ts`](../../src/providers/StorageTreeDataProvider.ts)
- **Lệnh Điều Khiển**: [`storageCommands.ts`](../../src/commands/storageCommands.ts)

---

## 2. Functional Requirements (FR)

### FR-1: Quản Lý Biến Toàn Cục (Variables)
- **FR-1.1 Thêm Biến**: Nhập Key và Value chuỗi. Lưu trữ vào bảng `variables` trong SQLite của Rust Daemon.
- **FR-1.2 Truy Xuất Trong Workflow**: Cho phép các block Automa đọc biến thông qua cú pháp template `{{global.key}}` hoặc `{{variables.key}}`.
- **FR-1.3 Xóa Biến**: Xóa biến trực tiếp từ giao diện Tree View.

### FR-2: Quản Lý Thông Tin Xác Thực (Credentials & Passwords)
- **FR-2.1 Mã Hóa AES-256-GCM**: Mọi mật khẩu và API token phải được mã hóa trước khi ghi xuống đĩa.
- **FR-2.2 Thêm Credential**: Hộp thoại nhập Tên định danh, Username, Password.
- **FR-2.3 Điền Tự Động (Auto-Fill)**: Các khối nhập liệu (Forms / Input Element) có thể giải mã và điền tài khoản vào trang web đích một cách an toàn mà không để lộ mật khẩu ra log.

### FR-3: Quản Lý Bảng Dữ Liệu SQLite (Tables)
- **FR-3.1 Lưu Trữ Bảng**: Quản lý các bảng dữ liệu nhiều cột dùng cho vòng lặp dữ liệu lớn (Loop Data).
- **FR-3.2 Xóa Bảng**: Xóa bảng và giải phóng dung lượng SQLite.

---

## 3. RESTful API & Backend Endpoints Specification (`automa-core`)

### 3.1 Dịch Vụ Mã Hóa Bí Mật (Secret Encryption Endpoint)
- **Endpoint**: `POST /api/secrets/encryption`
- **Mô tả**: Nhận plaintext password/secret từ client và trả về chuỗi mã hóa an toàn AES-256-GCM bằng master key của daemon.
- **Request Body**: `{ "plaintext": "MySuperSecretPassword123" }`
- **Response `200 OK`**: `{ "ciphertext": "enc:aes256:v1:a8f9b2c..." }`

### 3.2 Storage Variables Endpoints
- **`GET /api/storage/variables`**: Lấy danh sách toàn bộ biến.
- **`POST /api/storage/variables`**: Thêm biến mới.
  - Request: `{ "name": "TIMEOUT", "value": "10000" }`
  - Response `201 Created`: `{ "id": "var_1", "name": "TIMEOUT", "value": "10000" }`
- **`DELETE /api/storage/variables/{id}`**: Xóa biến.

### 3.3 Storage Credentials Endpoints
- **`GET /api/storage/credentials`**: Lấy danh sách credentials.
- **`POST /api/storage/credentials`**: Thêm credential mã hóa.
  - Request: `{ "name": "aws_account", "username": "admin@aws.com", "password": "MyPassword" }`
  - Response `201 Created`: `{ "id": "cred_aws", "name": "aws_account", "username": "admin@aws.com" }`
- **`DELETE /api/storage/credentials/{id}`**: Xóa credential.

### 3.4 Storage SQLite Tables Endpoints
- **`GET /api/storage/tables`**: Lấy danh sách các bảng.
- **`POST /api/storage/tables`**: Tạo bảng mới.
- **`DELETE /api/storage/tables/{id}`**: Xóa bảng.
- **`GET /api/storage/tables/{id}/rows`**: Lấy các dòng dữ liệu.
- **`POST /api/storage/tables/{id}/rows`**: Thêm dòng dữ liệu.

---

## 4. Non-Functional Requirements (NFR)

1. **Bảo Mật Bộ Nhớ (Zero Plaintext Leak)**: Mật khẩu không được lưu trong bộ nhớ heap lâu hơn thời gian cần thiết để giải mã.
2. **Toàn Vẹn Dữ Liệu (ACID Compliance)**: Mọi thao tác ghi Global Storage đều là các transaction SQLite an toàn, không bị hỏng hóc dữ liệu khi tắt máy đột ngột.

---

## 5. Acceptance Criteria (BDD Scenarios)

```gherkin
Scenario: Thêm Credential mới vào Global Storage
  When người dùng chạy lệnh "Automa: Add Credential"
  And nhập Tên = "google_bot", Username = "bot@gmail.com", Password = "SuperSecretPassword123"
  Then Extension gửi yêu cầu mã hóa tới Rust Daemon qua POST /api/storage/credentials
  And mục "google_bot" xuất hiện trong cây thư mục Global Storage với biểu tượng ổ khóa 🔒
```
