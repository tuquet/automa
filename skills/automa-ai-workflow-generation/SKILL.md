---
name: automa-ai-workflow-generation
description: Quy tắc bắt buộc cho AI khi sinh mã (generate) JSON workflows cho Automa Ecosystem (Looping, Conditionals, Variables, Iframes).
---

# Automa AI Workflow Generation Constraints

**BẮT BUỘC TUÂN THỦ** nghiêm ngặt các quy tắc sau khi sinh JSON workflows cho Automa:

## 1. Looping (Vòng lặp)
- **BẮT BUỘC DÙNG** cú pháp ngầm định khi gọi biến vòng lặp: `{{loopData.<loopId>.data}}`.
- **Edge Case:** Block xử lý cuối cùng của chu trình **BẮT BUỘC PHẢI CÓ** một object trong mảng `edges` trỏ ngược `target` về ID của block `loop-data`. Nếu đứt dây này, `index` **TUYỆT ĐỐI KHÔNG** được tăng và workflow kết thúc sớm.

## 2. Conditionals (Điều kiện)
- Dây cáp (edge) đi ra từ nhánh Match 1 **BẮT BUỘC PHẢI KHAI BÁO** `sourceHandle: 'cond1'` (trùng với ID của condition, ví dụ `data.conditions = [{ id: 'cond1', type: 'value', ... }]`).
- Dây cáp đi ra từ nhánh False/Error **BẮT BUỘC PHẢI DÙNG** `sourceHandle: 'fallback'`.

## 3. Variable Interpolation in JS (Biến trong JavaScript)
- **TUYỆT ĐỐI CẤM** dùng Mustache `{{}}` trong JS Block! Nếu chèn `{{variables.my_email}}`, V8 Engine **CHẮC CHẮN SẼ** ném lỗi Syntax Error vì dấu `{` bị xem là khối code.
- **BẮT BUỘC DÙNG** hàm nội bộ: `const mail = automaRefData('variables', 'my_email');`.

## 4. Error Handling / Fallback (Xử lý lỗi)
- Khi tạo các block tương tác như `click-element`, **BẮT BUỘC PHẢI THIẾT LẬP** cờ `onError: 'fallback'` trong thuộc tính `data`.
- **BẮT BUỘC SINH RA** object `edge` có `source: <node_id>` và `sourceHandle: 'fallback'`, **PHẢI NỐI** `target` tới ID của một block `telegram` hoặc `log` để ghi nhận lỗi.

## 5. Iframes (Chuyển đổi khung nền)
- Chromium **TUYỆT ĐỐI KHÔNG THỂ** đâm xuyên qua Document Boundaries của thẻ Iframe.
- **BẮT BUỘC SINH** một block `switch-frame` (loại `switch-to-iframe`) trước khối `forms`, **BẮT BUỘC TRUYỀN** tham số `data.selector` trỏ tới thẻ `<iframe>`.
- Khi tương tác xong, **BẮT BUỘC PHẢI GỌI LẠI** `switch-frame` (loại `main-frame`) để thoát ra.

## 6. JavaScript Return (Code Bất đồng bộ)
- Lệnh `return` cổ điển **BẮT BUỘC BỊ VÔ HIỆU HÓA** trong luồng của Engine (do code được bọc trong Promise).
- **BẮT BUỘC SINH** hàm nội bộ `automaNextBlock(data)` để Resolve Promise đó và **PHẢI CHUYỂN** chuỗi dữ liệu (payload) sang block tiếp theo.

## 7. Data Extraction (Không dùng `extract-data`)
- Hệ sinh thái Automa **TUYỆT ĐỐI KHÔNG TỒN TẠI** block `extract-data` hay thuộc tính `dataToExtract`.
- Để xuất Array/Table, **BẮT BUỘC PHẢI DÙNG** block `get-text` (hoặc `attribute-value`), **PHẢI THIẾT LẬP** `multiple: true` và `saveData: true, dataColumn: "ColumnName"`.

## 8. Modularization (Module hóa workflow)
- **BẮT BUỘC THIẾT KẾ** Micro-Workflows để tránh Token Limit: **PHẢI SINH** nhiều file `.workflow.json` nhỏ, mỗi file có ID Nanoid.
- Main Workflow **CHỈ ĐƯỢC PHÉP CHỨA** các block `execute-workflow` (chỉ định `executeId` bằng ID workflow con). Các sub-workflows được liên kết và quản lý tập trung qua Storage API (`/api/v1/storage/workflows`) hoặc nhúng trực tiếp.

## 9. Auth/Cookies Bypass & Anti-Detection
- **Browsers**: **BẮT BUỘC ƯU TIÊN SỬ DỤNG** `--browser <ID>` khi chạy CLI thay vì block giải captcha. Trình duyệt **CHẮC CHẮN SẼ** nạp thư mục `User Data Dir` chứa Cookies cũ, bypass Login.
- **Headless Detection**: **BẮT BUỘC ĐẢM BẢO SỬ DỤNG** cờ `--headless=new` (không phải `--headless`) để giả lập đầy đủ pipeline render đồ họa, giúp fingerprint qua mặt Cloudflare.

## 10. Node ID & Handle Invariants for VueFlow
- **Node ID**: Mỗi block node **BẮT BUỘC SỬ DỤNG** ID dạng Nanoid duy nhất (tránh đặt tên thô sơ `n1`, `node_1`).
- **Handles & Edges**: Dây nối **BẮT BUỘC KHAI BÁO** đầy đủ `sourceHandle` và `targetHandle` khớp với định nghĩa cổng của từng loại block.
- **Workflow Schema**: Tham chiếu kiểu dữ liệu chuẩn từ `@automa/types` ([`packages/types`](../../packages/types)).
