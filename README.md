# Automa Ecosystem - Hướng dẫn phát triển (Development Guide)

Chào mừng đến với dự án Automa Ecosystem (phiên bản tùy chỉnh với kiến trúc Supabase Local). Tài liệu này ghi lại toàn bộ các thiết lập đặc thù, kiến trúc đồng bộ (Sync Architecture) và cách cấu hình môi trường phát triển chỉ với một click.

## 1. Kiến trúc hệ thống

Dự án được chia làm 2 phần chính:
- **`automa/`**: Mã nguồn gốc của Automa Extension (trình duyệt).
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

- `automa/secrets.development.js`
- `automa/secrets.production.js`

**Nội dung cấu hình mẫu (đã setup):**
```javascript
export default {
  baseApiUrl: 'https://api.automa.site', // Giữ nguyên để catch 404 silently
  supabaseUrl: 'http://127.0.0.1:54321', // Local Supabase URL
  supabaseKey: 'sb_publishable_...', // Local Anon Key (lấy từ lệnh supabase status)
};
```
Trong mã nguồn, bạn chỉ cần gọi `import secrets from 'secrets';` là Webpack sẽ tự động inject đúng file theo môi trường build.

## 3. Khởi chạy dự án (One-click Setup)

Để thuận tiện nhất, dự án hỗ trợ cấu hình DevContainer, cho phép tự động cài đặt toàn bộ môi trường (Node.js, pnpm, Supabase CLI, v.v.).

Nếu bạn không dùng DevContainer, đây là các bước thủ công:

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
Vào thư mục `automa`:
```bash
cd automa
pnpm install --ignore-scripts
```
*Lưu ý dùng `--ignore-scripts` để bỏ qua lỗi build của các package phụ trên Windows.*

Để biên dịch Extension:
```bash
pnpm run build
```

Sau khi chạy xong, toàn bộ code extension sẽ nằm trong thư mục `automa/build`. Mở trình duyệt (Chrome/Edge), vào `chrome://extensions`, bật **Developer mode** và chọn **Load unpacked** trỏ tới thư mục `build` này.

## 4. Gỡ rối (Troubleshooting) thường gặp

1. **Lỗi `Uncaught ReferenceError: process is not defined`**: 
   - Webpack 5 không tự động chèn polyfill cho `process`. Đã được fix bằng cách cấu hình `webpack.ProvidePlugin` trong `webpack.config.js`.
2. **Tiến trình build chạy thành công nhưng không sinh ra thư mục `build`**:
   - Do thiếu file `src/utils/getPassKey.js` (file này bị gitignore trong repo gốc của Automa). Đã được fix bằng cách tạo file giả lập trả về chuỗi tĩnh.
3. **Lỗi `permission denied for table workflows` trong background script**:
   - Do Supabase yêu cầu phân quyền tường minh. Đã được fix trong thư mục `automa-be/supabase/migrations/` bằng cách `GRANT` quyền cho role `anon` và `authenticated`.

---
*Tài liệu này được biên soạn bởi Agent. Chúc bạn code vui vẻ với hệ sinh thái Automa!*
