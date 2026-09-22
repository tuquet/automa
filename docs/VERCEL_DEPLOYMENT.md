# Hướng dẫn Tự Động Hóa Triển Khai Automa Studio lên Vercel (Pure Monorepo)

Tài liệu này ghi lại chi tiết cấu hình và quy trình tự động hóa triển khai **Automa Visual Studio (`apps/webe/src/studio`)** lên hạ tầng Vercel Edge Network theo kiến trúc **Pure Monorepo Native Git Integration**.

---

## 1. Tổng quan Kiến Trúc Triển Khai

Automa Studio là ứng dụng thuần Web UI (Single Page Application - SPA) viết bằng Vue 3, Vite, Tailwind CSS, Pinia và Vue Flow. 

- **Đầu ra bản dựng tĩnh**: Nằm tại `apps/webe/dist/studio/` (`index.html` và `assets/*`).
- **Phụ thuộc nội bộ trong Monorepo**: 
  - `@automa/types` (`packages/automa-types`)
  - `@automa/ui` (`packages/automa-ui`)
- **Quản lý mã nguồn**:
  - Repo monorepo: `tuquet/tuquet-automa` (Chứa toàn bộ `apps/` và `packages/`, không còn Git submodules).
- **Vercel Project**: `automa-studio` (Team: `tuquets-projects`)
- **Live URL**: `https://studio-lyart-one-86.vercel.app` (hoặc `automa-studio.vercel.app`)

---

## 2. Các Tệp Cấu Hình Đã Thiết Lập

### A. `vercel.json` (Thư mục gốc monorepo)
Cấu hình Vercel build command, output directory và các luật định tuyến SPA:
- **Framework**: `vite`
- **Build Command**: `pnpm run vercel:build`
- **Output Directory**: `apps/webe/dist/studio`
- **Rewrites**: `/(.*) -> /index.html` (Đảm bảo F5 refresh và deep linking không bị 404).
- **Headers**: Cache-Control 1 năm cho `/assets/*` và bật CORS `Access-Control-Allow-Origin: *`.

### B. `scripts/vercel-install.sh`
Script cài đặt tự động được Vercel thực thi trước khi build:
1. Chuẩn bị môi trường `pnpm` tương thích Node 24.x trên hạ tầng Vercel.
2. Cài đặt toàn bộ dependencies của monorepo (`pnpm install --frozen-lockfile=false`).
3. Không cần bất kỳ lệnh git clone hoặc cấu hình token `GH_PAT` nào (do mã nguồn nằm trực tiếp trong monorepo).

### C. Các Scripts trong `package.json`
- `"vercel:install"`: Chạy `bash scripts/vercel-install.sh`.
- `"vercel:build"`: Chạy `pnpm -F @automa/types build && pnpm -F @automa/ui build && turbo run build:studio`.
- `"vercel:ignore"`: Kiểm tra thay đổi commit (`git diff --quiet HEAD^ HEAD apps/webe/ packages/automa-ui/ packages/automa-types/ scripts/vercel-install.sh vercel.json pnpm-workspace.yaml package.json`). Trả về exit code `0` nếu không có thay đổi để hủy build không cần thiết, tiết kiệm build minutes.
- `"deploy:studio"`: Lệnh One-Click Deploy thủ công từ terminal (`pnpm run build:studio && vercel deploy apps/webe/dist/studio --prod`).

---

## 3. Cài Đặt Cần Thiết trên Vercel Dashboard

Dự án đã được liên kết với project `automa-studio` trên team `tuquets-projects`. Để đảm bảo Git Integration tự động chạy khi push commit lên GitHub:

1. **Truy cập Cài đặt Project trên Vercel**:
   - URL: `https://vercel.com/tuquets-projects/automa-studio/settings`
2. **Environment Variables**:
   - Không yêu cầu biến môi trường đặc biệt nào cho quá trình build công khai (toàn bộ mã nguồn `apps/webe` được checkout tự động trong monorepo).
3. **Build & Development Settings**:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `.` (Thư mục gốc)
   - **Build Command**: Bật Override -> `pnpm run vercel:build`
   - **Output Directory**: Bật Override -> `apps/webe/dist/studio`
   - **Install Command**: Bật Override -> `bash scripts/vercel-install.sh`
   - **Node.js Version**: `24.x`
4. **Git -> Ignored Build Step (Tối ưu tài nguyên)**:
   - Chọn **Custom**:
     ```bash
     git diff --quiet HEAD^ HEAD apps/webe packages/automa-ui packages/automa-types pnpm-workspace.yaml package.json
     ```

---

## 4. Quy Trình Làm Việc Hàng Ngày (Developer Workflow)

### Kịch bản A: Triển khai Tự Động qua Git (Khuyên dùng)
1. Thực hiện chỉnh sửa mã nguồn Studio trong `apps/webe/`.
2. Commit & Push trực tiếp trong repository monorepo:
   ```bash
   git add apps/webe/
   git commit -m "feat(studio): update studio workflow editor"
   git push origin main
   ```
3. Vercel tự động nhận commit, kiểm tra diff, chạy `vercel-install.sh`, build Studio và xuất bản phiên bản mới lên Vercel Edge.

### Kịch bản B: One-Click Deploy Ngay từ VPS / Local
Khi cần deploy gấp từ máy tính mà không cần chờ Git webhook:
```bash
pnpm run deploy:studio
```
Lệnh này sẽ tự động build studio ra `apps/webe/dist/studio` và đẩy trực tiếp lên Vercel trong ~10 giây.
