---
name: automa-cli-lint
description: Thông số kỹ thuật và các quy tắc để kiểm tra (lint) tính hợp lệ của file cấu hình Automa (Workflow và Package).
---

# Linter Specification cho Automa Ecosystem

Skill này định nghĩa các quy tắc cốt lõi để phát triển tính năng `automa lint` trong `automa-cli`. Tính năng này sẽ đóng vai trò như một Core Linter API để không chỉ sử dụng trực tiếp qua command line mà còn cung cấp logic validate cho Automa VS Code Extension (dạng Context Menu 'Lint Check') và giúp Agent có nền tảng vững chắc để tự động sửa lỗi JSON.

## 1. Kiểm tra cấu trúc bằng JSON Schema (Structural Linting)
Thay vì code tay từng trường hợp `if/else`, Linter nên tận dụng sức mạnh của **JSON Schema Validation** (sử dụng các thư viện như `ajv` hoặc `zod`). 
- **Với Workflow:** Load file `automa.schema.json` và đưa dữ liệu vào validate. Schema V7 đã định nghĩa sẵn các loại `BlockTrigger`, `Block...`, và các thuộc tính bắt buộc.
- **Với Package:** Load file `package.schema.json` để validate. Schema này đã định nghĩa chuẩn cấu trúc mảng `inputs`, `outputs`, và `settings.asBlock`.
- **Ưu điểm:** Tận dụng schema.json sẽ tự động bắt tất cả các lỗi sai kiểu dữ liệu (`string` vs `boolean`), thiếu trường bắt buộc (`required`), và các thuộc tính rác. Linter chỉ cần lấy danh sách lỗi (`errors`) từ bộ validator và chuẩn hóa đầu ra. Agent khi đọc thông báo lỗi từ schema sẽ biết chính xác block nào sai định dạng để sửa.

## 2. Chuẩn hóa NanoID (ID Validation)
Mặc dù JSON Schema khai báo `id` là `"type": "string"`, Linter cần bổ sung một rule kiểm tra ngữ nghĩa sâu hơn:
- **Độ dài:** Chính xác 21 ký tự.
- **Bảng chữ cái (Alphabet):** `useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict` (tương đương `A-Za-z0-9_-`).
- **Linter Rule:** Duyệt qua thuộc tính `id` ở root (nếu có) và tất cả `id` của từng node trong `drawflow.nodes`. ID không khớp regex `/^[A-Za-z0-9_-]{21}$/` sẽ bị đánh dấu [Lỗi/Invalid]. (Lưu ý: Không được nhầm lẫn với các ID legacy tự chế như `workflow_..._timestamp`).

## 3. Quản lý Biến (Semantic Variables Linting)
JSON Schema không thể hiểu được mối quan hệ giữa các giá trị động, do đó phần này cần xử lý code custom:
- **Implicit Variables (Biến dùng ẩn):** Linter sẽ quét qua mã nguồn hoặc duyệt cây JSON, tìm các biến bằng 2 Regex:
  1. Interpolation: `/\{\{\s*variables\.([a-zA-Z0-9_$]+)\s*\}\}/g`
  2. Hàm RefData: `/automaRefData\(\s*['"]variables['"]\s*,\s*['"]([a-zA-Z0-9_$]+)['"]\s*\)/g`
- **Explicit Variables (Biến khai báo):** Cần đối chiếu xem những biến được gọi ẩn có tồn tại trong `json.variable` (đối với Package) hoặc `BlockTrigger.data.parameters` (đối với Workflow) hay không.
- **Linter Rule:** Phóng [Cảnh báo/Warning] nếu một biến được nội suy nhưng chưa được khai báo trước.

## 4. Hướng phát triển tích hợp (Integration Guidelines)
- **Đối với automa-cli:** Lệnh `automa lint <file.json>` sẽ đọc file, chạy qua 2 bộ lọc Structural (Schema) và Semantic (Custom IDs/Variables) và trả ra CLI exit code phù hợp (0 cho Pass, 1 cho Fail), kèm log lỗi chi tiết dạng JSON hoặc Console Table.
- **Đối với automa-vscode:** Nên tích hợp gọi lệnh CLI này thông qua một Command mới trên Context Menu (VD: `Automa: Lint Check Workflow`). Kết quả trả về từ CLI sẽ được hiển thị trên bảng Diagnostics (bảng Problems của VS Code) để báo đỏ trực tiếp tại dòng JSON lỗi.
