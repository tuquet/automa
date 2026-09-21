# Hướng dẫn Tự Động Hóa Triển Khai Automa Studio lên Vercel (Monorepo Native Git)

Tài liệu này ghi lại chi tiết cấu hình và quy trình tự động hóa triển khai **Automa Visual Studio (`automa-webe/src/studio`)** lên hạ tầng Vercel Edge Network theo kiến trúc **Monorepo Native Git Integration**.

---

## 1. Tổng quan Kiến Trúc Triển Khai

Automa Studio là ứng dụng thuần Web UI (Single Page Application - SPA) viết bằng Vue 3, Vite, Tailwind CSS, Pinia và Vue Flow. 

- **Đầu ra bản dựng tĩnh**: Nằm tại `automa-webe/dist/studio/` (`index.html` và `assets/*`).
- **Phụ thuộc nội bộ trong Monorepo**: 
  - `@automa/types` (`packages/automa-types`)
  - `@automa/ui` (`packages/automa-ui`)
- **Quản lý mã nguồn**:
  - Repo cha: `tuquet/automa-ecosystem` (Monorepo chứa root workspace)
  - Submodule: `tuquet/automa-webe` (Private Git Submodule)
- **Vercel Project**: `automa-studio` (Team: `tuquets-projects`)
- **Live URL**: `https://studio-lyart-one-86.vercel.app` (hoặc `automa-studio.vercel.app`)

---

## 2. Các Tệp Cấu Hình Đã Thiết Lập

### A. `vercel.json` (Thư mục gốc monorepo)
Cấu hình Vercel build command, output directory và các luật định tuyến SPA:
- **Framework**: `vite`
- **Build Command**: `pnpm run vercel:build`
- **Output Directory**: `automa-webe/dist/studio`
- **Rewrites**: `/(.*) -> /index.html` (Đảm bảo F5 refresh và deep linking không bị 404).
- **Headers**: Cache-Control 1 năm cho `/assets/*` và bật CORS `Access-Control-Allow-Origin: *`.

### B. `scripts/vercel-install.sh`
Script cài đặt tự động được Vercel thực thi trước khi build:
1. Đọc biến môi trường `GH_PAT` và cấu hình Git rewrite URL để có quyền clone submodule private `automa-webe`.
2. Chỉ khởi tạo duy nhất submodule `automa-webe` (`git submodule update --init --recursive automa-webe`), giúp tối ưu hóa thời gian build và không cần tải Rust/Cargo cho `automa-core`.
3. Chuẩn bị môi trường `pnpm` tương thích Node 24.x trên Vercel.
4. Cài đặt toàn bộ dependencies của monorepo (`pnpm install --frozen-lockfile=false`).

### C. Các Scripts trong `package.json`
- `"vercel:install"`: Chạy `bash scripts/vercel-install.sh`.
- `"vercel:build"`: Chạy `turbo run build:studio`.
- `"vercel:ignore"`: Kiểm tra thay đổi commit (`git diff --quiet HEAD^ HEAD automa-webe/ packages/automa-ui/ packages/automa-types/ pnpm-workspace.yaml package.json`). Trả về exit code `0` nếu không có thay đổi để hủy build không cần thiết, tiết kiệm build minutes.
- `"deploy:studio"`: Lệnh One-Click Deploy thủ công từ terminal (`pnpm run build:studio && vercel deploy automa-webe/dist/studio --prod`).

---

## 3. Cài Đặt Cần Thiết trên Vercel Dashboard

Dự án đã được liên kết với project `automa-studio` trên team `tuquets-projects`. Để đảm bảo Git Integration tự động chạy khi push commit lên GitHub:

1. **Truy cập Cài đặt Project trên Vercel**:
   - URL: `https://vercel.com/tuquets-projects/automa-studio/settings`
2. **Environment Variables**:
   - Thêm biến `GH_PAT`:
     - **Key**: `GH_PAT`
     - **Value**: GitHub Personal Access Token (classic hoặc fine-grained) có quyền Read truy cập repo private `tuquet/automa-webe`.
     - **Scope**: Chọn `Production`, `Preview`, và `Development`.
3. **Build & Development Settings**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `.` (Thư mục gốc)
   - **Build Command**: Bật Override -> `pnpm run vercel:build`
   - **Output Directory**: Bật Override -> `automa-webe/dist/studio`
   - **Install Command**: Bật Override -> `bash scripts/vercel-install.sh`
   - **Node.js Version**: `24.x`
4. **Git -> Ignored Build Step (Tối ưu tài nguyên)**:
   - Chọn **Custom**:
     ```bash
     git diff --quiet HEAD^ HEAD automa-webe packages/automa-ui packages/automa-types pnpm-workspace.yaml package.json
     ```

---

## 4. Quy Trình Làm Việc Hàng Ngày (Developer Workflow)

### Kịch bản A: Triển khai Tự Động qua Git (Khuyên dùng)
1. Thực hiện chỉnh sửa mã nguồn Studio trong `automa-webe/`.
2. Commit & Push trong `automa-webe`.
3. Tại thư mục gốc `automa-ecosystem`, cập nhật commit pointer của submodule:
   ```bash
   git add automa-webe
   git commit -m "feat(studio): update studio workflow editor"
   git push origin dev
   ```
4. Vercel tự động nhận commit, kiểm tra diff, chạy `vercel-install.sh`, build Studio và xuất bản phiên bản mới lên Vercel Edge.

### Kịch bản B: One-Click Deploy Ngay từ VPS / Local
Khi cần deploy gấp từ máy tính mà không cần chờ Git webhook:
```bash
pnpm run deploy:studio
```
Lệnh này sẽ tự động build studio ra `automa-webe/dist/studio` và đẩy trực tiếp lên Vercel trong ~10 giây.
