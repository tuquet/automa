---
name: automa-ai-workflow-generation
description: Quy tắc bắt buộc cho AI khi sinh mã (generate) JSON workflows cho Automa Ecosystem (Looping, Conditionals, Variables, Iframes).
---

# Automa AI Workflow Generation Constraints

Khi AI đóng vai trò là kỹ sư tự động hóa sinh ra các JSON workflows cho Automa, bắt buộc phải tuân thủ nghiêm ngặt các quy tắc sau:

## 1. Looping (Vòng lặp)
- Khi gọi biến của vòng lặp, **BẮT BUỘC** dùng cú pháp ngầm định: `{{loopData.<loopId>.data}}`.
- **Edge Case:** Block xử lý cuối cùng của chu trình phải có một object trong mảng `edges` trỏ ngược `target` về ID của block `loop-data`. Nếu đứt dây này, `index` không được tăng và workflow kết thúc sớm.

## 2. Conditionals (Điều kiện)
- Dây cáp (edge) đi ra từ nhánh Match 1 phải khai báo `sourceHandle: 'cond1'` (trùng với ID của condition, ví dụ `data.conditions = [{ id: 'cond1', type: 'value', ... }]`).
- Dây cáp đi ra từ nhánh False/Error phải dùng `sourceHandle: 'fallback'`.

## 3. Variable Interpolation in JS (Biến trong JavaScript)
- **CẤM** dùng Mustache `{{}}` trong JS Block! Nếu chèn `{{variables.my_email}}`, V8 Engine sẽ ném lỗi Syntax Error vì dấu `{` bị xem là khối code.
- **BẮT BUỘC** dùng hàm nội bộ: `const mail = automaRefData('variables', 'my_email');`.

## 4. Error Handling / Fallback (Xử lý lỗi)
- Khi tạo các block tương tác như `click-element`, trong thuộc tính `data`, phải thiết lập cờ `onError: 'fallback'`.
- Sinh ra object `edge` có `source: <node_id>` và `sourceHandle: 'fallback'`, nối `target` tới ID của một block `telegram` hoặc `log` để ghi nhận lỗi.

## 5. Iframes (Chuyển đổi khung nền)
- Chromium không thể đâm xuyên qua Document Boundaries của thẻ Iframe.
- Bắt buộc phải sinh một block `switch-frame` (loại `switch-to-iframe`) trước khối `forms`, truyền tham số `data.selector` trỏ tới thẻ `<iframe>`.
- Khi tương tác xong, phải gọi lại `switch-frame` (loại `main-frame`) để thoát ra.

## 6. JavaScript Return (Code Bất đồng bộ)
- Lệnh `return` cổ điển bị vô hiệu hóa trong luồng của Engine (do code được bọc trong Promise).
- **BẮT BUỘC** sinh hàm nội bộ `automaNextBlock(data)` để Resolve Promise đó và chuyển chuỗi dữ liệu (payload) sang block tiếp theo.

## 7. Data Extraction (Không dùng `extract-data`)
- Hệ sinh thái Automa **KHÔNG TỒN TẠI** block `extract-data` hay thuộc tính `dataToExtract`.
- Để xuất Array/Table, AI phải dùng block `get-text` (hoặc `attribute-value`), thiết lập `multiple: true` và `saveData: true, dataColumn: "ColumnName"`.

## 8. Modularization (Module hóa workflow)
- Tránh Token Limit bằng cách thiết kế Micro-Workflows: sinh nhiều file `.workflow.json` nhỏ, mỗi file có ID Nanoid.
- Main Workflow chỉ chứa các block `execute-workflow` (chỉ định `executeId` bằng ID các file con). `WorkflowLinter` sẽ tự động quét đệ quy Vault để Cross-Reference nối chúng lại.

## 9. Auth/Cookies Bypass & Anti-Detection
- **Browser Profiles**: Ưu tiên sử dụng `--profile <ID>` khi chạy CLI thay vì block giải captcha. Trình duyệt sẽ nạp thư mục `User Data Dir` chứa Cookies cũ, bypass Login.
- **Headless Detection**: Đảm bảo sử dụng cờ `--headless=new` (không phải `--headless`) để giả lập đầy đủ pipeline render đồ họa, giúp fingerprint qua mặt Cloudflare.
