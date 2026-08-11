---
title: Hướng dẫn Phát triển (Development Guide)
date: 2026-08-10
tags:
  - vscode
  - dev
  - build
---

# 🚀 Hướng dẫn Phát triển Automa VS Code Extension

Tài liệu này cung cấp hướng dẫn từng bước dành cho các nhà phát triển để thiết lập môi trường debug, kết nối với Automa CLI, và đóng gói extension thành file cài đặt (VSIX).

---

## 1. Môi trường Debug (Launch Debugging)

Khi phát triển extension `automa-vscode`, thay vì build liên tục, bạn có thể sử dụng tính năng **Launch Debugging** (nhấn `F5`) của VS Code để chạy trực tiếp source code với hot-reload.

### Điểm bắt đầu (Entry Point)
File khởi chạy chính của extension nằm tại `automa-vscode/src/extension.ts`. Khi nhấn F5, VS Code sẽ:
1. Gọi preLaunchTask (thường là `Workspace: Dev VSCode` ở root hoặc `Extension: Watch` bên trong submodule) để chạy lệnh `pnpm dev`.
2. Khởi tạo một phiên bản "Extension Development Host" (một cửa sổ VS Code mới).
3. Đính kèm Debugger vào cửa sổ đó. Khi bạn thay đổi code tại `extension.ts` hoặc các module liên quan, `tsup` sẽ tự động biên dịch sang thư mục `dist/`, giúp bạn kiểm thử ngay lập tức.

### Khởi chạy từ Root Workspace (Khuyên dùng)
Nếu bạn mở thư mục gốc `automa-ecosystem`, trong mục **Run and Debug (Ctrl+Shift+D)**:
- Chọn cấu hình: `Debug Automa VS Code Extension`
- Bấm `F5` hoặc click nút Play.

### Mối liên hệ với `automa-cli` (Daemon Architecture)
`automa-vscode` không tự mình thực thi các workflow. Nó hoạt động như một lớp giao diện (GUI) giao tiếp với **Automa CLI Toolkit** thông qua một background Daemon.
- **Kiến trúc REST/SSE**: Extension giao tiếp với Local Daemon (Node.js/Express) ở port `8765` qua các API như `/api/jobs/run`, `/api/lint`, `/api/system/install-browser`. Việc này giúp loại bỏ tình trạng tốn RAM do khởi tạo nhiều V8 contexts (raw CLI) và các lỗi parse JSON từ `stdout`.
- **Tuyệt đối không lạm dụng Raw CLI**: `DaemonManager` sẽ quản lý vòng đời của process. Extension chỉ nên gọi fallback Raw CLI (thông qua `executeRawCliCommand`) trong trường hợp bất khả kháng khi Daemon bị crash.
- Trong quá trình debug, nếu CLI có thay đổi, bạn nên mở Terminal và chạy lệnh `pnpm dev:cli` tại thư mục root để test. Local CLI sẽ tự động được ưu tiên resolve qua file `automa.cliPath` hoặc `npx`.

---

## 2. Biên dịch (Build) và Đóng gói (Package)

Khi bạn đã hoàn tất tính năng và muốn build ra file `.vsix` để chia sẻ hoặc cài đặt trực tiếp, hãy làm theo các bước sau:

### Build mã nguồn (Compile)
Extension sử dụng `tsup` làm trình đóng gói (bundler) thay cho Webpack hay Rollup. 
1. Di chuyển vào thư mục `automa-vscode`:
   ```bash
   cd automa-vscode
   ```
2. Chạy lệnh compile:
   ```bash
   pnpm run compile
   ```
Lệnh này sẽ tạo ra các file Javascript trong thư mục `dist/` (vd: `dist/extension.js`).

### Tạo file cài đặt VSIX (Package)
Để tạo ra file `.vsix`, VS Code yêu cầu bạn cài đặt công cụ `@vscode/vsce` (Visual Studio Code Extension Manager).
1. Nếu chưa có, bạn cài đặt biến môi trường toàn cục (hoặc dùng npx):
   ```bash
   npm install -g @vscode/vsce
   # Hoặc dùng pnpm:
   # pnpm add -g @vscode/vsce
   ```
2. Chạy lệnh đóng gói:
   ```bash
   vsce package --no-dependencies
   # Hoặc nếu chưa cài toàn cục:
   # npx vsce package --no-dependencies
   ```
> [!WARNING] Vấn đề Dependency trong Monorepo
> Vì `automa-vscode` nằm trong một hệ thống Monorepo, lệnh `vsce package` tiêu chuẩn có thể báo lỗi thiếu thư viện (`dependencies` không khớp với `package.json` gốc). Do đó, bạn **bắt buộc phải truyền flag `--no-dependencies`** để bỏ qua check cấu trúc và để `tsup` tự lo phần bundle các thư viện ngoài.

*Lưu ý: Quá trình package sẽ tự động gọi hook `vscode:prepublish` trong `package.json`, và chạy `pnpm run package` (chạy `tsup` với flag `--minify`) để tối ưu hóa dung lượng source code.*

Kết quả, bạn sẽ nhận được một file có dạng `automa-vscode-0.0.1.vsix` tại thư mục `automa-vscode/`. File này có thể được kéo thả vào VS Code (hoặc cài đặt bằng lệnh `Extensions: Install from VSIX...`) để sử dụng.
