---
name: automa-extension-injection
description: Hướng dẫn an toàn khi tiêm dữ liệu vào Extension Automa và tương tác với UI.
---

# Automa Extension Injection & Communication

Khi cần giao tiếp programmatically với Chrome Extension của Automa (ví dụ: dùng Puppeteer để tiêm workflow và mở giao diện), **PHẢI** tuân thủ các bài học quan trọng sau để tránh các lỗi race condition hoặc bị cơ chế bảo vệ của Vue Router phá hủy (session closed, tab disappeared).

## 1. Tránh Race Condition khi cài mới (isFirstTime)
Khi extension khởi động lần đầu, store `workflow.js` của Automa sẽ đặt `isFirstTime = true`. Gần như ngay lập tức sau đó, nó sẽ đè toàn bộ `chrome.storage.local` bằng các `firstWorkflows` mặc định và set `isFirstTime = false`.
* **Lesson**: Nếu tiêm workflow đúng lúc `isFirstTime` đang true, workflow của ta sẽ bị ghi đè xóa sạch.
* **Quy tắc**: Trong script tiêm (`page.evaluate`), **phải** tạo vòng lặp poll kiểm tra storage. Chỉ được phép ghi vào storage khi `isFirstTime === false`.

## 2. Tiêu diệt cơ chế bảo vệ trùng tab của App.vue
`App.vue` của Automa có đoạn mã cực kỳ khắt khe: Nếu có nhiều hơn 1 tab có URL kết thúc bằng `newtab.html` (điển hình như trang Dashboard hoặc Welcome), nó sẽ chuyển focus về tab cũ và **TỰ ĐỘNG ĐÓNG tab mới vừa mở**.
* **Lesson**: Nếu ta mở Popup Editor (vốn cũng là `newtab.html`), Popup sẽ tự sát (bị đóng ngay lập tức).
* **Quy tắc**: Trước khi gọi Chrome API để mở Studio/Editor, **BẮT BUỘC** phải gọi `chrome.tabs.query({ url: "*://*/newtab.html*" })` và dùng `chrome.tabs.remove` để đóng **TẤT CẢ** các tab `newtab.html` và `execute.html` đang mở.

## 3. Khởi tạo bằng Chrome Extension API thay vì Puppeteer
Automa có kiểm tra Context Window:
`if (currentWindow.type !== 'popup') { browser.tabs.remove(...); }`
* **Lesson**: Việc sử dụng `puppeteer.newPage()` để mở giao diện Editor sẽ tạo ra một Normal Tab, khiến Router của Automa từ chối mở Editor.
* **Quy tắc**: Dùng `chrome.windows.create({ type: 'popup', url: studioUrl })` thông qua hàm `page.evaluate()` chạy trên một trang background/execute tạm thời để mở Popup Editor hợp lệ.

## 4. Bảo tồn Context để chống Session Closed Error
Khi bọc lệnh `chrome.windows.create` (một hàm Async của Chrome API) bên trong `puppeteer.evaluate()`, nếu script của Puppeteer thoát quá sớm (return ngay), Node.js sẽ tiếp tục gọi `tempPage.close()`. Hậu quả là Context JavaScript chứa hàm callback của Chrome API bị đóng đột ngột, gây ra lỗi `TargetCloseError: Protocol error / Session closed`.
* **Quy tắc**: **LUÔN LUÔN** gói logic gọi Chrome API bất đồng bộ vào một `Promise` bên trong hàm `page.evaluate()`, và chỉ gọi `resolve()` khi Callback của Chrome API đã hoàn tất (VD: bên trong callback của `chrome.windows.create`).

Ví dụ chuẩn mực:
```javascript
await tempPage.evaluate(async (url) => {
    return new Promise((resolve, reject) => {
        try {
            // Bước 1: Tiêu diệt tab cũ
            chrome.tabs.query({ url: "chrome-extension://*/newtab.html*" }, (tabs) => {
                tabs.forEach((t) => chrome.tabs.remove(t.id));
                
                // Bước 2: Tạo popup với delay an toàn
                setTimeout(() => {
                    chrome.windows.create({ url: url, type: 'popup' }, () => {
                        // Bước 3: Resolve promise sau khi popup đã sinh ra
                        resolve(true);
                    });
                }, 200);
            });
        } catch (e) {
            reject(e.message);
        }
    });
}, studioUrl);
```
