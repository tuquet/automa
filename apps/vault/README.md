# 🗄️ Automa Storage Workspace (Local File System & Mapping)

**Automa Vault** là kho lưu trữ không gian làm việc cục bộ (**Storage Workspace**) và định tuyến kịch bản tập trung cho toàn bộ hệ sinh thái Automa. Nó đóng vai trò như một File System chuyên biệt để tách biệt Dữ liệu cấu hình (Browsers, Campaigns) ra khỏi Mã nguồn kịch bản (Workflows).

---

## 💡 PHÂN ĐỊNH NGỮ NGHĨA: "STORAGE" VS "WORKSPACE"

Để tránh nhầm lẫn giữa khái niệm của người dùng Automa gốc và cấu trúc tệp của hệ sinh thái:

1. **Global Storage (Khái niệm chuẩn của Automa)**:
   - Là cơ sở dữ liệu lưu trữ các thông tin nghiệp vụ toàn cục của Automa gồm 3 thành phần:
     - 📊 **Storage Tables**: Các bảng dữ liệu hai chiều (hàng & cột) để workflow đọc/ghi (`/api/storage/tables`).
     - 🔤 **Storage Variables**: Các biến toàn cục dùng chung (`/api/storage/variables`).
     - 🔑 **Storage Credentials**: Khóa API và tài khoản bảo mật được mã hóa AES-256 (`/api/storage/credentials`).
   - Được quản lý tập trung bởi Rust Daemon (`automa-core`) qua cơ sở dữ liệu SQLite nhúng (`AutomaDb`).

2. **Storage Workspace (Tệp trên ổ cứng - Submodule `automa-vault`)**:
   - Là thư mục tệp tin vật lý chứa các kịch bản `.workflow.json`, ma trận chiến dịch đa luồng `.campaigns.json`, và hồ sơ trình duyệt `.browser.json`.

---

## 🛑 QUY TẮC CẤU TRÚC (BẮT BUỘC)

### 1. Phân Cấp Thư Mục
Kho tệp Workspace **BẮT BUỘC** duy trì cấu trúc thư mục nghiêm ngặt như sau. **TUYỆT ĐỐI KHÔNG** thay đổi vị trí lưu trữ gốc nếu không thông qua file config.

```text
automa-vault/
├── workflows/        # Chứa các file *.automa.json (Logic)
├── campaigns/        # Chứa các file *.campaigns.json (Điều phối ma trận song song)
├── browsers/         # Chứa các file *.browser.json (Session Profile Trình duyệt)
└── globals/          # Chứa credentials.json (Biến môi trường mã hoá dự phòng)
```

### 2. Định Dạng Campaigns (`*.campaigns.json`)
Campaigns là trái tim của tính năng chạy song song. Một Campaign **BẮT BUỘC** khai báo danh sách các `browsers`. Mỗi Browser chứa danh sách `tasks` gắn với các Workflow tương ứng.

- **Không Hardcode:** **TUYỆT ĐỐI KHÔNG** hardcode trực tiếp đường dẫn file trong file JSON. Chỉ sử dụng `workflow_id` và `browser_id`. Linter và Runner sẽ tự động Resolve ID thành file vật lý trong Workspace.
- **Quy tắc Chạy Song Song:** Mỗi Browser trong một Campaign sẽ được gán một tiến trình Chromium độc lập với Session riêng biệt từ Browser đó.

### 3. Quản Lý Browsers (`*.browser.json`)
- **Tách Biệt Session:** Mỗi Browser ID tương ứng với một thư mục User Data Dir của Chromium. Điều này **BẮT BUỘC** để đảm bảo tài khoản login (Cookies, LocalStorage) không bị dẫm chân lên nhau khi chạy Campaign đa luồng.
- **Headless & UI:** Tuỳ thuộc vào tuỳ chọn `defaultKeepBrowserOpen`, Browser có thể khởi chạy Chromium có giao diện hoặc chạy ngầm.

### 4. Xử Lý Xung Đột (Concurrency Locks)
- **TUYỆT ĐỐI KHÔNG** cấu hình 2 tiến trình chạy cùng lúc sử dụng chung một `browser_id`. Trình duyệt sẽ bị Crash do Lock File của thư mục User Data.
- Nếu một Job đang chiếm dụng một Browser, Job thứ 2 gọi đến Browser đó **BẮT BUỘC** phải bị block hoặc báo lỗi `[Browser In Use]`.

---

## 📚 BẢNG THUẬT NGỮ CỐT LÕI (STORAGE & WORKSPACE TERMINOLOGY)

| Thuật Ngữ Chuẩn (Canonical Term) | Thành Phần Code Đại Diện | Mô Tả Kỹ Thuật Ngắn Gọn |
| :--- | :--- | :--- |
| **Storage Workspace** | `automa-vault/` | Kho lưu trữ tệp cục bộ có cấu trúc phân cấp nghiêm ngặt, chứa các file kịch bản, cấu hình trình duyệt và chiến dịch. |
| **Global Storage** | `/api/storage/*`, `AutomaDb` | Cơ sở dữ liệu nghiệp vụ Automa gồm Tables, Variables và Credentials lưu trữ an toàn trong SQLite. |
| **Campaign Matrix** | `*.campaigns.json` | File cấu hình ma trận điều phối tự động hóa song song đa luồng, ánh xạ từng `browser_id` với danh sách `tasks` (workflow_id). |
| **Browser Profile** | `*.browser.json` | File định nghĩa cấu hình độc lập của trình duyệt (proxy, user-agent, custom flags, chế độ headless, user data dir path). |
| **User Data Dir** | `userDataDir`, `{vault}/browsers/{id}` | Thư mục vật lý lưu trữ toàn bộ session duyệt web (Cookies, LocalStorage, Cache) của từng profile riêng biệt. |
| **Concurrency Lock** | `[Browser In Use]` | Cơ chế khóa ngăn chặn 2 tiến trình chạy đồng thời tranh chấp 1 `browser_id` để chống xung đột và hỏng file lock Chromium. |
| **Storage Credentials** | `credentials.json`, `/api/storage/credentials` | Dữ liệu mật khẩu và API token đã được mã hóa AES-256, tiêm an toàn vào runtime mà không lộ plain-text. |


