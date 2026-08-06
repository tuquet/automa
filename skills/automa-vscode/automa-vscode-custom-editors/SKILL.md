---
name: automa-vscode-custom-editors
description: "Quy trình và đặc tả kiến trúc hiển thị Custom Editors (LiveLogEditor, WebviewPanel) và quản lý Daemon trong VS Code Extension."
---

# Automa VS Code - Custom Editors & Daemon Manager

## 1. Custom Editor Providers

Kiến trúc hiển thị log và giao diện đồ họa bên trong VS Code đã chuyển sang sử dụng API `CustomTextEditorProvider` và `WebviewPanel`.

### `BaseCustomEditorProvider`
- Lớp cơ sở trừu tượng xử lý vòng đời của một Webview (ví dụ: gán HTML, bắt sự kiện lưu file).
- Nhận diện các file thông qua `customEditor` đóng góp trong `package.json`.

### `LiveLogEditorProvider` / `LogCustomEditorProvider`
- **Mục đích:** Hiển thị file log (`.log`) sinh ra từ quá trình chạy Fleet hoặc Workflow dưới dạng giao diện theo dõi tiến trình (Live Tracking).
- **Hoạt động:** Thay vì mở file log bằng trình soạn thảo văn bản bình thường, VS Code sẽ mở giao diện Webview có khả năng tự động reload hoặc stream dữ liệu mới nhất (polling/tailing).

## 2. Daemon Manager (`DaemonManager.ts`)

- **Vai trò:** Quản lý vòng đời của tất cả các tiến trình nền (Automa CLI, Fleet Runner) được spawn từ VS Code.
- **Tại sao cần thiết:** Để Extension không bị mất liên lạc với tiến trình CLI, từ đó có thể kill tiến trình một cách gọn gàng, hiển thị đúng trạng thái UI (đang chạy / đã dừng), và liên kết tiến trình với file log output tương ứng.

## 3. Command Manager (`CommandManager.ts`)

- **Thay đổi:** Tách biệt hàm xử lý lệnh ra khỏi file `extension.ts` hoặc các logic UI.
- **Hoạt động:** Đóng vai trò là Registry tập trung đăng ký tất cả `vscode.commands.registerCommand(...)`. Mỗi lệnh có thể lấy dữ liệu ngữ cảnh (Context) từ TreeView hoặc Editor hiện tại một cách nhất quán.
