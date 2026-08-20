---
name: automa-ext
description: Kiến trúc và các tính năng đã hoàn thiện của Automa Extension (automa-ext / automa-ex). Kích hoạt khi làm việc với UI, Auth, Sync, hoặc Teamwork của automa-ext.
---

# Automa Extension (`automa-ext`) - System Requirements Specification (SRS) & Feature List

> **Repository**: [`tuquet/automa-ext`](https://github.com/tuquet/automa-ext) (forked from `AutomaApp/automa`)
> **Browser API**: Native `chrome.*` / `browser.*` thông qua `src/lib/browser-compat.js` (không sử dụng `webextension-polyfill`)
> **Manifest**: MV3 (Chrome), MV2 (Firefox)

**BẮT BUỘC** tham khảo tài liệu này khi làm việc với `automa-ext` (`automa-ex`) để tận dụng hệ thống có sẵn, **TUYỆT ĐỐI KHÔNG** triển khai trùng lặp.

## Sub-Skills thuộc `automa-ext`:
- 💉 **[Automa Extension Injection](./automa-extension-injection/SKILL.md)**: Kiến trúc Vòng đời Chromium Extension & Các nguyên tắc tương tác an toàn qua Puppeteer.

---

## 1. Authentication System (Cơ chế Đăng nhập & Định danh)
- **Cơ chế:** Silent Authentication Extraction
- **File xử lý cốt lõi:** `src/content/services/webService.js`
- **Luồng hoạt động:** 
  - **BẮT BUỘC** xác thực người dùng tập trung qua Web Dashboard bên ngoài.
  - Content script `webService.js` **BẮT BUỘC** lắng nghe sự kiện `app-mounted` trên Web Dashboard.
  - **BẮT BUỘC** trích xuất `supabase.auth.token` từ `localStorage` của Web ngay khi phát hiện.
  - **BẮT BUỘC** lưu trữ Token trong `browser.storage.local` dưới dạng đối tượng `session`.
  - **BẮT BUỘC** sử dụng session này cho tất cả các yêu cầu Supabase API tiếp theo từ Extension.
- **Tình trạng:** Hoàn thiện 100%. **TUYỆT ĐỐI KHÔNG** thiết kế UI form đăng nhập bên trong Extension.

## 2. Teamwork & User Interface (Giao diện Nhóm làm việc)
- **Cơ chế:** Vue Pinia Stores & Reactive UI
- **File xử lý cốt lõi:** `src/newtab/App.vue`, `src/components/newtab/app/AppSidebar.vue`, `src/stores/user.js`, `src/stores/teamWorkflow.js`
- **Luồng hoạt động:**
  - `userStore` **BẮT BUỘC** tải User Browser và hiển thị Avatar trên AppSidebar nếu Auth Session tồn tại.
  - Dashboard UI (`newtab`) **BẮT BUỘC** phân loại, lọc và render workflows theo `teamId` thông qua `teamWorkflowStore`.
- **Tình trạng:** Hoàn thiện 100%. UI **BẮT BUỘC** duy trì tính tương thích hoàn toàn với luồng Teamwork.



## 3. Workflow Execution Engine (Trình thực thi quy trình)
- **Cơ chế:** Direct Background Messaging (Pump Mode)
- **Luồng hoạt động tự động hóa (CLI):**
  - CLI bên ngoài **TUYỆT ĐỐI KHÔNG** fetch Workflow từ Cloud.
  - CLI **BẮT BUỘC** đọc tệp JSON cục bộ và mở Extension ẩn (headless Chrome).
  - CLI **BẮT BUỘC** push trực tiếp Workflow JSON Payload thông qua `chrome.runtime.sendMessage('background--workflow:execute', data)`.
  - Extension **BẮT BUỘC** nhận lệnh và thực thi tuần tự các workflow nodes được tiêm.
- **Tình trạng:** Hoàn thiện 100%. Các trigger nội bộ và từ xa đã ổn định.

## 4. Extension Entry Points (Kiến trúc các file HTML)
**BẮT BUỘC** sử dụng 6 HTML Entry Points biệt lập sau đây đúng mục đích:
- **`newtab/index.html` (Main Dashboard):** **BẮT BUỘC** sử dụng để thiết kế workflow, quản lý log, packages.
- **`popup/index.html` (Quick Popup):** **BẮT BUỘC** sử dụng cho popup biểu tượng extension trên toolbar để chạy nhanh workflows.
- **`execute/index.html` (Shortcut Trigger):** **BẮT BUỘC** sử dụng cho URL triggers không có UI. **BẮT BUỘC** trích xuất tham số, gọi background worker, và tự huỷ.
- **`sandbox/index.html` (Isolated Sandbox):** **BẮT BUỘC** sử dụng làm iframe vô hình trong `newtab` để thực thi Javascript, Conditions do người dùng định nghĩa, dùng `window.postMessage` giao tiếp.
- **`params/index.html` (Parameters Dialog):** **BẮT BUỘC** sử dụng làm Vue dialog để yêu cầu Variables còn thiếu.
- **`offscreen/index.html` (DOM/Audio Proxy):** **BẮT BUỘC** sử dụng làm DOM processing proxy chạy nền cho Manifest V3.

## 5. CDP Debugger Flow (Worker Node Level)
- **Cơ chế:** Chrome DevTools Protocol (CDP) thông qua Background SW
- **Luồng hoạt động:**
  - **Chế độ `debugMode`**: Các khối tương tác **BẮT BUỘC** hỗ trợ tham số `debugMode`.
  - **Attach Debugger**: **BẮT BUỘC** gọi `attachDebugger(tabId)` khi tương tác với Target Tab, đính kèm `chrome.debugger` (protocol `1.3`).
  - **Message Delegation**: Nếu `block.debugMode === true`, Content Script **TUYỆT ĐỐI KHÔNG** sử dụng native JS (`element.click()`). **BẮT BUỘC** gửi `sendMessage('debugger:send-command', payload, 'background')`.
  - **Background Execution**: Service Worker **BẮT BUỘC** thực thi `chrome.debugger.sendCommand` để giả lập tương tác phần cứng.
- **Tác dụng**: **BẮT BUỘC** sử dụng để vượt qua CSP hoặc Trusted Events nghiêm ngặt.
