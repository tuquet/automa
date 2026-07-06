---
id: TC-001
module: auth/login
type: functional
priority: critical
referer: https://your-jira.com/browse/TC-001
---

# TC-001: Đăng nhập thành công với thông tin hợp lệ

## Mục tiêu
Kiểm tra luồng đăng nhập thành công khi người dùng nhập đúng email và password.

## Tiền điều kiện (Pre-conditions)
- Người dùng đã tồn tại trong hệ thống (email: user@example.com, password: Pass1234).
- Trang đăng nhập đã được load xong.

## Các bước thực hiện

| Bước | Hành động | Kết quả mong đợi |
|:---|:---|:---|
| 1 | Nhập email hợp lệ vào ô Email | Giá trị hiển thị đúng `user@example.com` |
| 2 | Nhập password đúng vào ô Password | Hiển thị ký tự ẩn (`*`) |
| 3 | Click nút "Đăng nhập" | Chuyển hướng tới trang Dashboard |
| 4 | Kiểm tra header Dashboard | Hiển thị tên người dùng hoặc nút Logout |

## Ghi chú
- Thời gian phản hồi API phải dưới 2s.
- Nếu có 2FA, test case này chưa cover — cần TC riêng cho 2FA.