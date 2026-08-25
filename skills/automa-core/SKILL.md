---
name: automa-core
description: Kiến trúc và nguyên lý hoạt động của Automa Core Engine (automa-core / @automa/core). Kích hoạt khi làm việc với WorkflowEngine, Block Execution, Backward Compatibility Facade, hoặc các Browser Adapters.
---

# Kiến Trúc Automa Core Engine (`automa-core`)


## 1. Mục Đích & Vị Trí Trong Hệ Sinh Thái
`@automa/core` (`packages/core`) BẮT BUỘC HOẠT ĐỘNG như Execution Engine cốt lõi của hệ sinh thái Automa. BẮT BUỘC DUY TRÌ dưới dạng một thư viện TypeScript độc lập, không phụ thuộc vào môi trường (Environment-Agnostic).
- **Mục Tiêu:** BẮT BUỘC CHẠY trên Node.js (như một Daemon service riêng biệt) theo kiến trúc Thin Client & Daemon hiện đại. TUYỆT ĐỐI KHÔNG chạy Engine trực tiếp bên trong UI (như VS Code Webview hay Webpack client) để đảm bảo hiệu suất và bảo mật. Các Client BẮT BUỘC GỌI API tới Daemon thay vì chạy logic thực thi.
- **Nhiệm Vụ Chính:** BẮT BUỘC QUẢN LÝ toàn bộ Workflow State Machine, Variables, Loops, Conditions, và Table Data.

## 2. Chiến Lược Chống Phát Hiện Bot (Browser Fingerprinting)
BẮT BUỘC THỰC THI nghiêm ngặt chiến lược chống bot sau:
- **Nguyên Tắc KHÔNG Thao Tác DOM Trực Tiếp:** TUYỆT ĐỐI KHÔNG THAO TÁC DOM trực tiếp từ Core Engine. TUYỆT ĐỐI KHÔNG KHỞI TẠO Puppeteer, Playwright hoặc giao thức CDP thô cho các tương tác DOM (`click`, `forms`, `new-tab`) bên trong Core Engine nhằm tránh làm hỏng native browser fingerprinting.
- **Giải Pháp Adapter Pattern:** BẮT BUỘC ĐÓNG GÓI tất cả các lệnh tương tác DOM thông qua `IBrowserAdapter`.
- BẮT BUỘC GỬI các lệnh (thông qua WebSockets / SSE / Native Messaging) tới **Trình duyệt / Extension**. Các content scripts của Extension BẮT BUỘC THỰC THI các lệnh đó để bảo toàn trọn vẹn fingerprint thực của người dùng.

## 3. Backward Compatibility Facade (Thích Ứng Ngược)
BẮT BUỘC DUY TRÌ tính tương thích với hơn 60 Legacy JS Blocks (ví dụ: `handlerConditions.js`) trong `packages/workflow-runner` và `automa-ext` mà TUYỆT ĐỐI KHÔNG phải viết lại chúng bằng TypeScript.
- **BlockExecutionContextFacade:** PHẢI DÙNG Context Facade Pattern để bọc Core Engine State và Adapter. BẮT BUỘC MOCK đối tượng `this` được kỳ vọng bởi các legacy blocks.
- BẮT BUỘC GIẢ LẬP các thuộc tính và hàm legacy: `this.activeTab`, `this.engine`, `this.getBlockConnections`, `this._sendMessageToTab`, `this.addDataToColumn`, `this.setVariable`, v.v.
- BẮT BUỘC IMPORT và CHẠY các legacy handlers từ `automa-ext` trực tiếp và TUYỆT ĐỐI KHÔNG SỬA ĐỔI mã nguồn gốc của chúng.

## 4. Cấu Trúc Của IBrowserAdapter
BẮT BUỘC TRIỂN KHAI `IBrowserAdapter` khi khởi tạo `WorkflowEngine`:
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
- **Mocks:** PHẢI DÙNG `MockBrowserAdapter` để xác minh logic trong Node.js mà không cần sự hiện diện của trình duyệt.
- **PuppeteerBrowserAdapter:** CHỈ ĐƯỢC PHÉP SỬ DỤNG cho việc E2E Integration Testing (ví dụ: `tests/test_google_search.ts`). TUYỆT ĐỐI KHÔNG DÙNG `PuppeteerBrowserAdapter` trong Production (CLI hoặc Daemon).

## 6. Phân Định Trách Nhiệm (Separation of Concerns)
- **Extension / CLI Runner (`automa-ext`)**: Đảm nhiệm TOÀN BỘ việc thực thi các block thao tác DOM và tương tác trình duyệt (click, input, scroll, cookie browser, CDP, screenshot, evaluation) bên trong context của trình duyệt nhằm bảo toàn tính tự nhiên và chống phát hiện bot.
- **Rust Core Daemon (`automa-core`)**: Đóng vai trò là máy chủ điều phối hệ thống (Process Manager, SQLite DB, Anti-detect Profile Manager, REST/SSE API, Storage Tables, Job Scheduler). **TUYỆT ĐỐI KHÔNG** nhúng logic thao tác DOM trình duyệt vào Rust Backend.
