---
name: automa-extension-injection
description: Kiến trúc Vòng đời Chromium Extension & Các nguyên tắc tương tác an toàn qua Puppeteer (automa-source / automa-ex).
---

# Automa Extension Injection & Communication

Khi cần giao tiếp programmatically với Chrome Extension của Automa (ví dụ: dùng Puppeteer để tiêm workflow, thiết lập trạng thái, hoặc mở giao diện), **PHẢI** thấu hiểu kiến trúc vòng đời của Chromium và tuân thủ các nguyên tắc sau để tránh các lỗi `TargetCloseError` chí mạng hoặc bị timeout.

## 1. Nguyên lý lựa chọn "Trang Trung Gian" (Stable Temp Page)
Khi Puppeteer thực thi mã JavaScript (qua hàm `page.evaluate()`), nó tạo ra một ExecutionContext gắn liền với trang HTML hiện tại. Nếu trang HTML này bị điều hướng (redirect), tải lại (reload), hoặc tự đóng (close) bởi các logic UI phức tạp (như Vue Router kiểm tra trạng thái onboarding hay check trùng lặp tab), ExecutionContext sẽ lập tức bị hủy diệt, gây ra lỗi `TargetCloseError` làm sập toàn bộ Node.js CLI process.

* **Lesson**: Trang `newtab.html` và `index.html` của Automa chứa rất nhiều logic routing tự động, khiến chúng trở nên cực kỳ mong manh và không ổn định khi được dùng làm môi trường chứa ExecutionContext dài hạn.
* **Quy tắc**: Tuyệt đối **không** dùng các trang UI chính thức làm trang trung gian để gọi Chrome API hoặc tiêm dữ liệu (inject storage). Luôn sử dụng các trang tĩnh và đơn giản nhất (ví dụ: `popup.html` hoặc `options.html`) vì chúng không bao giờ tự ý thay đổi trạng thái lifecycle của chính nó.

## 2. Quản lý trạng thái bất đồng bộ của Chrome API qua Puppeteer
Chrome Extension API (như `chrome.windows.create`, `chrome.storage.local.set`) là các hàm bất đồng bộ chạy ở tầng trình duyệt. Nếu kịch bản Puppeteer không chờ (await) các hàm này hoàn tất mà đã thoát sớm, vòng đời của callback sẽ bị đứt gãy. Ngược lại, nếu trình duyệt gặp sự cố khiến tab đóng lại giữa chừng, Promise của Puppeteer sẽ bị Reject và sập Node process nếu không được Catch.

* **Quy tắc**: 
  1. Luôn bọc các lệnh gọi `page.evaluate()` và `page.close()` bằng các khối `.catch(() => {})` hoặc `try...catch` ở cấp độ Node.js để ngăn chặn Unhandled Promise Rejection.
  2. Bên trong `evaluate()`, phải gói gọn các API bất đồng bộ của Chrome vào trong `Promise` và chỉ gọi `resolve()` khi callback thực sự hoàn tất.

Ví dụ chuẩn mực:
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

## 3. Đánh thức và duy trì Manifest V3 Service Worker (Chống Timeout)
Khác với MV2 (Background Pages chạy liên tục), MV3 sử dụng Service Worker, vốn có đặc tính phù du (ephemeral) và sẽ tự động ngủ đông sau một thời gian ngắn không hoạt động. Trong các môi trường Chromium cô lập (isolated/corporate browser), Service Worker có thể không được đăng ký (register) ngay lập tức hoặc bị hệ thống trì hoãn.

* **Lesson**: Việc dùng Puppeteer để poll `browser.targets()` và chờ đợi mù quáng sự xuất hiện của `service_worker` có thể dẫn đến treo CLI mãi mãi.
* **Quy tắc**: Không bao giờ code theo tư duy "chặn đứng chờ Service Worker xuất hiện" (blocking wait) mà không có timeout hoặc fallback. Để đảm bảo Service Worker bị ép "tỉnh giấc", hãy **chủ động mở một trang UI bình thường** của extension (như `popup.html`). Hành động này sẽ ép Chromium kích hoạt lại toàn bộ extension, đảm bảo Service Worker sẵn sàng để kết nối CDP mà không lo bị timeout.

