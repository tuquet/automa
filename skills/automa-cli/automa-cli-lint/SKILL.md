---
name: automa-cli-lint
description: Thông số kỹ thuật và các quy tắc để kiểm tra (lint) tính hợp lệ của tệp cấu hình Automa (Quy trình làm việc và Gói).
---

# Thông số Kỹ thuật Kiểm tra lỗi (Linter) cho Hệ sinh thái Automa

BẮT BUỘC TRIỂN KHAI các quy tắc cốt lõi của tính năng kiểm tra lỗi như được chỉ định dưới đây. Đây BẮT BUỘC là tiêu chuẩn cho dòng lệnh, VS Code Extension và các trình tự sửa lỗi tự động.

## 1. Kiểm tra cấu trúc (Structural Linting)
TUYỆT ĐỐI KHÔNG DÙNG các lệnh điều kiện thủ công. BẮT BUỘC DÙNG thư viện xác thực dựa trên **JSON Schema**.
- **Với Quy trình làm việc (Workflow):** BẮT BUỘC TẢI lược đồ chuẩn và xác thực dữ liệu.
- **Với Gói (Package):** BẮT BUỘC TẢI lược đồ cấu trúc Gói và xác thực.
- **Xử lý kết quả:** BẮT BUỘC TRÍCH XUẤT danh sách lỗi từ trình xác thực và chuẩn hóa thông báo đầu ra.

## 2. Chuẩn hóa Định danh (ID Validation)
BẮT BUỘC THỰC THI kiểm tra ngữ nghĩa khắt khe cho các trường định danh:
- **Độ dài:** BẮT BUỘC ĐÚNG 21 ký tự.
- **Ký tự cho phép:** BẮT BUỘC KHỚP định dạng tiêu chuẩn của NanoID (`A-Za-z0-9_-`).
- **Quy tắc Kiểm tra:** BẮT BUỘC QUÉT các mã định danh ở cấp cao nhất và bên trong tất cả các khối (nodes). BẮT BUỘC ĐÁNH DẤU lỗi nếu không khớp biểu thức chính quy.

## 3. Quản lý Biến (Semantic Variables Linting)
BẮT BUỘC TRIỂN KHAI logic kiểm tra các giá trị động:
- **Biến dùng ẩn:** BẮT BUỘC QUÉT cấu trúc bằng biểu thức chính quy để tìm các vị trí nội suy biến.
- **Biến khai báo:** BẮT BUỘC XÁC MINH các biến đã sử dụng có tồn tại trong cấu hình gốc hay không.
- **Quy tắc Kiểm tra:** BẮT BUỘC PHÁT RA cảnh báo nếu phát hiện một biến được sử dụng nhưng chưa từng được khai báo.

## 4. Hướng dẫn Tích hợp (Integration Guidelines)
- **Công cụ dòng lệnh (automa-cli):** BẮT BUỘC GỌI API CỦA DAEMON để yêu cầu kiểm tra cấu trúc và ngữ nghĩa. **TUYỆT ĐỐI KHÔNG** tự xử lý nặng ở phía máy khách nếu thuộc thẩm quyền của nền tảng. BẮT BUỘC TRẢ VỀ mã thoát chuẩn (0 nếu đạt, 1 nếu thất bại).
- **Trình soạn thảo VS Code (automa-vscode):** BẮT BUỘC GỌI API CỦA DAEMON để lấy danh sách lỗi. **TUYỆT ĐỐI KHÔNG** sử dụng `child_process` để gọi lệnh CLI chạy ngầm nhằm tránh xung đột tài nguyên. BẮT BUỘC HIỂN THỊ kết quả trực tiếp vào bảng phân tích lỗi (Diagnostics) của trình soạn thảo.
