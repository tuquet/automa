# @automa/core-engine

**Core Engine** là trái tim thực thi (Execution Engine) của Automa Ecosystem, được thiết kế để hoàn toàn độc lập với môi trường chạy (Environment-agnostic). Dù Automa chạy trên trình duyệt (Chrome Extension), trên máy chủ ảo (Node.js/CLI), hay trong một ứng dụng Desktop (Electron), Core Engine vẫn đảm bảo tính nhất quán của logic điều khiển Workflow.

## 🎯 Tại sao lại cần Core Engine?

1. **Anti-bot Strategy (Chiến lược chống Bot):** 
   Nếu CLI tự gọi các lệnh điều khiển DOM (như `puppeteer` hay `playwright`) trực tiếp, nó sẽ rất dễ bị hệ thống chống bot phát hiện thông qua fingerprint. Bằng cách sử dụng **Adapter Pattern**, Core Engine chỉ đóng vai trò phân phối trạng thái. Việc tương tác vật lý với trình duyệt sẽ được ủy quyền lại cho các Extension đang chạy thật, giữ nguyên fingerprint tự nhiên của người dùng.
2. **Backward Compatibility (Tương thích ngược):**
   Có hơn 60+ khối xử lý (Block Handlers) đã được viết bằng JavaScript kế thừa từ phiên bản cũ. Thay vì phải đập đi xây lại, Core Engine cung cấp một lớp vỏ bọc (`BackwardCompatibilityFacade`) để giả lập lại `this` context cũ (như `this.activeTab`, `this._sendMessageToTab`). Các file JS cũ có thể import vào và chạy trực tiếp trên kiến trúc mới.
3. **Mô-đun hóa (Decoupling):**
   Tách biệt hoàn toàn máy trạng thái (State Machine - đếm vòng lặp, xử lý biến, kiểm soát lỗi) khỏi các API của Chrome/Trình duyệt.

## 📦 Kiến trúc

### 1. `IBrowserAdapter`
Mọi hành động tương tác với trình duyệt đều phải thông qua giao diện này. Core Engine sẽ KHÔNG BAO GIỜ gọi `chrome.*` hay `window.*`.
```typescript
export interface IBrowserAdapter {
	sendMessageToTab(tabId: number, message: any): Promise<any>;
	activeTab: any;
	executeScript(tabId: number, script: string, args?: any[]): Promise<any>;
    // ...
}
```

### 2. `WorkflowEngine`
Là một State Machine thuần Typescript. Quản lý các biến số (Variables), bộ đếm vòng lặp (Loop Counters) và truy xuất dữ liệu từ các khối (Blocks).

### 3. `BackwardCompatibilityFacade`
Lớp bọc (Wrapper) biến đổi con trỏ `this` của các Function cũ thành một đối tượng tương tác với `WorkflowEngine`.
```typescript
const facade = new BackwardCompatibilityFacade(engine);
const boundHandler = facade.bind(legacyJSBlockHandler);
await engine.runBlock(boundHandler, blockData);
```

## 🛠️ Hướng dẫn sử dụng (Ví dụ)

Ví dụ dưới đây mô phỏng cách khởi chạy một Workflow sử dụng Mock Adapter trong môi trường Node.js.

```typescript
import { WorkflowEngine, BackwardCompatibilityFacade, IBrowserAdapter } from "@automa/core-engine";

// 1. Khởi tạo một Adapter mô phỏng (Hoặc Adapter thật giao tiếp qua WebSockets/CLI)
const myAdapter: IBrowserAdapter = {
    activeTab: { id: 101, url: "https://example.com" },
    sendMessageToTab: async (tabId, msg) => {
        console.log(`Đang gửi tin tới Tab ${tabId}:`, msg);
        return { success: true };
    },
    executeScript: async (tabId, script) => true
};

// 2. Khởi tạo Engine
const engine = new WorkflowEngine({
    adapter: myAdapter,
    workflowData: { edges: [] } // Cấu hình JSON của Workflow
});

// 3. Sử dụng Facade để nạp Legacy Block (các Block cũ của Automa)
const facade = new BackwardCompatibilityFacade(engine);

// Giả sử đây là một block cũ không hề biết về TypeScript hay Engine mới
async function legacyDelayBlock(this: any, blockData: any) {
    console.log("Tab hiện tại:", this.activeTab.id);
    await this._sendMessageToTab(this.activeTab.id, { action: "DELAY" });
    this.setVariable("status", "done");
}

const runnableBlock = facade.bind(legacyDelayBlock);

// 4. Chạy Block
await engine.runBlock(runnableBlock, { delayTime: 1000 });
console.log("Biến cục bộ:", engine.getVariable("status")); // 'done'
```

## 🧪 Chạy Unit Test
```bash
pnpm install
pnpm run test
```