## 4. Tránh Race Condition khi cài mới (isFirstTime)
Khi extension khởi động lần đầu, store `workflow.js` của Automa sẽ đặt `isFirstTime = true`. Gần như ngay lập tức sau đó, nó sẽ đè toàn bộ `chrome.storage.local` bằng các `firstWorkflows` mặc định và set `isFirstTime = false`.

* **Lesson**: Nếu tiêm workflow đúng lúc `isFirstTime` đang true, workflow của ta sẽ bị ghi đè xóa sạch.
* **Quy tắc**: Trong script tiêm qua `chrome.storage.local`, **phải** tạo vòng lặp poll kiểm tra `isFirstTime === false` (hoặc timeout) trước khi set giá trị mới.

## 5. Bẫy (Pitfall) của `evaluateOnNewDocument` trên trang có sẵn
Khi bạn mở một trang mới thông qua Chrome API (`chrome.windows.create`) và lấy được `popupPage` thông qua `browser.on('targetcreated')`, trang này **thường đã được tải xong (hoặc đang tải)**. Nếu bạn chỉ dùng `popupPage.evaluateOnNewDocument()` để tiêm script (ví dụ: `chrome.storage.onChanged`), script này sẽ **bị bỏ qua hoàn toàn ở lần tải đầu tiên** và chỉ chạy nếu người dùng F5 tải lại trang.

* **Quy tắc**: Để tiêm script bắt sự kiện vào một trang Extension an toàn và bao phủ mọi trường hợp, **PHẢI** kết hợp cả hai:
  1. `await page.evaluateOnNewDocument(script)`: Dành cho các lần điều hướng/F5 tiếp theo.
  2. `await page.evaluate(script)`: Dành cho trang hiện tại vừa được load.
  (Lưu ý: Cần thêm cờ `if (window.__injected) return;` trong script để tránh tiêm đúp).

## 6. Dependency Injection (Workflows & Packages)
Automa lưu trữ Workflows và Packages trong `chrome.storage.local` (keys: `workflows` và `savedBlocks`). Các node phức tạp như `execute-workflow` sẽ truy vấn database này lúc chạy (runtime). Nếu dùng CLI để ép chạy 1 workflow (qua `background--workflow:execute`) nhưng các dependency của nó (sub-workflow, package) không có sẵn trong extension storage, tiến trình sẽ báo lỗi.

* **Quy tắc**: Trước khi gọi lệnh Run hoặc mở Studio từ CLI, **PHẢI** luôn tiêm toàn bộ (hoặc các thành phần phụ thuộc) Workflows và Packages vào `chrome.storage.local` thông qua `page.evaluate()`. Đừng cho rằng CLI gửi trực tiếp JSON data của workflow chính là đủ; Extension luôn cần context xung quanh.

## 7. Storage Source of Truth (Two-Way Sync Architecture)
Dù Automa có một số đoạn code khởi tạo IndexedDB (ví dụ: `webService.js`), nhưng **Nguồn Dữ Liệu Gốc (Source of Truth)** của ứng dụng Extension (v1.30.00+) đối với Workflows và Packages vẫn là `browser.storage.local`.
* **Lesson**: Việc cố gắng ghi/đọc từ `indexedDB.open('automa')` để đồng bộ dữ liệu Core của Extension là sai lầm và dư thừa, vì đó chỉ là cầu nối phụ (bridge) cho Web Dashboard.
* **Quy tắc**: Để thực hiện tính năng Auto-Save hoặc Two-Way Sync (chụp sự thay đổi từ UI của người dùng đẩy ngược về Local File), **bắt buộc** phải sử dụng Observer lắng nghe sự kiện `chrome.storage.onChanged`. Bất kỳ hành động Save nào trên Automa Studio UI đều sẽ gọi `chrome.storage.local.set` và trigger sự kiện này.
