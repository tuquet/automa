---
name: automa-cli-run
description: Giao thức BẮT BUỘC để xác minh các phụ thuộc cục bộ (local dependencies) và chạy Automa CLI nhằm thực thi workflows.
---

# Giao Thức Chạy Automa CLI Cục Bộ (Local Run Protocol)

BẮT BUỘC XÁC MINH các phụ thuộc cục bộ và CHẠY runner Automa CLI (`automa-cli`) thành công trên máy phát triển dựa trên giao thức này. TUYỆT ĐỐI KHÔNG bỏ qua bất kỳ bước nào dưới đây.



## 2. Xác Minh Trạng Thái Build Extension

BẮT BUỘC CUNG CẤP bản build extension đã giải nén để thực thi workflow thông qua CLI runner.

### Hành Động Xác Minh:
BẮT BUỘC KIỂM TRA sự tồn tại của file `automa-ext/build/manifest.json`.

* **Chế độ Phát triển (Dev Mode):** BẮT BUỘC CHẠY `npm run dev` trong `automa-ext/` để đảm bảo thư mục `build/` luôn được cập nhật.
* **Chế độ Sản xuất (Prod Mode):** BẮT BUỘC CHẠY `npm run build:prod-chrome` trong `automa-ext/` để tạo bản build tại `automa-ext/build/`.

---

## 3. Tham Số Chạy CLI & Khởi Chạy

BẮT BUỘC ĐIỀU HƯỚNG tới `automa-cli/` trước khi chạy các lệnh sau. 
**LƯU Ý KIẾN TRÚC:** Khi tích hợp với các ứng dụng khác, TUYỆT ĐỐI KHÔNG sử dụng `child_process` để gọi lệnh CLI; thay vào đó, BẮT BUỘC GỌI trực tiếp Automa Daemon API theo kiến trúc Thin Client & Daemon hiện đại.

### Tùy Chọn A: Chạy qua file JSON cục bộ (Khuyên dùng cho Workflows trong Vault)
```bash
node dist/cli.js "../automa-vault/crm/workflows/Auth - Login.json" --extension ../automa-ext/build
```

### Tùy Chọn B: Chạy qua Database ID
```bash
node dist/cli.js --id <database_workflow_id> --extension ../automa-ext/build
```

### Truyền Tham Số Đầu Vào & Biến Số (Variables)
* **Direct JSON Variables:** BẮT BUỘC SỬ DỤNG cờ `--variables` (hoặc `-v`) kèm theo chuỗi JSON đã được stringify:
  ```bash
  node dist/cli.js <path> --variables '{"$$my_var": "custom_value"}'
  ```
* **Database Variables Auto-Populate:** BẮT BUỘC CHẠY `Vault: Push` trước khi thực thi để đảm bảo database chứa các giá trị mới nhất. CLI BẮT BUỘC tự động tiêm các biến toàn cục (bắt đầu bằng `$$`) từ Supabase DB cục bộ, trừ khi bị ghi đè bởi cờ `--variables`.
