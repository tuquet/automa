---
name: automa-cli
description: "Index directory for Automa CLI (automa-cli) skills and execution protocols. Refer to sub-skills for specific CLI tasks."
---

# Automa CLI (`automa-cli`) - Skills Index & Core Protocols

Thư mục này tổng hợp toàn bộ các quy trình, kiến trúc và kỹ thuật liên quan đến công cụ **Automa CLI** (`automa-cli`). 

Depending on your specific task, navigate to the corresponding sub-skill below:

## Available Sub-Skills

- 💻 **[Automa CLI Run (automa-cli-run)](./automa-cli-run/SKILL.md)**
  - **Mục đích:** Quy trình xác minh phụ thuộc local (Supabase, Extension build) và chạy lệnh CLI để thực thi workflow.

- 🛠️ **[Automa CLI Studio (automa-cli-studio)](./automa-cli-studio/SKILL.md)**
  - **Mục đích:** Quy trình tiêm (inject) và mở một file workflow local dưới dạng giao diện Studio kéo thả bằng Puppeteer.

- 🔍 **[Automa CLI Lint (automa-cli-lint)](./automa-cli-lint/SKILL.md)**
  - **Mục đích:** Đặc tả kỹ thuật cho tính năng `automa lint` (kiểm tra cấu trúc JSON Schema, NanoID, và Semantic Variables).

- 🌐 **[Automa CLI Browser Launcher (automa-cli-browser-launcher)](./automa-cli-browser-launcher/SKILL.md)**
  - **Mục đích:** Pattern chuẩn OOP để khởi chạy Chromium qua CDP (`execFile`) không phụ thuộc vào `puppeteer.launch()`.

---

## ⚡ Core Protocol: Automa Extension UI Bypass (MV3 Popup Window)

> [!IMPORTANT]
> **Quy tắc bắt buộc khi mở Extension Pages (Studio/Dashboard) từ CLI qua Puppeteer:**

1. **Không dùng `page.goto(chrome-extension://...)` từ tab thường**: `App.vue` của Automa sẽ chủ động tự đóng tab (`browser.tabs.remove`) nếu `currentWindow.type !== 'popup'`.
2. **Không dùng URL Query Bypasses (như `?bypass=1`)**: Cách này sẽ làm sập quá trình khởi tạo Vue Store (gây ra lỗi `TypeError: Cannot read properties of undefined` trên `tabs[0]`), bỏ qua luồng load dữ liệu database.
3. **Giải pháp chuẩn:** Luôn tiêm đoạn script vào Background Service Worker của Extension để tạo một cửa sổ dạng `popup` native bằng `chrome.windows.create`:

```typescript
const extWorker = (await extTarget.worker()) || (await extTarget.page());
await extWorker.evaluate(async (url) => {
  await chrome.windows.create({ url, type: 'popup', width: 1280, height: 800 });
}, studioUrl);
```
