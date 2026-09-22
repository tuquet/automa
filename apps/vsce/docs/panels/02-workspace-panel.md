# 📁 Software Requirements Specification (SRS): Workspace & Storage Sidebar Panel

> [!IMPORTANT]
> ### 🔗 Core Daemon API Endpoints (`http://127.0.0.1:8765`)
> - `POST /api/v1/jobs` — *Thực thi kịch bản (Run Workflow / Package / Campaign)*
> - `GET /api/v1/storage/variables` — *Lấy danh sách biến toàn cục trong SQLite Storage*
> - `POST /api/v1/storage/variables` — *Thêm biến toàn cục mới*
> - `DELETE /api/v1/storage/variables/{id}` — *Xóa biến toàn cục khỏi Storage*
> - `GET /api/v1/storage/credentials` — *Lấy danh sách thông tin xác thực Credentials*
> - `POST /api/v1/storage/credentials` — *Thêm Credential mã hóa AES-256-CBC*
> - `DELETE /api/v1/storage/credentials/{id}` — *Xóa Credential*
> - `GET /api/v1/storage/tables` — *Lấy danh sách bảng dữ liệu SQLite*
> - `POST /api/v1/storage/tables` — *Tạo bảng dữ liệu mới*
> - `DELETE /api/v1/storage/tables/{id}` — *Xóa bảng dữ liệu*
> - `GET /api/v1/storage/tables/{id}/rows` — *Đọc các dòng dữ liệu trong bảng*
> - `POST /api/v1/storage/tables/{id}/rows` — *Thêm dòng dữ liệu mới vào bảng*

---

## 1. Executive Summary & Scope
Panel **`AUTOMATIONS`** (`view: automa.workspace`) và **`STORAGE`** (`view: automa.storage`) hiển thị cấu trúc kịch bản và kho dữ liệu toàn cục (**Global Storage**) trong SQLite Database. Hệ thống tuân thủ nghiêm ngặt nguyên tắc **Zero Folder Scanning**: không quét tự động các file JSON ngầm trên đĩa, toàn bộ cấu trúc trạng thái được nạp có chủ đích qua API hoặc Flat List với Namespace Tagging.

- **Vị trí UI**: Primary Sidebar (`automa-activity-bar` ➔ `automa.workspace`, `automa.storage`)
- **Extension Host Providers**:
  - [`AutomaFilesProvider.ts`](../../src/providers/AutomaFilesProvider.ts) (Bộ điều hướng Flat List kịch bản với Namespace Tagging)
  - [`StorageTreeDataProvider.ts`](../../src/providers/StorageTreeDataProvider.ts) (Bộ điều hướng Global SQLite Storage)

---

## 2. Functional Requirements (FR)

### FR-1: Quản Lý Flat List Kịch Bản (Workflows, Packages, Campaigns)
- **FR-1.1 Flat List với Namespace Tagging (Zero Nested Folders)**:
  - Hiển thị danh sách phẳng với huy hiệu namespace trực quan `[parent/namespace]` (ví dụ: `[google.com/fleets] • v1.28.0 • 8 blocks`), cấm phân cấp chevron sâu 4 tầng.
  - Không chạy lệnh quét ngầm toàn bộ đĩa; mở và lưu trực tiếp qua Custom Editor.
- **FR-1.2 Thực Thi 1-Click (Inline Play Button)**:
  - Hiển thị nút `$(play)` trực tiếp trên mỗi dòng kịch bản. Nhấn nút để tự động kiểm tra Daemon và kích hoạt chạy qua `submitJob()`.
- **FR-1.3 Mở Trình Soạn Thảo Trực Quan**:
  - Nhấp chuột trái vào tệp sẽ tự động mở Custom Editor tương ứng (`WorkflowPreviewEditorProvider` hoặc `CampaignPreviewEditorProvider`).

### FR-2: Quản Lý Dữ Liệu Toàn Cục (SQLite Global Storage)
- **FR-2.1 Cấu Trúc 3 Phân Mục Quản Lý Qua SQLite API**:
  - **Variables**: Biến chuỗi toàn cục (`/api/v1/storage/variables`).
  - **Credentials**: Thông tin tài khoản mã hóa (`/api/v1/storage/credentials`).
  - **Tables**: Bảng dữ liệu SQLite đa cột (`/api/v1/storage/tables`).
- **FR-2.2 Thêm Phần Tử Mới**:
  - Nhấn nút `+` trên thanh tiêu đề của mục để gọi REST API lưu trực tiếp vào SQLite:
    - `Add Variable`: Nhập Key và Value.
    - `Add Credential`: Nhập Identifier, Username, Password.
    - `Add Table`: Nhập tên bảng và cấu trúc cột.
- **FR-2.3 Xóa Phần Tử (Delete Storage Item)**:
  - Nút `$(trash)` trực tiếp trên mỗi phần tử để xóa an toàn khỏi database SQLite của Rust Daemon.

### FR-3: Tự Động Làm Sạch Cấu Trúc Tệp Cũ (Auto-Sanitization on Load)
- Khi tệp workflow xuất từ phiên bản extension cũ có ID dạng `n1`, `n2` hoặc thiếu trường `type`, hệ thống tự động làm sạch và sinh nanoid hợp lệ trước khi render lên UI.

---

## 3. UI/UX & Wireframe Specification

