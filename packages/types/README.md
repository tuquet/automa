# @automa/types

> **Canonical Type System & Typed OpenAPI SDK for the Automa Ecosystem**

`@automa/types` là package trung tâm cung cấp toàn bộ định nghĩa kiểu dữ liệu (TypeScript Definitions), giao ước máy trạng thái (FSM Contracts), và TypeScript SDK client được sinh tự động (Code-Generated) từ OpenAPI specification của Automa Core.

---

## 📦 Các Phân Hệ Export (Package Exports)

Package cung cấp các subpath exports riêng biệt, tối ưu hóa cho Tree-Shaking:

| Subpath | Mục Đích | Nguồn Gốc |
| :--- | :--- | :--- |
| `@automa/types` | Domain Contracts: Button FSM, Select Dropdowns, Pinia Stores | `src/button.ts`, `src/select.ts`, `src/store.ts` |
| `@automa/types/api` | **Typed OpenAPI SDK Client & DTO Schemas** | Sinh tự động qua `@hey-api/openapi-ts` từ `openapi.json` |
| `@automa/types/ws` | WebSocket Live Control Payloads (Pause, Resume, Kill, Breakpoint) | `src/ws.ts` |
| `@automa/types/ipc` | Inter-Process Communication contracts (VSCE $\leftrightarrow$ Webview) | `src/ipc.ts` |
| `@automa/types/workflow` | Workflow Graph, Blocks, Connections, Variables | `src/workflow.ts` |
| `@automa/types/campaign` | Campaign Matrix, Tasks, Scheduling | `src/campaign.ts` |
| `@automa/types/browser` | Anti-detect Virtual Browser configurations | `src/browser.ts` |
| `@automa/types/job` | Runtime Execution Job State & Logs | `src/job.ts` |

---

## 🚀 Hướng Dẫn Sử Dụng

### 1. Gọi API Backend thông qua Typed SDK (`@automa/types/api`)

Nghiêm cấm dùng `fetch()` thô hoặc URL hardcode. Luôn sử dụng Typed SDK:

```typescript
import { client, getBrowsers, createBrowser, executeCampaign } from '@automa/types/api';

// Cấu hình Base URL và Passphrase nếu cần
client.setConfig({
  baseUrl: 'http://127.0.0.1:8765',
});

// Gọi API với đầy đủ TypeScript Intellisense
const { data, error } = await getBrowsers({
  query: {
    limit: 20,
    offset: 0,
    search: 'Chrome-AntiDetect',
  },
});

if (error) {
  console.error('API Error:', error.message);
} else {
  console.log('Browsers:', data);
}
```

### 2. Sử dụng Button & Select Contracts

```typescript
import type { AutomaButtonId, ButtonFsmState } from '@automa/types';
import type { AutomaSelectId } from '@automa/types';

const saveBtnId: AutomaButtonId = 'btn.workflow.save';
const browserSelectId: AutomaSelectId = 'select.campaign.browser';
```

### 3. Lắng nghe WebSocket Control Messages (`@automa/types/ws`)

```typescript
import type { WsClientMessage, WsServerEvent } from '@automa/types/ws';

const pauseCommand: WsClientMessage = {
  type: 'PAUSE_JOB',
  jobId: 'job-1234',
};
```

---

## 🔄 Quy Trình Tự Động Sinh Mã (Code Generation Pipeline)

Package này không được sửa tay các file trong `src/api/`. Mọi thay đổi về DTO và Endpoints phải được đồng bộ từ Backend Rust:

```bash
# Đồng bộ toàn diện từ monorepo root:
pnpm run sync:api

# Hoặc sinh mã cục bộ trong package:
pnpm run generate:api
pnpm run build
```
