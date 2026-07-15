# Automa Ecosystem - Hướng dẫn phát triển (Development Guide)

Chào mừng đến với dự án Automa Ecosystem (phiên bản tùy chỉnh với kiến trúc Supabase Local). Tài liệu này ghi lại toàn bộ các thiết lập đặc thù, kiến trúc đồng bộ (Sync Architecture) và cách cấu hình môi trường phát triển chỉ với một click.

## 1. Kiến trúc hệ thống

Dự án được chia làm 2 phần chính:
- **`automa-ex/`**: Mã nguồn gốc của Automa Extension (trình duyệt).
- **`automa-be/`**: Backend Supabase Local dùng để lưu trữ và đồng bộ hóa Workflows.

### Kiến trúc Đồng bộ (Sync Architecture)
Thay vì sử dụng tính năng đồng bộ mặc định của Automa lên server official, chúng ta đã can thiệp và thiết lập cơ chế **Đồng bộ 2 chiều (Bi-directional Sync)** với Local Supabase:
- **IndexedDB**: Đóng vai trò là Single Source of Truth (SSOT) dưới local để đảm bảo khả năng Offline-First. Mọi thay đổi của người dùng (tạo/sửa/xoá Workflow) đều được lưu vào IndexedDB thông qua Pinia Store và đẩy thêm 1 log vào bảng `syncQueue`.
- **Background Sync Engine**: Chạy ngầm trong Service Worker (Background script). Khi khởi động, nó thực hiện:
  1. **Boot Pull**: Lấy các delta updates từ Supabase (dựa theo `lastSyncedAt`) và hợp nhất (merge) xuống IndexedDB bằng thuật toán Last-Write-Wins (LWW).
  2. **Push Outbox**: Quét `syncQueue` và đẩy các thay đổi lên Supabase.
  3. **Realtime**: Lắng nghe WebSocket (Supabase Realtime) để nhận các thay đổi tức thời từ Cloud về Local.

## 2. Quản lý Secret & Environment

Code gốc của Automa **không sử dụng `dotenv` hay `.env`**. Thay vào đó, dự án sử dụng tính năng **Alias của Webpack**.
Để cung cấp URL và Key của Supabase cho Extension mà không phải hardcode bẩn, các cấu hình này được đặt trong:

- `automa-ex/secrets.development.js`
- `automa-ex/secrets.production.js`

**Nội dung cấu hình mẫu (đã setup):**
```javascript
export default {
  baseApiUrl: 'https://api.automa.site', // Giữ nguyên để catch 404 silently
  supabaseUrl: 'http://127.0.0.1:54321', // Local Supabase URL
  supabaseKey: 'sb_publishable_...', // Local Anon Key (lấy từ lệnh supabase status)
};
```
Trong mã nguồn, bạn chỉ cần gọi `import secrets from 'secrets';` là Webpack sẽ tự động inject đúng file theo môi trường build.

## 3. Khởi chạy dự án và Release (VS Code Tasks)

Dự án đã tích hợp cấu hình sẵn các **VS Code Tasks** trong `.vscode/tasks.json`. Developer chỉ cần sử dụng tính năng của VS Code để thao tác dev hoặc release:

### Hướng dẫn sử dụng:
1. Nhấn phím `F1` (hoặc `Ctrl + Shift + P` / `Cmd + Shift + P`).
2. Gõ và chọn `Tasks: Run Task`.
3. Chọn một trong các task sau để thực thi:
   - **`0. Workspace: Install Dependencies`**: Cài đặt pnpm dependencies cho toàn bộ workspace.
   - **`1. Backend: Start Supabase (Local)`**: Khởi động local Supabase.
   - **`2. Backend: Stop Supabase (Local)`**: Dừng local Supabase.
   - **`3. Backend: Reset & Seed Database`**: Reset trắng database và chạy seed lại từ folder.
   - **`4. Backend: Lint Workflows & Packages`**: Chạy linter kiểm tra tính đúng đắn của schema.
   - **`5. Frontend: Start Extension Dev Server`**: Chạy môi trường phát triển của extension.
   - **`6. Frontend: Build Production Chrome Extension`**: Build đóng gói tối ưu cho Chrome Extension.
   - **`7. Frontend: Release & Upload Extension Wizard`**: Chạy wizard tăng version, đóng gói ZIP và upload trực tiếp lên Supabase Storage (sử dụng API).
   - **`8. Backend: Deploy to Supabase Cloud`**: Link dự án và đẩy Database migrations + Edge Functions lên Supabase Cloud của Production.

Nếu bạn không dùng VS Code, dưới đây là các bước chạy thủ công tương ứng:

### Bước 1: Khởi động Backend (Supabase)
```bash
cd automa-be
npx supabase start
```
*Lưu ý: Nếu lần đầu tiên báo lỗi health check do Docker pull image quá lâu, hãy chạy lại lệnh trên lần thứ 2.*

Đảm bảo database đã được phân quyền đầy đủ cho extension bằng cách chạy (chỉ cần chạy lần đầu hoặc khi có thay đổi DB):
```bash
npx supabase migration up
```
Bạn có thể xem dữ liệu trực quan tại **Supabase Studio**: `http://127.0.0.1:54323`

### Bước 2: Cài đặt và Build Frontend (Extension)
Vào thư mục `automa-ex`:
```bash
cd automa-ex
pnpm install --ignore-scripts
```
*Lưu ý dùng `--ignore-scripts` để bỏ qua lỗi build của các package phụ trên Windows.*

Để biên dịch Extension:
```bash
pnpm run build
```

Sau khi chạy xong, toàn bộ code extension sẽ nằm trong thư mục `automa-ex/build`. Mở trình duyệt (Chrome/Edge), vào `chrome://extensions`, bật **Developer mode** và chọn **Load unpacked** trỏ tới thư mục `build` này.

## 4. Gỡ rối (Troubleshooting) thường gặp

1. **Lỗi `Uncaught ReferenceError: process is not defined`**: 
   - Webpack 5 không tự động chèn polyfill cho `process`. Đã được fix bằng cách cấu hình `webpack.ProvidePlugin` trong `webpack.config.js`.
2. **Tiến trình build chạy thành công nhưng không sinh ra thư mục `build`**:
   - Do thiếu file `src/utils/getPassKey.js` (file này bị gitignore trong repo gốc của Automa). Đã được fix bằng cách tạo file giả lập trả về chuỗi tĩnh.
3. **Lỗi `permission denied for table workflows` trong background script**:
   - Do Supabase yêu cầu phân quyền tường minh. Đã được fix trong thư mục `automa-be/supabase/migrations/` bằng cách `GRANT` quyền cho role `anon` và `authenticated`.

---
*Tài liệu này được biên soạn bởi Agent. Chúc bạn code vui vẻ với hệ sinh thái Automa!*