```
WORKSPACE
├── 📂 Workflows
│   ├── 📄 login.workflow.json             [▶] [👁️]
│   └── 📂 checkout
│       └── 📄 payment.workflow.json       [▶] [👁️]
├── 📦 Packages
│   └── 📦 recaptcha-solver.package.json   [▶] [👁️]
├── 🚀 Campaigns
│   └── 🚀 daily-crawl.campaigns.json      [▶] [👁️]
└── 🗄️ Global Storage                      [+] [🔄]
    ├── 🔑 Credentials
    │   └── 🔒 google_account              [🗑️]
    ├── 🏷️ Variables
    │   └── 📌 BASE_URL = https://app...   [🗑️]
    └── 📊 Tables
        └── 📑 products_table              [🗑️]
```

---

## 4. RESTful API & Backend Endpoints Specification (`automa-core`)

Giao thức RESTful giữa `StorageTreeDataProvider` và Rust Daemon (`automa-core`):

### 4.1 Quản Lý Biến Toàn Cục (Variables)
- **`GET /api/storage/variables`**: Lấy toàn bộ biến toàn cục.
  - **Response `200 OK`**:
    ```json
    [
      { "id": "var_1", "name": "BASE_URL", "value": "https://example.com" },
      { "id": "var_2", "name": "TIMEOUT", "value": "5000" }
    ]
    ```
- **`POST /api/storage/variables`**: Thêm biến mới.
  - **Request Body**: `{ "name": "API_KEY", "value": "xyz123" }`
  - **Response `201 Created`**: `{ "id": "var_3", "name": "API_KEY", "value": "xyz123" }`
- **`DELETE /api/storage/variables/{id}`**: Xóa biến theo ID.
  - **Response `200 OK`**: `{ "success": true, "deleted_id": "var_3" }`

### 4.2 Quản Lý Thông Tin Xác Thực (Credentials)
- **`GET /api/storage/credentials`**: Lấy danh sách credentials (đã ẩn mật khẩu).
  - **Response `200 OK`**:
    ```json
    [
      { "id": "cred_1", "name": "google_account", "username": "bot@gmail.com" }
    ]
    ```
- **`POST /api/storage/credentials`**: Thêm credential mới (Rust Daemon tự mã hóa AES-GCM).
  - **Request Body**: `{ "name": "google_account", "username": "bot@gmail.com", "password": "SecretPassword123" }`
  - **Response `201 Created`**: `{ "id": "cred_1", "name": "google_account", "username": "bot@gmail.com" }`
- **`DELETE /api/storage/credentials/{id}`**: Xóa credential.
  - **Response `200 OK`**: `{ "success": true, "deleted_id": "cred_1" }`

### 4.3 Quản Lý Bảng Dữ Liệu (Tables & Rows)
- **`GET /api/storage/tables`**: Lấy danh sách các bảng SQLite.
  - **Response `200 OK`**:
    ```json
    [
      { "id": "tbl_products", "name": "products_table", "row_count": 150 }
    ]
    ```
- **`POST /api/storage/tables`**: Tạo bảng mới.
  - **Request Body**: `{ "name": "products_table", "columns": ["id", "title", "price", "url"] }`
  - **Response `201 Created`**: `{ "id": "tbl_products", "name": "products_table", "columns": [...] }`
- **`DELETE /api/storage/tables/{id}`**: Xóa bảng theo ID.
  - **Response `200 OK`**: `{ "success": true, "deleted_id": "tbl_products" }`
- **`GET /api/storage/tables/{id}/rows`**: Lấy dữ liệu các dòng trong bảng.
- **`POST /api/storage/tables/{id}/rows`**: Chèn thêm dòng mới vào bảng.

---

## 5. Non-Functional Requirements (NFR)

1. **Hiệu Năng Tải Danh Sách Flat List**: Nạp danh sách tệp kịch bản dưới dạng Flat List với Namespace Tagging không đồng bộ kết hợp `Promise.all()` đạt tốc độ dưới 100ms.
2. **Bảo Mật Thông Tin Nhạy Cảm**:
   - Toàn bộ mật khẩu trong Credentials được mã hóa chuẩn AES-256-GCM trước khi lưu xuống SQLite.
   - Giá trị mật khẩu tuyệt đối không hiển thị ở dạng plaintext trên giao diện Tree View.
3. **Tính Toàn Vẹn Của Hệ Thống (Fault Tolerance)**: Nếu một tệp `.workflow.json` bị lỗi cú pháp JSON, Tree View vẫn render bình thường và hiển thị biểu tượng cảnh báo thay vì làm sập extension.

---

## 6. Acceptance Criteria (BDD Scenarios)

```gherkin
Scenario: Thực thi nhanh workflow từ Tree View
  Given workspace có tệp "scrape-prices.workflow.json"
  When người dùng bấm nút Play inline trên dòng tệp đó
  Then Extension gửi job lên Rust Daemon qua POST /api/jobs
  And thanh trạng thái hiển thị "Automa: Running scrape-prices"

Scenario: Thêm biến toàn cục mới vào Vault
  When người dùng bấm nút "+" trên mục Variables trong Global Vault
  And người dùng nhập tên biến "API_KEY" và giá trị "secret_token_123"
  Then Extension gọi API POST /api/storage/variables
  And cây thư mục tự động cập nhật hiển thị "API_KEY"
```
