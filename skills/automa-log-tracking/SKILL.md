---
name: automa-log-tracking
description: Hướng dẫn truy vết và chẩn đoán lỗi thời gian thực từ thư mục .automa/logs/ khi debug hệ sinh thái Automa.
---

# Automa Log Tracking

## 1. Nguồn Dữ Liệu
Khi người dùng yêu cầu kiểm tra lỗi, debug hoặc xem trạng thái hệ thống:
- **`dev-errors.log`** (`.automa/logs/dev-errors.log`): Chứa lỗi (`[ERROR]`) và cảnh báo (`[WARN]`). **Đọc file này đầu tiên**.
- **`dev-all.log`** (`.automa/logs/dev-all.log`): Chứa toàn bộ luồng stdout/stderr của tất cả dịch vụ. Đọc khi cần thêm ngữ cảnh.

## 2. Quy Trình Chẩn Đoán
1. Đọc nhanh các dòng mới nhất của `dev-errors.log`.
2. Xác định phạm vi dịch vụ qua tiền tố:
   - `[CORE]` → Rust Daemon (`automa-core`)
   - `[DESK]` → Desktop App (`automa-desk`)
   - `[VSCE]` → VS Code Extension (`automa-vsce`)
   - `[STUDIO]` / `[RUNNER]` → Web Extension (`automa-webe`)
   - `[DOCS]` → Scalar Docs Server
3. Định vị trực tiếp file code liên quan và xử lý.


