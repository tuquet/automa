---
name: automa-cli-browser-launcher
description: Hướng dẫn chuẩn để khởi chạy trình duyệt qua Daemon API thay vì tiến trình con.
---

# Khởi chạy Trình duyệt qua Daemon API

BẮT BUỘC ÁP DỤNG kiến trúc Thin Client & Daemon hiện đại khi phát triển hoặc tái cấu trúc tính năng mở trình duyệt cho `automa-cli`.

## Kiến trúc Core (Thin Client & Daemon)

**TUYỆT ĐỐI KHÔNG DÙNG** `child_process` (như `execFile` hay `spawn`) để khởi chạy trình duyệt trực tiếp từ giao diện dòng lệnh.

1. **Giao tiếp qua API**: CLI đóng vai trò là một Thin Client. Việc khởi chạy, quản lý vòng đời (PID) và kết nối gỡ lỗi của trình duyệt **BẮT BUỘC ĐƯỢC ỦY QUYỀN** cho Daemon xử lý thông qua việc gọi API.
2. **WebSocket & CDP**: CLI **BẮT BUỘC GỌI API** của Daemon để nhận về đường dẫn kết nối WebSocket, sau đó mới kết nối với trình duyệt thông qua `puppeteer-core`.
3. **Quản lý Tài nguyên an toàn**: Trách nhiệm dọn dẹp tiến trình và giải phóng bộ nhớ **BẮT BUỘC NẰM Ở DAEMON**. CLI chỉ đóng vai trò gửi tín hiệu yêu cầu đóng trình duyệt qua API.

## Lợi ích của kiến trúc này
1. **Kiến trúc phân tán**: BẮT BUỘC TÁCH BIỆT hoàn toàn giao diện dòng lệnh và trình quản lý tài nguyên.
2. **Độ ổn định**: Daemon chạy ngầm đảm bảo việc quản lý tiến trình trình duyệt an toàn hơn, không bị ngắt đột ngột khi lệnh CLI kết thúc.
3. **Bảo mật & Ẩn danh**: Việc khởi chạy từ tiến trình nền mô phỏng giống với hành vi của hệ điều hành hơn, giảm thiểu nguy cơ bị phát hiện.

## Phân biệt Chrome for Testing và Chromium nguyên bản
Từ phiên bản v114, Puppeteer mặc định tải về `Chrome for Testing`. Phiên bản này **BỊ GẮN CHẶT (hardcoded)** cảnh báo trên thanh tiêu đề và TUYỆT ĐỐI KHÔNG THỂ TẮT.
* **QUY TẮC**: Khi yêu cầu khởi chạy trình duyệt qua Daemon API, **BẮT BUỘC CHỈ ĐỊNH** sử dụng `chromium` nguyên bản. TUYỆT ĐỐI KHÔNG dùng phiên bản `Chrome for Testing` cho người dùng cuối.
