---
title: Automa VS Code Extension - Settings Configuration
date: 2026-08-05
tags:
  - vscode
  - settings
  - configuration
---

# Automa CLI Toolkit — Settings & Configuration

Tài liệu này trình bày các tuỳ chọn cấu hình có thể thiết lập cho Automa CLI Toolkit trong VS Code. Bạn có thể truy cập các thiết lập này qua **File → Preferences → Settings** (hoặc `Ctrl+,`) và tìm kiếm từ khoá `automa`.

---

## 1. Cấu hình Editor & Preview

### `automa.preview.defaultOnClick`
- **Loại**: `boolean`
- **Mặc định**: `true`
- **Mô tả**: Tự động mở file `*.automa.json` bằng **Workflow Preview** (giao diện trực quan) thay vì Editor JSON thô. Khi thay đổi cài đặt này, extension sẽ tự động cập nhật lại `workbench.editorAssociations` trong workspace.

---

## 2. Cấu hình Workflow Execution

Các cấu hình dưới đây ảnh hưởng đến cách lệnh `automa.runWorkflow` và `automa.runFleet` thực thi lệnh CLI.

### `automa.run.useDefaultParameters`
- **Loại**: `boolean`
- **Mặc định**: `false`
- **Mô tả**: Khi kích hoạt, VS Code sẽ bỏ qua hộp thoại (Prompt) nhập tham số trigger và tự động dùng giá trị mặc định được định nghĩa trong file workflow.

### `automa.vault.run.defaultBrowser`
- **Loại**: `enum`
- **Mặc định**: `"chromium"`
- **Các giá trị hỗ trợ**: 
  - `chromium`: Trình duyệt Chromium được cô lập bởi Puppeteer (an toàn nhất).
  - `chrome`: Google Chrome hệ thống.
  - `edge`: Microsoft Edge.
  - `firefox`: Mozilla Firefox.
  - `brave`: Brave Browser.
  - `active-tab`: Chạy trên tab trình duyệt đang mở.
- **Mô tả**: Thiết lập trình duyệt mặc định để chạy các workflow.

### `automa.vault.run.headless`
- **Loại**: `boolean`
- **Mặc định**: `false`
- **Mô tả**: Khi bật, trình duyệt sẽ chạy ẩn (headless), giúp tiết kiệm tài nguyên và không làm phiền trải nghiệm sử dụng máy tính.

### `automa.vault.run.closeBrowserOnFinish`
- **Loại**: `boolean`
- **Mặc định**: `true`
- **Mô tả**: Tự động đóng cửa sổ trình duyệt khi workflow thực thi xong (thành công hoặc thất bại). Nếu tắt, bạn có thể kiểm tra kết quả trực quan sau khi xong.

### `automa.vault.run.debug`
- **Loại**: `boolean`
- **Mặc định**: `false`
- **Mô tả**: Kích hoạt chế độ debug (log chi tiết) khi gọi lệnh CLI. Rất hữu ích khi cần điều tra lỗi các bước xử lý của workflow.

### `automa.vault.run.fleetGridSystem`
- **Loại**: `boolean`
- **Mặc định**: `false`
- **Mô tả**: Bật tính năng chia lưới màn hình (Grid System) tự động phân bổ các cửa sổ trình duyệt trên màn hình khi chạy Automa Fleet (rất hữu ích khi chạy đa luồng).

### `automa.cliPath`
- **Loại**: `string`
- **Mặc định**: `""` (Trống)
- **Mô tả**: Đường dẫn tuyệt đối tới file thực thi `automa-cli`. Nếu để trống, extension sẽ tự động áp dụng logic tự phát hiện (Auto-Resolution):
  1. Nếu nằm trong monorepo, ưu tiên tìm ở `../automa-cli/dist/cli.js`.
  2. Fallback sử dụng `npx -y tuquet-automa-cli@latest`.

### `automa.browserPathOverride`
- **Loại**: `string`
- **Mặc định**: `""`
- **Mô tả**: Đường dẫn tuyệt đối tới file thực thi trình duyệt tuỳ chỉnh. Đặc biệt hữu ích ở các môi trường doanh nghiệp (Corporate) nơi Chrome hoặc Chromium bị chặn bởi Group Policy. Ví dụ: `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`.

### `automa.daemon.port`
- **Loại**: `number`
- **Mặc định**: `8765`
- **Mô tả**: Port mặc định được sử dụng cho Background Daemon. Nếu port bị chiếm, extension sẽ tự động dò tìm port tiếp theo (vd: `8766`).

---

## 3. Cấu hình Environment & Logs

### `automa.vault.run.globalVariables`
- **Loại**: `object` (JSON Key-Value)
- **Mặc định**: `{}`
- **Mô tả**: Chứa các biến toàn cục (thường có tiền tố `$$`, ví dụ: `$$API_KEY`) sẽ tự động được gán vào mỗi lần chạy workflow. 
- **Lưu ý**: Các biến được khai báo qua giao diện Prompt của VS Code (tham số trigger) sẽ ghi đè các biến toàn cục này nếu bị trùng tên.

### `automa.vault.run.logPath`
- **Loại**: `string`
- **Mặc định**: `""`
- **Mô tả**: Chỉ định thư mục tuyệt đối để lưu các file nhật ký thực thi (`*.automa-log.json`). Nếu để trống, log sẽ được lưu tại vị trí mặc định do CLI quy định.

> [!NOTE]
> Thông tin chi tiết quá trình chạy (log text) luôn được xuất ra panel **Output** (`Ctrl+Shift+U`) trong channel **"Automa Execution Logs"**.
