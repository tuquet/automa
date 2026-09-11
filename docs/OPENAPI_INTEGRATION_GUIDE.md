# Automa Core OpenAPI — Integration & Implementation Guide
### Hướng Dẫn Tích Hợp & Triển Khai Dành Cho Nhà Phát Triển (Client / SDK Consumers)

> **Mục tiêu**: Cung cấp tài liệu hướng dẫn kỹ thuật chuẩn công nghiệp (Industry-Standard Developer Guide tương tự phong cách Stripe, Temporal, Supabase) giúp các lập trình viên Frontend (`automa-desk`, `automa-vsce`, `automa-webe`) hoặc dịch vụ thứ ba có thể dễ dàng hiểu, tích hợp và triển khai OpenAPI của **Automa Core** theo mô hình **Event-Driven Architecture (EDA)**.

---

## 📑 Mục Lục

1. [Tổng Quan Kiến Trúc & Triết Lý Contract-First](#1-tổng-quan-kiến-trúc--triết-lý-contract-first)
2. [Cài Đặt & Cấu Hình SDK Client (`@automa/types/api`)](#2-cài-đặt--cấu-hình-sdk-client-automatypesapi)
3. [Tam Giác Giao Thức (REST vs SSE vs WebSocket)](#3-tam-giác-giao-thức-rest-vs-sse-vs-websocket)
4. [Hướng Dẫn Triển Khai Theo Từng Nghiệp Vụ (Code Recipes)](#4-hướng-dẫn-triển-khai-theo-từng-nghiệp-vụ-code-recipes)
   - [4.1. Thực Thi Workflow & Nhận Log Real-Time](#41-thực-thi-workflow--nhận-log-real-time)
   - [4.2. Quản Lý Phiên Virtual Browser (Anti-Detect)](#42-quản-lý-phiên-virtual-browser-anti-detect)
   - [4.3. Chạy Chiến Dịch Song Song (Campaign Matrix)](#43-chạy-chiến-dịch-song-song-campaign-matrix)
   - [4.4. Quản Trị Dữ Liệu SQLite & Mã Hóa Bí Mật (AES-256)](#44-quản-trị-dữ-liệu-sqlite--mã-hóa-bí-mật-aes-256)
5. [Chuẩn Hóa Xử Lý Lỗi (Error Handling & `ApiErrorResponse`)](#5-chuẩn-hóa-xử-lý-lỗi-error-handling--apierrorresponse)
6. [Code Mẫu Chuẩn: Vue 3 / Pinia Event-Driven Composable](#6-code-mẫu-chuẩn-vue-3--pinia-event-driven-composable)
7. [Kiểm Thử & Tự Động Hóa Hợp Đồng (Contract Testing)](#7-kiểm-thử--tự-động-hóa-hợp-đồng-contract-testing)

---

## 1. 🎯 Tổng Quan Kiến Trúc & Triết Lý Contract-First

Automa Core vận hành dưới dạng một Daemon Rust hiệu năng cao (`http://127.0.0.1:8765`), đóng vai trò là Single Source of Truth cho toàn bộ logic điều phối tự động hóa, quản lý Chromium process và lưu trữ SQLite.

```text
+-------------------------------------------------------------------------------+
|                             CLIENT APPLICATIONS                               |
|   VS Code Extension (automa-vsce) | Desktop App (automa-desk) | Studio (Vue)  |
+---------------------------------------+---------------------------------------+
                                        |
       ┌────────────────────────────────┼────────────────────────────────┐
       │ (1) HTTP REST (RPC Actions)    │ (2) SSE Stream (Logs/Progress) │ (3) WebSocket (2-Way Control)
       ▼                                ▼                                ▼
┌──────────────┐                 ┌──────────────┐                 ┌──────────────┐
│  /api/v1/*   │                 │ /api/v1/events│                │  /api/v1/ws  │
└──────┬───────┘                 └──────┬───────┘                 └──────┬───────┘
       │                                │                                │
+------v--------------------------------v--------------------------------v------+
|                         AUTOMA CORE DAEMON (Port 8765)                         |
|  - SQLite Global Storage (Tables/Vars/Creds)  - Process Manager (Chromium)    |
|  - Headless Execution Dispatcher              - AES-256 PBKDF2 Vault          |
+-------------------------------------------------------------------------------+
```

### 4 Nguyên Tắc Cốt Lõi:
1. **Contract-First & Single Source of Truth**: Toàn bộ DTOs và Endpoints được định nghĩa bằng Rust (`utoipa`) và tự động xuất ra OpenAPI 3.1.0 spec (`openapi.json`). Client **tuyệt đối không viết `fetch` thủ công** mà luôn sử dụng SDK `@automa/types/api` được sinh tự động. Loại bỏ hoàn toàn các file markdown tĩnh sao chép API để tránh Documentation Drift.
2. **Hệ Sinh Thái 3 Tầng Khép Kín (The Unified API Trinity)**:
   - **Tier 1 (Code-to-Code / Compiler)**: SDK `@automa/types/api` cung cấp Type-Safety tuyệt đối, autocomplete và compile-time validation cho TypeScript.
   - **Tier 2 (Interactive Explorer / QA)**: **Scalar API Reference** (`pnpm run docs:api` tại `http://localhost:8767`) với giao diện hiện đại, tìm kiếm nhanh `Ctrl+K`, test trực tiếp và live reload.
   - **Tier 3 (Architecture & Blueprints)**: Tài liệu hướng dẫn này và các đặc tả 2D Matrix trong `docs/srs/`, tập trung vào tư duy kiến trúc, workflows và recipes thực tế.
3. **Zero-Dummy UI**: Mọi nút bấm (Run, Stop, Pause, Delete, Sideload) phải ánh xạ tới đúng `operation_id` trong OpenAPI spec và xử lý triệt để các trạng thái `Loading`, `Success`, `Error`.
4. **Event-Driven UI Reactions**: Client gửi lệnh bất đồng bộ $\rightarrow$ Nhận `200 OK (job_id)` ngay lập tức $\rightarrow$ Đăng ký lắng nghe kênh SSE/WS để cập nhật tiến trình hiển thị cho người dùng.

---

## 2. 📦 Cài Đặt & Cấu Hình SDK Client (`@automa/types/api`)

Mọi ứng dụng trong monorepo hoặc ứng dụng ngoài đều có thể nhập typed SDK trực tiếp từ package `@automa/types`:

### Cấu hình Base URL và Client Interceptors

```typescript
import { client } from '@automa/types/api';

// 1. Cấu hình địa chỉ daemon Automa Core
client.setConfig({
  baseUrl: 'http://127.0.0.1:8765',
});

// 2. (Tùy chọn) Bổ sung Interceptor để log telemetry hoặc đính kèm token xác thực
client.interceptors.request.use((request) => {
  request.headers.set('X-Client-App', 'Automa-Desktop-v1.0');
  return request;
});

client.interceptors.response.use((response) => {
  if (!response.ok) {
    console.error(`[API Error] ${response.status} from ${response.url}`);
  }
  return response;
});
```

---

## 3. 🔌 Tam Giác Giao Thức (REST vs SSE vs WebSocket)

Để quyết định sử dụng kênh nào khi triển khai một tính năng:

| Giao Thức | Endpoint | Hướng Giao Tiếp | Trường Hợp Sử Dụng (Use Cases) |
| :--- | :--- | :--- | :--- |
| **HTTP REST** | `/api/v1/...` | Request $\rightarrow$ Response (1-1) | CRUD dữ liệu, Lưu Workflow, Tạo Profile Browser, Đăng ký Job (`submit_job`), Check Health. |
| **SSE (Server-Sent Events)** | `/api/v1/events` | Server $\rightarrow$ Client (1 chiều) | Luồng log console (`task:log`), sự kiện tiến độ node (`JOB_PROGRESS`), cập nhật matrix slot. |
| **WebSocket** | `/api/v1/ws` | Client $\leftrightarrow$ Server (2 chiều) | Điều khiển độ trễ thấp: Tạm dừng (`PAUSE_JOB`), Tiếp tục (`RESUME_JOB`), Dừng khẩn cấp (`KILL_JOB`), gửi lệnh CDP trực tiếp. |

---

## 4. 🛠️ Hướng Dẫn Triển Khai Theo Từng Nghiệp Vụ (Code Recipes)

### 4.1. Thực Thi Workflow & Nhận Log Real-Time

#### Luồng nghiệp vụ:
1. Người dùng nhấn nút **Run Workflow** (`btn.workflow.run`).
2. Client gọi `submitJob` qua REST.
3. Server cấp phát `job_id` và bắt đầu điều phối browser worker.
4. Client mở kết nối SSE `/api/v1/events` để hứng log và render lên Output Panel.

```typescript
import { submitJob, killJob } from '@automa/types/api';

// Bước 1: Gửi lệnh thực thi workflow
export async function executeWorkflow(workflowPath: string, browserId?: string) {
  const { data, error } = await submitJob({
    body: {
      workflow_path: workflowPath,
      browser_id: browserId,
      options: {
        headless: false,
        debug: true,
      },
    },
  });

  if (error || !data?.job_id) {
    throw new Error(error?.message || 'Không thể khởi động workflow');
  }

  const jobId = data.job_id;
  console.log(`[Job Enqueued] ID: ${jobId}`);

  // Bước 2: Lắng nghe luồng Server-Sent Events để hiển thị log
  const eventSource = new EventSource('http://127.0.0.1:8765/api/v1/events');

  eventSource.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data);
      
      // Lọc log thuộc về đúng jobId hiện tại
      if (payload.jobId === jobId) {
        if (payload.type === 'task:log') {
          console.log(`[LOG - Step ${payload.step}]:`, payload.message);
        } else if (payload.type === 'task:completed') {
          console.log('✅ Workflow hoàn thành thành công!');
          eventSource.close();
        } else if (payload.type === 'task:error') {
          console.error('❌ Workflow gặp lỗi:', payload.error);
          eventSource.close();
        }
      }
    } catch (e) {
      console.error('Lỗi phân tích cú pháp SSE:', e);
    }
  };

  return {
    jobId,
    // Hàm hủy bỏ job bất kỳ lúc nào
    abort: async () => {
      await killJob({ path: { job_id: jobId } });
      eventSource.close();
    },
  };
}
```

---

### 4.2. Quản Lý Phiên Virtual Browser (Anti-Detect)

#### Luồng nghiệp vụ:
Khởi chạy một profile Chromium biệt lập đã được cấu hình proxy, user-agent và fingerprint riêng.

```typescript
import {
  getBrowsers,
  createBrowser,
  startBrowserSession,
  stopBrowserSession,
  getBrowserCookies,
} from '@automa/types/api';

// 1. Lấy danh sách Profile và trạng thái Online/Offline
export async function fetchBrowserList() {
  const { data, error } = await getBrowsers();
  if (error) throw error;
  return data; // Array<BrowserResponse>
}

// 2. Tạo một Browser Profile mới
export async function registerNewBrowserProfile(id: string, name: string, proxyUrl?: string) {
  const { error } = await createBrowser({
    body: {
      id,
      name,
      proxy: proxyUrl ? { server: proxyUrl } : undefined,
      fingerprint: {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...',
        timezone: 'Asia/Ho_Chi_Minh',
      },
    },
  });
  if (error) throw error;
}

// 3. Khởi chạy và Quản lý phiên
export async function toggleBrowserSession(browserId: string, isRunning: boolean) {
  if (!isRunning) {
    // Bật Browser
    await startBrowserSession({ path: { id: browserId } });
  } else {
    // Tắt Browser
    await stopBrowserSession({ path: { id: browserId } });
  }
}

// 4. Trích xuất Cookies từ Chromium SQLite Database
export async function exportCookies(browserId: string) {
  const { data, error } = await getBrowserCookies({ path: { id: browserId } });
  if (error) throw error;
  return data; // Array<Cookie>
}
```

---

### 4.3. Chạy Chiến Dịch Song Song (Campaign Matrix)

```typescript
import { executeCampaign, abortCampaign, getCampaignMatrixStatus } from '@automa/types/api';

export async function runMatrixFleet(campaignId: string) {
  // 1. Kích hoạt ma trận phân bổ browser
  const { data, error } = await executeCampaign({
    body: {
      campaign_id: campaignId,
      concurrency: 4, // 4 browser song song
      grid_layout: { rows: 2, cols: 2 },
    },
  });

  if (error) throw error;

  // 2. Thăm dò (Poll) trạng thái ma trận các slot
  const interval = setInterval(async () => {
    const status = await getCampaignMatrixStatus({ path: { id: campaignId } });
    if (status.data?.is_finished) {
      clearInterval(interval);
      console.log('Matrix Campaign Execution Finished.');
    }
  }, 1000);
}
```

---

### 4.4. Quản Trị Dữ Liệu SQLite & Mã Hóa Bí Mật (AES-256)

Automa Core lưu trữ bảng dữ liệu và biến cấu hình trong cơ sở dữ liệu SQLite cục bộ. Đối với thông tin nhạy cảm (API Keys, Passwords), client yêu cầu mã hóa trước khi lưu:

```typescript
import {
  getStorageTables,
  addStorageTable,
  addStorageTableRow,
  encryptSecret,
  addStorageCredential,
} from '@automa/types/api';

// 1. Tạo bảng dữ liệu người dùng
export async function createDataTable(tableName: string) {
  const { data, error } = await addStorageTable({
    body: {
      id: tableName.toLowerCase(),
      name: tableName,
      columns: [
        { name: 'email', type: 'string', required: true },
        { name: 'status', type: 'string', required: false },
      ],
    },
  });
  if (error) throw error;
  return data;
}

// 2. Lưu Credential bảo mật (Mã hóa AES-256 trong RAM)
export async function saveSecureCredential(key: string, secretValue: string, masterPass: string) {
  // Mã hóa thông qua core daemon
  const { data: encryptedData, error: encError } = await encryptSecret({
    body: {
      plaintext: secretValue,
      passphrase: masterPass,
    },
  });

  if (encError || !encryptedData) throw encError;

  // Lưu bản mã vào SQLite
  await addStorageCredential({
    body: {
      id: key,
      name: key,
      encryptedValue: encryptedData.ciphertext,
      iv: encryptedData.iv,
      salt: encryptedData.salt,
    },
  });
}
```

---

## 5. 🛡️ Chuẩn Hóa Xử Lý Lỗi (Error Handling & `ApiErrorResponse`)

Tất cả các API trả về mã lỗi HTTP tiêu chuẩn đi kèm cấu trúc `ApiErrorResponse` chuẩn hóa:

```json
{
  "code": "VALIDATION_FAILED",
  "message": "The specified workflow JSON file does not exist on disk.",
  "details": {
    "path": "workflows/missing.workflow.json",
    "timestamp": 1724665200000
  }
}
```

### Mã Lỗi Thường Gặp & Chiến Lược UI:

| HTTP Status | Error Code | Ý Nghĩa Nghiệp Vụ | Hành Động UI Đề Xuất |
| :--- | :--- | :--- | :--- |
| `400 Bad Request` | `VALIDATION_FAILED` | Tham số gửi lên sai định dạng hoặc thiếu trường bắt buộc. | Hiển thị thông báo lỗi inline dưới ô nhập liệu tương ứng. |
| `404 Not Found` | `RESOURCE_NOT_FOUND` | Không tìm thấy Profile, Workflow hoặc Bảng dữ liệu. | Hiển thị Toast thông báo và tự động tải lại danh sách. |
| `429 Too Many Requests` | `MAX_CONCURRENCY` | Số lượng job vượt quá giới hạn tài nguyên máy. | Chuyển nút bấm sang trạng thái Queue hoặc thông báo chờ. |
| `500 Internal Error` | `DATABASE_ERROR` | Lỗi đọc/ghi SQLite hoặc lỗi hệ thống OS. | Mở Modal thông báo chi tiết và đề xuất kiểm tra log file. |

---

## 6. 💻 Code Mẫu Chuẩn: Vue 3 / Pinia Event-Driven Composable

Dưới đây là một composable sản xuất mẫu (Production-Ready) thể hiện đầy đủ FSM, gọi OpenAPI và bắt sự kiện qua WebSocket / SSE:

```typescript
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { submitJob, killJob } from '@automa/types/api';
import type { ButtonExecutionState } from '@automa/types';

export const useWorkflowActionStore = defineStore('workflow-action', () => {
  const buttonState = ref<ButtonExecutionState>('IDLE');
  const activeJobId = ref<string | null>(null);
  const executionLogs = ref<string[]>([]);
  const lastError = ref<string | null>(null);

  const isBusy = computed(() => buttonState.value === 'VALIDATING' || buttonState.value === 'DISPATCHING');
  const isRunning = computed(() => buttonState.value === 'EXECUTING');

  // Trigger hành động từ nút bấm
  async function triggerRunOrStop(workflowPath: string, browserId?: string) {
    // Nếu đang chạy -> Nhấn nút sẽ đóng vai trò STOP
    if (isRunning.value && activeJobId.value) {
      buttonState.value = 'TERMINATING';
      try {
        await killJob({ path: { job_id: activeJobId.value } });
      } catch (err: any) {
        lastError.value = err?.message || 'Không thể dừng tiến trình';
      }
      return;
    }

    if (buttonState.value !== 'IDLE') return;

    // Pha 1: Validation
    buttonState.value = 'VALIDATING';
    lastError.value = null;
    executionLogs.value = [];

    if (!workflowPath) {
      lastError.value = 'Đường dẫn workflow không hợp lệ';
      buttonState.value = 'IDLE';
      return;
    }

    // Pha 2: Gửi lệnh Dispatch tới OpenAPI
    buttonState.value = 'DISPATCHING';
    const { data, error } = await submitJob({
      body: {
        workflow_path: workflowPath,
        browser_id: browserId,
      },
    });

    if (error || !data?.job_id) {
      buttonState.value = 'FAILED';
      lastError.value = error?.message || 'Gặp lỗi khi tạo phiên làm việc';
      setTimeout(() => { buttonState.value = 'IDLE'; }, 3000);
      return;
    }

    // Pha 3: Chuyển sang trạng thái Executing và lắng nghe sự kiện
    activeJobId.value = data.job_id;
    buttonState.value = 'EXECUTING';
  }

  // Hook cập nhật từ Socket hoặc SSE
  function onTelemetryEvent(event: { type: string; jobId: string; message?: string; status?: string }) {
    if (event.jobId !== activeJobId.value) return;

    if (event.type === 'task:log' && event.message) {
      executionLogs.value.push(event.message);
    } else if (event.type === 'task:completed' || event.status === 'completed') {
      buttonState.value = 'COMPLETED';
      setTimeout(() => {
        buttonState.value = 'IDLE';
        activeJobId.value = null;
      }, 1500);
    } else if (event.type === 'task:error' || event.status === 'failed') {
      buttonState.value = 'FAILED';
      lastError.value = event.message || 'Tiến trình thất bại';
      setTimeout(() => {
        buttonState.value = 'IDLE';
        activeJobId.value = null;
      }, 2500);
    }
  }

  return {
    buttonState,
    activeJobId,
    executionLogs,
    lastError,
    isBusy,
    isRunning,
    triggerRunOrStop,
    onTelemetryEvent,
  };
});
```

---

## 7. 🧪 Kiểm Thử & Tự Động Hóa Hợp Đồng (Contract Testing)

Để kiểm chứng việc tích hợp OpenAPI không bị sai lệch kiểu dữ liệu hoặc hỏng hợp đồng khi backend thay đổi:

### Lệnh kiểm tra trong Monorepo:
1. **Kiểm tra Schema hợp lệ 100%**:
   ```bash
   pnpm run lint:schema
   ```
2. **Chạy Unit Test giao diện & Mock IPC**:
   ```bash
   pnpm -F vscode-automa test
   pnpm -F @automa/desk test:unit
   ```
3. **Đồng bộ hóa lại SDK khi Backend Rust thay đổi**:
   ```bash
   pnpm run sync:api
   ```
