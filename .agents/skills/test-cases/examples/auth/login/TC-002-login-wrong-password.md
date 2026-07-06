---
id: TC-002
module: auth/login
type: functional
priority: critical
referer: https://your-jira.com/browse/TC-002
---

# TC-002: Đăng nhập thất bại với password sai

## Mục tiêu
Kiểm tra phản hồi của hệ thống khi người dùng nhập email đúng nhưng password sai.

## Tiền điều kiện (Pre-conditions)
- Người dùng `user@example.com` đã tồn tại với password `Pass1234`.
- Trang đăng nhập đã được load xong.

## Các bước thực hiện

| Bước | Hành động | Kết quả mong đợi |
|:---|:---|:---|
| 1 | Nhập email `user@example.com` | Giá trị hiển thị đúng |
| 2 | Nhập password sai `WrongPass` | Hiển thị ký tự ẩn |
| 3 | Click nút "Đăng nhập" | Hiển thị message lỗi "Email hoặc mật khẩu không đúng" |
| 4 | Kiểm tra URL hiện tại | URL vẫn ở trang login, không redirect sang dashboard |

## Ghi chú
- Kiểm tra sau 3 lần sai liên tiếp: hệ thống có khóa tài khoản không?
- Không hiển thị chi tiết sai email hay sai password để tránh lộ thông tin.