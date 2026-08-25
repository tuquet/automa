---
name: automa-log-tracking
description: Kỹ năng giám sát, truy vết và chẩn đoán lỗi thời gian thực (Realtime Log Diagnostics) từ .automa/logs/dev-errors.log và dev-all.log cho toàn bộ hệ sinh thái Automa Monorepo (Core, Desk, VSCE, Studio, Docs, Runner).
---

# Kỹ Năng Giám Sát & Chẩn Đoán Log Thời Gian Thực (Automa Log Tracking & Diagnostics)

## 1. Mục Đích & Điều Kiện Kích Hoạt (Trigger Conditions)
Kỹ năng này **BẮT BUỘC KÍCH HOẠT** bất cứ khi nào:
- Người dùng yêu cầu: *"đọc log", "check log", "app bị lỗi gì", "tại sao không chạy", "sao port bị lỗi", "debug hệ thống"*.
- Sau khi thực hiện refactor hoặc chỉnh sửa code liên quan đến Rust Daemon, API endpoints, Tauri IPC, hoặc Webview khi dev orchestrator đang chạy.
- Cần đối soát trạng thái runtime của 6 dịch vụ cốt lõi trong `pnpm dev`.

---

## 2. Bản Đồ File Log Cần Theo Dõi (Log Map)

| File Log | Vị trí | Mục đích theo dõi |
| :--- | :--- | :--- |
| **`dev-errors.log`** 🚨 | `.automa/logs/dev-errors.log` | **Ưu tiên đọc đầu tiên**. Chứa các dòng lỗi (`[ERROR]`), cảnh báo (`[WARN]`), panic, exception, và stack traces. |
| **`dev-all.log`** 📜 | `.automa/logs/dev-all.log` | Chứa toàn bộ luồng stdout/stderr đã lọc sạch ANSI colors. Dùng để xem ngữ cảnh trước và sau khi lỗi xảy ra. |
| **`dev-errors.log.prev`** ⏳ | `.automa/logs/dev-errors.log.prev` | Lịch sử lỗi của phiên dev trước đó (được tự động lưu trữ khi bắt đầu phiên mới). |

---

## 3. Ma Trận Chẩn Đoán Lỗi Theo Phân Vùng Service (Error Taxonomy)

### 🦀 `[CORE]` (Rust Daemon — Port `:8765`)
- **Dấu hiệu**: `panicked at`, `error[E0...]`, `Address already in use (os error 10048)`, `sqlite::Error`.
- **Hành động xử lý**:
  1. Kiểm tra compile error trong `automa-core/src/`.
  2. Nếu trùng port `8765`: Dùng `taskkill /f /im automa-core.exe` (Windows) để giải phóng socket.
  3. Nếu lỗi Schema: Chạy `pnpm run sync:api` để đồng bộ lại `openapi.json`.

### 🖥️ `[DESK]` (Tauri v2 + Vue 3.5 — Port `:1420`)
- **Dấu hiệu**: `Failed to resolve import`, `IPC command not found`, `Vite error`, `Cannot read property of undefined`.
- **Hành động xử lý**:
  1. Kiểm tra import trong `automa-desk/src/`.
  2. Đối chiếu IPC commands trong `src-tauri/src/commands.rs` và `src/shared/ipc.ts`.
  3. Chạy `pnpm -F @automa/desk test:unit` để xác nhận logic components.

### 🧩 `[VSCE]` (VS Code Extension — TS Watcher)
- **Dấu hiệu**: `tsup Build failed`, `Cannot find module`, `Type error`.
- **Hành động xử lý**:
  1. Kiểm tra file TypeScript vừa thay đổi (xem dòng `CLI Change detected: change ...` trong `dev-all.log`).
  2. Đối soát types với `@automa/types/api`.

### 🎨 `[STUDIO]` (Vue Flow Standalone Canvas — Port `:5173`)
- **Dấu hiệu**: `webpack Failed to compile`, `defineEmits is a compiler macro`, `Module not found`.
- **Hành động xử lý**:
  1. Loại bỏ các import thừa `defineProps`/`defineEmits` trong `<script setup>`.
  2. Kiểm tra `webpack.studio.config.js` và các alias trong `automa-webe`.

### 📖 `[DOCS]` (Scalar API Server — Port `:8767`)
- **Dấu hiệu**: `openapi.json not found`, `JSON Parse Error`.
- **Hành động xử lý**: Chạy `pnpm run sync:api` để sinh lại file `openapi.json` ở root.

---

## 4. Quy Trình 4 Bước Chẩn Đoán Chuẩn (SOP - Diagnostic Procedure)

1. **Bước 1: Quét nhanh lỗi mới**
   - Dùng `view_file` đọc 30 dòng cuối của `.automa/logs/dev-errors.log`.
2. **Bước 2: Phân tích ngữ cảnh (Contextual Analysis)**
   - Nếu có lỗi, dùng `view_file` trên `dev-all.log` xung quanh mốc thời gian đó để tìm nguyên nhân gốc.
3. **Bước 3: Định vị file & sửa lỗi (Pinpoint & Fix)**
   - Mở chính xác file gây ra lỗi, áp dụng `replace_file_content` để khắc phục.
4. **Bước 4: Kiểm tra lại log (Verification Check)**
   - Đọc lại log để xác nhận thông báo `Build success` hoặc `compiled successfully` đã xuất hiện.

