---
title: Linter Diagnostics
date: 2026-08-05
tags: [vscode, linter, validation, error-highlighting]
---

# Tích hợp Linter Diagnostics (VS Code)

Tính năng Linter Diagnostics mang sức mạnh của [[Linter_Engine]] vào không gian soạn thảo của Visual Studio Code, biến nó thành một IDE thực thụ cho Automa.

## Cơ chế hoạt động

- **Phát hiện Event**: Khi người dùng mở một file có đuôi `.automa.json`, `.workflow.json` hoặc `.Campaigns.json`, Extension sẽ đăng ký lắng nghe sự kiện `onDidChangeTextDocument` (khi gõ phím) và `onDidSaveTextDocument` (khi lưu file).
- **Thực thi tĩnh**: Hệ thống gọi ngầm class `LinterService.validate(content, options)`.
- **Ánh xạ lỗi**: Kết quả trả về (thường là mảng các `errors` hoặc `warnings`) sẽ được phân tích. Do JSON không có line number trong kết quả lỗi của schema validator (Ajv), Extension sử dụng các hàm parser (hoặc regex heuristic) để ánh xạ thông báo lỗi tới dòng và cột (line & column) thực tế trên trình soạn thảo.
- **Hiển thị trực quan (Squiggly Lines)**:
  - Nếu là lỗi cú pháp hoặc schema vi phạm nặng (ví dụ: thiếu ID, thiếu nhánh bắt buộc): Hiện gạch chân lượn sóng màu **Đỏ** (Error).
  - Nếu là lỗi cấu trúc Vault (ví dụ: Thiếu profile, Thiếu workflow được tham chiếu) nhưng không cản trở việc render trên Studio: Hiện gạch chân lượn sóng màu **Cam/Vàng** (Warning). Điều này giúp UI của Automa Studio linh hoạt tự khởi tạo thay vì bị sập cứng.

## Các lệnh hỗ trợ
- `automa.lintCheck`: Command kích hoạt ép buộc (force lint) kiểm tra lại toàn bộ file hiện tại và hiển thị thông báo dưới thanh Toast (notification) nếu có lỗi.

## Mối liên hệ với Automa Vault
Vì Linter Diagnostics hoạt động trên môi trường thư mục mở (Workspace), nó có thể truyền trực tiếp `workspaceFolders[0].uri.fsPath` xuống làm `vault-path` cho Linter Engine, nhờ đó mọi liên kết nội bộ trong Vault đều được kiểm duyệt chặt chẽ ngay khi gõ phím.
