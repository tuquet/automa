---
name: automa-cli-studio
description: "How to programmatically open a local Automa workflow inside the Automa Extension Studio using Puppeteer."
---

# Mở Automa Studio (automa-cli-studio)

Quy trình tự động hóa việc load một file workflow `.json` và mở nó dưới dạng giao diện Studio kéo thả bên trong extension Automa.

## Quy trình thuật toán (Algorithm)

Dữ liệu workflow của Automa được lưu trữ trong `chrome.storage.local` ở dạng Object map `{ [id]: workflowData }` thông qua key `workflows`.
Đường dẫn của giao diện Studio là `newtab.html#/workflows/[id]`.

Để tự động mở Studio từ CLI, ta thực hiện các bước sau:

1. **Chuẩn bị dữ liệu:**
   - Đọc file workflow `.json`.
   - Kiểm tra nếu workflow chưa có `id`, hãy tự động cấp một `id` (sử dụng `Date.now()` dạng chuỗi hoặc `crypto.randomUUID()`).

2. **Khởi chạy Trình duyệt (Browser):**
   - Dùng Puppeteer để mở trình duyệt ở chế độ có giao diện (`headless: false`).
   - Nạp sẵn Automa extension (sử dụng tham số `--load-extension` trỏ tới thư mục build của extension).

3. **Lấy Extension ID:**
   - Quét qua danh sách các trang đang mở (`browser.targets()`).
   - Tìm target thuộc về extension (URL bắt đầu bằng `chrome-extension://`).
   - Trích xuất `EXTENSION_ID` từ chuỗi URL đó (thường nằm ở phần tử thứ 3 sau khi split `/`).

4. **Tiêm (Inject) Workflow vào CSDL của Extension:**
   - Mở một `page` mới truy cập vào một trang bất kỳ thuộc extension (ví dụ: `chrome-extension://[EXTENSION_ID]/newtab.html`).
   - Dùng `page.evaluate()` để thực thi đoạn mã đọc và ghi đè dữ liệu vào `chrome.storage.local`:
     ```javascript
     await page.evaluate(async (workflowData) => {
         // Lấy danh sách workflows hiện tại
         const data = await chrome.storage.local.get('workflows');
         const workflows = data.workflows || {};
         // Cập nhật workflow vào storage
         workflows[workflowData.id] = workflowData;
         await chrome.storage.local.set({ workflows });
     }, workflowData);
     ```

5. **Chuyển hướng đến Studio:**
   - Sử dụng `page.goto('chrome-extension://[EXTENSION_ID]/newtab.html#/workflows/' + workflowData.id)` để đưa trình duyệt tới thẳng giao diện Studio.
   - Để nguyên trình duyệt mở (không gọi `browser.close()`) để người dùng có thể thao tác.
