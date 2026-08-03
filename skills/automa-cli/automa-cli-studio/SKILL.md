---
name: automa-cli-studio
description: "How to programmatically open a local Automa workflow inside the Automa Extension Studio using Puppeteer."
---

# Mở Automa Studio (automa-cli-studio)

Quy trình tự động hóa việc load một file workflow `.json` và mở nó dưới dạng giao diện Studio kéo thả bên trong extension Automa.

## Quy trình thuật toán (Algorithm)

Dữ liệu workflow của Automa bắt buộc phải được lưu trữ trong `chrome.storage.local` ở dạng **Object Map (Dictionary)** thông qua key `workflows` (Ví dụ: `{ "wf_123": { id: "wf_123", name: "..." } }`). 
Lý do: Automa sử dụng O(1) lookup thông qua `state.workflows[id]` trong Vuex store. Nếu lưu dưới dạng Mảng (Array), `state.workflows[id]` sẽ bị undefined, khiến Vue Router redirect ra trang Dashboard `#/workflows`.

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

4. **Tiêm (Inject) Workflow và Vượt qua Welcome Screen:**
   - Bắt buộc phải inject dữ liệu thông qua Background Service Worker của extension để tránh tab bị tự động đóng.
   - Dùng `worker.evaluate()` để đọc toàn bộ dữ liệu từ `chrome.storage.local`.
   - Tiêm workflow dưới dạng **Object Map**, đồng thời tiêm thêm cờ bypass onboarding vào `settings` (ví dụ: `hasCompletedWelcome: true`) để chặn Vue Router redirect về trang `#/welcome` trên profile mới.
     ```javascript
     await worker.evaluate(async (workflowData) => {
         return new Promise((resolve) => {
             chrome.storage.local.get(null, (data) => {
                 // 1. Bypass Welcome Screen
                 let settings = data.settings || {};
                 settings.hasCompletedWelcome = true;
                 
                 // 2. Inject Workflow as Object Map (Dictionary)
                 let workflows = data.workflows || {};
                 if (Array.isArray(workflows)) {
                     const obj = {};
                     workflows.forEach(w => { if (w && w.id) obj[w.id] = w; });
                     workflows = obj;
                 }
                 workflows[workflowData.id] = workflowData;
                 
                 chrome.storage.local.set({ workflows, settings }, resolve);
             });
         });
     }, workflowData);
     ```

5. **Mở giao diện Studio (Popup Window):**
   - Automa sẽ tự động đóng các tab không phải là dạng popup (`currentWindow.type !== 'popup'`).
   - Bắt buộc phải tạo window dạng popup từ Service Worker thay vì dùng `page.goto()`:
     ```javascript
     const studioUrl = `chrome-extension://${EXTENSION_ID}/newtab.html#/workflows/${workflowData.id}`;
     await worker.evaluate(async (url) => {
         await chrome.windows.create({ url, type: 'popup', width: 1280, height: 800 });
     }, studioUrl);
     ```
   - Để nguyên CLI chạy cho đến khi trình duyệt đóng lại (người dùng làm việc xong).
