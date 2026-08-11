---
name: automa-ext
description: Kiến trúc và các Feature đã hoàn thiện của Automa Extension (automa-ext / automa-ex). Trigger khi làm việc với UI, Auth, Sync, hoặc Teamwork của automa-ext.
---

# Automa Extension (`automa-ext`) - System Requirements Specification (SRS) & Feature List

> **Repository**: [`tuquet/automa-ext`](https://github.com/tuquet/automa-ext) (forked from `AutomaApp/automa`)
> **Browser API**: Native `chrome.*` / `browser.*` via `src/lib/browser-compat.js` (no `webextension-polyfill`)
> **Manifest**: MV3 (Chrome), MV2 (Firefox)

Tài liệu này đóng vai trò là danh sách các tính năng (Feature List) và kiến trúc cốt lõi đã được xây dựng hoàn thiện bên trong `automa-ext` (còn gọi là `automa-ex`). Khi thao tác với `automa-ext`, hãy luôn tham chiếu tài liệu này để tận dụng các hệ thống có sẵn, tránh xây dựng trùng lặp.

## Sub-Skills thuộc `automa-ext`:
- 💉 **[Automa Extension Injection](./automa-extension-injection/SKILL.md)**: Kiến trúc Vòng đời Chromium Extension & Các nguyên tắc tương tác an toàn qua Puppeteer (tiêm workflow, storage observer, Service Worker wake-up).


---

## 1. Authentication System (Cơ chế Đăng nhập & Định danh)
- **Cơ chế: Silent Authentication Extraction**
- **File xử lý cốt lõi:** `src/content/services/webService.js`
- **Luồng hoạt động:** 
  - Người dùng đăng nhập tập trung tại Web Dashboard của hệ sinh thái (URL riêng biệt bên ngoài).
  - Content script `webService.js` luôn lắng nghe sự kiện `app-mounted` trên Web Dashboard.
  - Ngay khi phát hiện key `supabase.auth.token` trong `localStorage` của Web, extension sẽ tự động trích xuất Token này.
  - Token được lưu vào `browser.storage.local` dưới dạng object `session`.
  - Toàn bộ các API request tiếp theo từ Extension lên Supabase đều sử dụng session này.
- **Tình trạng:** Hoàn thiện 100%. Không cần thiết kế UI form login bên trong Extension.

## 2. Teamwork & User Interface (Giao diện Nhóm làm việc)
- **Cơ chế: Vue Pinia Stores & Reactive UI**
- **File xử lý cốt lõi:** `src/newtab/App.vue`, `src/components/newtab/app/AppSidebar.vue`, `src/stores/user.js`, `src/stores/teamWorkflow.js`
- **Luồng hoạt động:**
  - Nếu đã tồn tại Auth Session, `userStore` sẽ tự động load thông tin User Profile và hiển thị Avatar trên AppSidebar.
  - Dashboard UI (`newtab`) tự động phân loại, lọc danh sách workflows và hiển thị giao diện theo đúng `teamId` dựa trên dữ liệu từ `teamWorkflowStore`.
- **Tình trạng:** Hoàn thiện 100%. Giao diện đã tương thích hoàn toàn với luồng Teamwork.

## 3. Data Synchronization (Đồng bộ hóa Offline-First)
- **Cơ chế: Last-Writer-Wins (LWW) Sync Engine**
- **File xử lý cốt lõi:** `business/dev/cloud/SyncPull.js`, `business/dev/cloud/SyncPush.js`
- **Luồng hoạt động:**
  - **Pull:** Lấy Workflows, Folders, Variables, Packages từ Supabase về lưu vào IndexedDB cục bộ của người dùng dựa vào `client_updated_at`.
  - **Push:** Khi người dùng thay đổi dữ liệu nội bộ, Extension đẩy các record lên Supabase.
- **Tình trạng:** Hoàn thiện 100%. Cơ sở hạ tầng Cloud Sync đã sẵn sàng.

## 4. Workflow Execution Engine (Trình thực thi quy trình)
- **Cơ chế: Direct Background Messaging (Pump Mode)**
- **Luồng hoạt động tự động hóa (CLI):**
  - Tool CLI bên ngoài không cần fetch Workflow từ Cloud.
  - CLI sẽ đọc file JSON cục bộ, mở Extension ẩn (headless Chrome).
  - CLI đẩy thẳng Payload JSON của Workflow thông qua `chrome.runtime.sendMessage('background--workflow:execute', data)`.
  - Extension nhận lệnh và thực thi tuần tự các node trong workflow JSON được bơm vào.
- **Tình trạng:** Hoàn thiện 100%. Luồng trigger nội bộ và từ xa đã chạy ổn định.

## 5. Extension Entry Points (Kiến trúc các file HTML)
Mọi UI và môi trường thực thi của Extension được phân mảnh rất tinh xảo qua 6 file HTML (Entry Points):
- **`newtab/index.html` (Main Dashboard):** Giao diện lớn nhất (chứa App.vue), nơi người dùng thiết kế workflow, quản lý logs, packages. Load qua tab mới.
- **`popup/index.html` (Quick Popup):** UI nhỏ xíu hiện ra khi bấm vào icon Extension trên toolbar. Dùng để chạy nhanh workflow hoặc xem trạng thái.
- **`execute/index.html` (Shortcut Trigger):** Một trang không có UI (đóng ngay sau khi mở). Nhiệm vụ của nó là đọc URL (ví dụ: `chrome-extension://[id]/execute.html#/123?var=abc`), trích xuất parameters, gọi background worker chạy workflow `123` rồi tự hủy. Cực kỳ hữu dụng cho local scripts/shortcuts.
- **`sandbox/index.html` (Isolated Sandbox):** Một iframe vô hình (`display: none`) nhúng trong `newtab`. Đóng vai trò làm "phòng cách ly" để thực thi mã Javascript, Condition hoặc Expression do người dùng viết. Dùng `window.postMessage` giao tiếp, đảm bảo mã độc không thể chạm vào API của Chrome Extension.
- **`params/index.html` (Parameters Dialog):** Một cửa sổ Vue siêu nhỏ gọn để yêu cầu người dùng nhập các Biến (Variables) bị thiếu trước khi bắt đầu chạy một Workflow.
- **`offscreen/index.html` (DOM/Audio Proxy):** Tài liệu ẩn dành riêng cho Manifest V3. Vì Background Service Worker bị cấm truy cập DOM và Clipboard, trang này cung cấp "cửa sau" để Background mượn DOM xử lý các tác vụ đó.

## 6. CDP Debugger Flow (Worker Node Level)
- **Cơ chế: Chrome DevTools Protocol (CDP) via Background SW**
- **Luồng hoạt động:**
  - **Chế độ `debugMode`**: Mỗi block (node worker) trong Workflow (ví dụ: `Forms`, `Click`, `Press Key`) đều hỗ trợ tham số `debugMode`.
  - **Attach Debugger**: Khi Workflow Engine tương tác với một Tab (`handlerActiveTab`, `handlerNewTab`, `handlerInteractionBlock`), nó gọi hàm `attachDebugger(tabId)` (từ `src/workflowEngine/helper.js`) để gắn `chrome.debugger` vào tab đích (protocol `1.3`).
  - **Message Delegation**: Nếu `block.debugMode === true`, thay vì dùng JS thuần (`element.click()`), Content Script sẽ gửi thông điệp `sendMessage('debugger:send-command', payload, 'background')` hoặc `debugger:type`.
  - **Background Execution**: Background Service Worker (`src/background/index.js`) nhận thông điệp và trực tiếp gọi `chrome.debugger.sendCommand({ tabId }, method, params)` để giả lập tương tác phần cứng thật như `Input.dispatchMouseEvent` hoặc `Input.dispatchKeyEvent`.
- **Tác dụng**: Giúp các node worker vượt qua mọi rào cản của trình duyệt (ví dụ: Trusted Events, CSP khắt khe) để tự động hóa một cách "xịn" nhất ở cấp độ DevTools Protocol.
