---
type: rule
project: automa-ecosystem
status: active
tags: #rule, #setup, #build, #troubleshooting
---

# Quy tắc và Kiến thức về dự án Automa Ecosystem (Workspace Rules)

Dự án này là một fork và tùy biến của Automa. Dưới đây là các lưu ý cực kỳ quan trọng cần nhớ cho các agent khi thao tác tự động hoá, setup môi trường, hoặc build dự án.

## 1. Lỗi Build Silently (Thiếu file getPassKey.js)
- **Vấn đề**: File `src/utils/getPassKey.js` nằm trong danh sách `.gitignore` của repo gốc (chứa secret production) nên khi clone về sẽ bị thiếu.
- **Hệ quả**: Webpack biên dịch sẽ gặp lỗi `Module not found: Error: Can't resolve './getPassKey'`. Tuy nhiên, script `utils/build.js` của Automa **bị cấu hình nuốt lỗi** (không check `stats.hasErrors()`), dẫn đến việc tiến trình build thoát với code 0 nhưng **không hề sinh ra thư mục `build`** và không báo lỗi ra console.
- **Cách khắc phục**:
  1. Luôn phải tạo một file giả lập `src/utils/getPassKey.js` trước khi build:
     ```javascript
     export default function getPassKey(type) {
       return "dev-secret-key-123456789";
     }
     ```
  2. Nên sửa lại `utils/build.js` để in lỗi ra nếu cần debug:
     ```javascript
     webpack(config, function (err, stats) {
       if (err) throw err;
       if (stats.hasErrors()) {
         console.error(stats.toString({ colors: true, errors: true, warnings: false }));
         process.exit(1);
       }
     });
     ```

## 2. Vấn đề cài đặt Package với PNPM
- **Vấn đề**: Khi chạy `pnpm install`, bạn có thể gặp lỗi `[ERR_PNPM_IGNORED_BUILDS]` liên quan đến `core-js`, `simple-git-hooks`, v.v. do cấu hình bảo mật của pnpm chặn chạy script tự động.
- **Cách khắc phục**: Sử dụng lệnh `pnpm install --ignore-scripts` để bỏ qua lỗi này.

## 3. Khởi tạo Local Supabase & Env Var
- **Vấn đề**: Việc chạy `supabase start` lần đầu trên Windows Docker Desktop có thể gặp lỗi timeout ở các bước health check (như `supabase_storage`) do dung lượng images quá lớn.
- **Cách khắc phục**:
  1. Chỉ cần chạy lại lệnh `supabase start` lần 2, các dịch vụ sẽ boot rất nhanh.
  2. Setup biến môi trường: Code gốc của Automa **không sử dụng `dotenv` hay file `.env`**. Thay vào đó, nó dùng cơ chế alias của Webpack trỏ vào các file `secrets.development.js` hoặc `secrets.production.js`.
  3. **Cách khắc phục cho code Extension**: Để đưa thông tin Supabase vào Extension một cách "sạch sẽ" nhất, hãy khai báo thông tin đó vào `automa/secrets.development.js` và `automa/secrets.production.js`:
     ```javascript
     export default {
       baseApiUrl: 'https://api.automa.site',
       supabaseUrl: 'http://127.0.0.1:54321',
       supabaseKey: 'sb_publishable_...',
     };
     ```
     Sau đó trong code sử dụng: `import secrets from 'secrets';` và truy xuất `secrets.supabaseUrl`.

## 4. Lỗi "process is not defined" (Webpack 5 Polyfill)
- **Vấn đề**: Webpack 5 không tự động chèn polyfill cho thư viện Node.js. Khi cài đặt các module như `@supabase/supabase-js`, trình duyệt sẽ báo lỗi `Uncaught ReferenceError: process is not defined` và crash background script (Status code 15).
- **Cách khắc phục**: Cài đặt thêm module `process` (`pnpm add process`) và cấu hình `webpack.ProvidePlugin` trong `webpack.config.js`:
     ```javascript
     new webpack.ProvidePlugin({
       process: 'process/browser.js',
     })
     ```
