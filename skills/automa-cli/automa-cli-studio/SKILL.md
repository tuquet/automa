---
name: automa-cli-studio
description: Giao thức mở và lập trình file workflow Automa cục bộ bên trong Automa Extension Studio.
---

# Mở Automa Studio (automa-cli-studio)

BẮT BUỘC TỰ ĐỘNG HÓA việc tải một file workflow `.json` và MỞ nó trong giao diện kéo-thả Studio của Extension. Theo kiến trúc Thin Client & Daemon hiện đại, TUYỆT ĐỐI KHÔNG sử dụng `child_process` để mở công cụ; BẮT BUỘC GỌI Daemon API để giao tiếp.

## Quy Trình Thuật Toán (Algorithm)

BẮT BUỘC LƯU TRỮ dữ liệu workflow trong `chrome.storage.local` dưới dạng một **Object Map (Dictionary)** thông qua khóa `workflows` (ví dụ: `{ "wf_123": { id: "wf_123", name: "..." } }`).
TUYỆT ĐỐI KHÔNG LƯU TRỮ dưới dạng mảng (Array) để ngăn chặn lỗi `state.workflows[id]` bị undefined, gây ra tình trạng Vue Router tự động chuyển hướng về trang Dashboard `#/workflows`.

Đường dẫn giao diện Studio: `newtab.html#/workflows/[id]`.

BẮT BUỘC THỰC THI các bước sau để mở Studio:

1. **Chuẩn Bị Dữ Liệu:**
   - BẮT BUỘC ĐỌC file workflow `.json`.
   - NẾU workflow thiếu `id`, BẮT BUỘC TẠO một `id` mới (sử dụng chuỗi `Date.now()` hoặc `crypto.randomUUID()`).

2. **Khởi Chạy Trình Duyệt (Browser):**
   - PHẢI DÙNG Puppeteer để khởi chạy browser với giao diện UI (`headless: false`).
   - BẮT BUỘC TẢI Automa extension bằng cách sử dụng tham số `--load-extension` trỏ tới thư mục build extension.

3. **Lấy Extension ID:**
   - BẮT BUỘC QUÉT các mục tiêu của trình duyệt (`browser.targets()`).
   - BẮT BUỘC TÌM mục tiêu extension (URL bắt đầu bằng `chrome-extension://`).
   - BẮT BUỘC TRÍCH XUẤT `EXTENSION_ID` từ URL (thường là phần tử thứ 3 sau khi tách chuỗi bằng dấu `/`).

4. **Tiêm (Inject) Workflow và Vượt Qua Màn Hình Chào Mừng (Welcome Screen):**
   - BẮT BUỘC TIÊM dữ liệu thông qua Background Service Worker của extension để tránh tình trạng tự động đóng tab.
   - BẮT BUỘC THỰC THI `worker.evaluate()` để đọc dữ liệu từ `chrome.storage.local`.
   - BẮT BUỘC TIÊM workflow dưới dạng **Object Map** và BẮT BUỘC ĐẶT cờ bỏ qua onboarding trong `settings` (`hasCompletedWelcome: true`) để ngăn chặn việc chuyển hướng sang trang `#/welcome`.
     ```javascript
     await worker.evaluate(async (workflowData) => {
         return new Promise((resolve) => {
             chrome.storage.local.get(null, (data) => {
                 // 1. Vượt qua Welcome Screen
                 let settings = data.settings || {};
                 settings.hasCompletedWelcome = true;
                 
                 // 2. Tiêm Workflow dưới dạng Object Map (Dictionary)
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

5. **Mở Giao Diện Studio (Cửa Sổ Popup):**
   - BẮT BUỘC MỞ cửa sổ popup từ Service Worker (Automa mặc định tự động đóng các tab không phải là popup).
   - TUYỆT ĐỐI KHÔNG DÙNG `page.goto()`. BẮT BUỘC TẠO cửa sổ thông qua chrome API:
     ```javascript
     const studioUrl = `chrome-extension://${EXTENSION_ID}/newtab.html#/workflows/${workflowData.id}`;
     await worker.evaluate(async (url) => {
         await chrome.windows.create({ url, type: 'popup', width: 1280, height: 800 });
     }, studioUrl);
     ```
   - BẮT BUỘC GIỮ tiến trình chạy cho đến khi trình duyệt bị đóng.
