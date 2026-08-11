---
name: automa-core-engine
description: Kiến trúc và nguyên lý hoạt động của Automa Core Engine (packages/core-engine). Trigger khi làm việc với WorkflowEngine, Block Execution, Backward Compatibility Facade, hoặc các Browser Adapters.
---

# Automa Core Engine Architecture

## 1. Mục Đích & Vị Trí Trong Hệ Sinh Thái
`@tuquet/automa-core` (nằm tại `packages/core-engine`) là trái tim thực thi (Execution Engine) của toàn bộ hệ sinh thái Automa. Nó được tách ra khỏi Extension để trở thành một thư viện TypeScript độc lập, không gắn với bất kỳ môi trường cụ thể nào (Environment-Agnostic).
- **Mục tiêu**: Có thể chạy được trên Node.js (Daemon/CLI), Web Worker, hoặc VS Code Webview mà không bị lỗi thiếu các API như `chrome.*`, `window.*`.
- **Nhiệm vụ chính**: Quản lý State Machine của workflow, xử lý các biến (Variables), vòng lặp (Loops), điều kiện rẽ nhánh (Conditions), và quản lý dữ liệu bảng (Table Data).

## 2. Chiến Lược Chống Bot-Detection (Browser Fingerprinting)
Đây là chiến lược tối quan trọng của Automa Ecosystem:
- **Nguyên tắc KHÔNG Thao Tác DOM Trực Tiếp**: Core Engine tuyệt đối không tự mình khởi tạo Puppeteer/Playwright hay dùng raw CDP để thực thi các block tương tác DOM (như `click`, `forms`, `new-tab`). Hành vi này sẽ phá vỡ Fingerprint nguyên thủy của trình duyệt và dễ dàng bị Bot Detection (Cloudflare, reCAPTCHA) chặn.
- **Giải pháp Adapter Pattern**: Khi Core Engine cần tương tác với DOM, nó đóng gói lệnh lại và gửi qua một Adapter (`IBrowserAdapter`). 
- Trong môi trường thực tế, Adapter này sẽ "bắn" thông điệp (via WebSockets / SSE / Native Messaging) về lại cho **Trình duyệt / Extension**, để Extension dùng content scripts thực thi. Nhờ vậy, Fingerprint hoàn toàn là của người dùng thật.

## 3. Backward Compatibility Facade (Thích Ứng Ngược)
Hệ sinh thái đang có 60+ Legacy JS Blocks (như `handlerConditions.js`, `handlerInsertData.js`) ở `automa-ext`. Việc viết lại tất cả bằng TypeScript cho Core Engine là bất khả thi và lãng phí thời gian.
- **BlockExecutionContextFacade**: Để giải quyết vấn đề này, Core Engine sử dụng một Context Facade Pattern. Facade này sẽ wrap toàn bộ Core Engine State và Adapter, sau đó "đóng giả" thành object `this` mà các block cũ mong đợi.
- Các hàm/thuộc tính cũ được giả lập hoàn hảo: `this.activeTab`, `this.engine`, `this.getBlockConnections`, `this._sendMessageToTab`, `this.addDataToColumn`, `this.setVariable`, v.v.
- Nhờ vậy, ta có thể `import` trực tiếp các file handler cũ từ `automa-ext` vào `core-engine` và chạy trực tiếp mà KHÔNG CẦN CHỈNH SỬA source code của chúng.

## 4. Cấu Trúc Của IBrowserAdapter
`IBrowserAdapter` là cầu nối bắt buộc khi khởi tạo `WorkflowEngine`. Nó định nghĩa các hàm:
```typescript
export interface IBrowserAdapter {
  getActiveTab(): Promise<TabInfo | null>;
  sendMessageToTab(tabId: number, message: TabMessagePayload, options?: TabMessageOptions): Promise<any>;
  createTab(options: { url: string; active?: boolean; [key: string]: any }): Promise<TabInfo>;
  updateTab(tabId: number, options: Record<string, any>): Promise<TabInfo>;
  removeTab(tabId: number): Promise<void>;
  injectContentScript?(tabId: number, frameId?: number): Promise<boolean>;
}
```

## 5. Pattern Hướng Dẫn Phát Triển (TDD & Mocks)
- **Mocks**: Khi làm việc với `core-engine` trong Node.js, hãy sử dụng `MockBrowserAdapter` để verify Logic chạy đúng mà không cần bật trình duyệt.
- **PuppeteerBrowserAdapter**: Dành riêng cho E2E Integration Testing (ví dụ `tests/test_google_search.ts`). Nó implement `IBrowserAdapter` bằng Puppeteer để chứng minh Facade có thể lái một trình duyệt thực thụ. KHÔNG dùng PuppeteerBrowserAdapter cho môi trường Production (CLI).
