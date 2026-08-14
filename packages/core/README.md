# @automa/core

**Core** là thư viện hạt nhân (Core Library) chứa toàn bộ đặc tả Cấu trúc dữ liệu (Database Schemas) và các lớp Repository được chia sẻ (Shared Repositories) cho hệ sinh thái Automa.

Thay vì để `automa-cli` và `automa-hub` tự định nghĩa các bảng cơ sở dữ liệu lặp lại hoặc có nguy cơ lệch chuẩn, tất cả các module trong hệ sinh thái đều bắt buộc phải nhập (import) schema từ gói `@automa/core`.

## 📦 Kiến trúc & Công nghệ

- **ORM**: Sử dụng `drizzle-orm` (tối ưu hóa tốc độ, Typescript an toàn, không cần runtime metadata).
- **Driver**: Dành cho SQLite (`drizzle-orm/better-sqlite3`).

## 🗄️ Các tập dữ liệu (Databases)

Hệ thống được chia thành hai nhánh dữ liệu chính:

### 1. History DB (Lịch sử thực thi)
Được sử dụng bởi CLI và Hub để ghi lại nhật ký chạy Workflow.
- **`jobs`**: Lưu trữ các phiên chạy của Workflow (ID, trạng thái, thời gian bắt đầu, kết thúc).
- **`logs`**: Chứa toàn bộ console logs, error logs, và execution steps của một `job` cụ thể.

### 2. Asset DB (MMO Foundation)
Lưu trữ các tài nguyên (assets) dành riêng cho kiến trúc quản lý đa luồng (Campaigns).
- **`accounts`**: Danh sách tài khoản (Username, Password, Cookies, Trust Score) trên các nền tảng (Facebook, Google...).
- **`proxies`**: Kho Proxy (IP, Cổng, Giao thức HTTP/SOCKS5, Trạng thái sống/chết).
- **`campaigns`**: Bảng điều khiển chiến dịch (Campaign) liên kết một Workflow cụ thể với lịch trình (Cron) và danh sách tài khoản.
- **`browser_profiles`**: Lưu trữ thông tin Anti-Detect Browser (User-Agent, Timezone, Screen Resolution) được gán (bind) cho từng tài khoản.
- **`campaign_accounts`**: Bảng nối (Many-to-Many) liên kết chiến dịch và các tài khoản được phép sử dụng.
- **`schedules`**: Các tác vụ Cron độc lập quản lý bởi `@automa/hub`.

## 🚀 Hướng dẫn sử dụng

### Cài đặt
Bởi vì đây là một gói nội bộ (internal workspace package), bạn chỉ cần cấu hình dependencies trong `package.json` của module mục tiêu (như `automa-hub`):

```json
"dependencies": {
  "@automa/core": "workspace:*"
}
```

### Import Schemas

Sử dụng trực tiếp các bảng đã được đặc tả để thao tác với Drizzle ORM:

```typescript
import { db } from './my-db-connection';
import { campaigns, accounts, eq } from '@automa/core';

// Lấy danh sách các chiến dịch
const activeCampaigns = await db.select().from(campaigns).where(eq(campaigns.status, 'active'));

// Lấy thông tin tài khoản
const myAccount = await db.select().from(accounts).where(eq(accounts.username, 'testuser'));
```

### Sử dụng Shared Repositories

Gói `core` cũng cung cấp sẵn các mẫu thiết kế hướng dữ liệu như `JobRepository`:

```typescript
import { JobRepository } from '@automa/core';
import { db } from './my-db-connection';

const repo = new JobRepository(db);

// Tự động tạo job và logs
await repo.createJob('job-id-123', 'My Workflow', { params: {} });
await repo.addLog('job-id-123', 'info', 'Đang khởi chạy trình duyệt...');
```

## 🛠️ Phát triển & Migrate

Nếu bạn cần sửa đổi cấu trúc bảng (thêm/bớt cột), hãy chỉnh sửa tệp `src/db/schema.ts`.
Sau đó, sử dụng công cụ của Drizzle (như `drizzle-kit generate:sqlite`) tại thư mục gốc của CLI/Hub để tạo ra các bản vá migrate (SQL migrations) tương ứng.
