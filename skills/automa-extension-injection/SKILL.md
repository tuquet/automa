---
name: automa-extension-injection
description: Architecture of Chromium Extension lifecycle and safe programmatic interaction rules via Puppeteer/CDP (automa-ext / automa-extension). Activate when debugging extension injection, temp pages, service worker awakening, or storage synchronization.
---

# Automa Extension Injection & Programmatic Communication (`automa-extension-injection`)

Giao tiếp programmatically với Chrome Extension của Automa **BẮT BUỘC** tuân thủ kiến trúc vòng đời Chromium để tránh `TargetCloseError` hoặc timeout.

---

## 1. Lựa chọn "Trang Trung Gian" (Stable Temp Page)
ExecutionContext của Puppeteer/CDP bị hủy diệt nếu trang HTML điều hướng, reload, hoặc đóng.
* **TUYỆT ĐỐI KHÔNG** dùng trang UI chính thức (`newtab.html`, `index.html`) làm trang trung gian để gọi Chrome API hoặc tiêm dữ liệu.
* **BẮT BUỘC** sử dụng trang tĩnh (`popup.html`, `options.html`).

---

## 2. Quản lý Bất Đồng Bộ Chrome API
* **BẮT BUỘC** bọc lệnh `page.evaluate()` và `page.close()` bằng `.catch(() => {})` hoặc `try...catch` ở Node.js.
* **BẮT BUỘC** gói gọn Chrome API bất đồng bộ vào `Promise` trong `evaluate()` và chỉ gọi `resolve()` khi callback hoàn tất.

```javascript
// Cấp độ Node.js: Xử lý an toàn để chống sập process
const evalPromise = tempPage.evaluate(async (url) => {
  return new Promise((resolve, reject) => {
    try {
      // Cấp độ Browser: Bọc Chrome API vào Promise
      chrome.windows.create({ url: url, type: 'popup' }, () => {
        resolve(true); // Chỉ resolve khi đã mở cửa sổ thành công
      });
    } catch (e) {
      reject(e.message);
    }
  });
}, studioUrl).catch((e) => {
  // Không bao giờ để lỗi Promise bong bóng lên main process
  console.warn(`[Safe Ignore] tempPage evaluate threw: ${e.message}`);
});
```

---

## 3. Đánh Thức Manifest V3 Service Worker
* **TUYỆT ĐỐI KHÔNG** chặn chờ Service Worker (blocking wait) vô thời hạn.
* **BẮT BUỘC** chủ động mở một trang UI của extension (như `popup.html`) để ép Chromium kích hoạt lại extension.

---

## 4. Tránh Race Condition Khi Cài Mới
* **BẮT BUỘC** poll kiểm tra `isFirstTime === false` (hoặc timeout) trước khi set giá trị mới qua `chrome.storage.local`.

---

## 5. Tiêm Script Bằng evaluateOnNewDocument
* **BẮT BUỘC** kết hợp cả hai lệnh để tiêm script an toàn:
  1. `await page.evaluateOnNewDocument(script)`
  2. `await page.evaluate(script)`

---

## 6. Dependency Injection
* **BẮT BUỘC** tiêm toàn bộ Workflows và Packages phụ thuộc vào `chrome.storage.local` qua `page.evaluate()` trước khi gọi Run hoặc mở Studio từ CLI.

---

## 7. Storage Source of Truth
* Nguồn dữ liệu gốc (Source of Truth) tại runtime là `browser.storage.local`.
* **TUYỆT ĐỐI KHÔNG** ghi/đọc từ `indexedDB.open('automa')` để đồng bộ dữ liệu Core.
* **BẮT BUỘC** sử dụng Observer lắng nghe `chrome.storage.onChanged` để thực hiện Auto-Save hoặc Two-Way Sync.
