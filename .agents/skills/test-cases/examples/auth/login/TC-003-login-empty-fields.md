---
id: TC-003
module: auth/login
type: functional
priority: high
referer: https://your-jira.com/browse/TC-003
---

# TC-003: Đăng nhập thất bại khi để trống các trường

## Mục tiêu
Kiểm tra validation của form login khi người dùng để trống bắt buộc.

## Tiền điều kiện (Pre-conditions)
- Trang đăng nhập đã được load xong.

## Các bước thực hiện

| Bước | Hành động | Kết quả mong đợi |
|:---|:---|:---|
| 1 | Để trống cả Email và Password | Các ô input trống |
| 2 | Click nút "Đăng nhập" | Hiển thị message "Vui lòng nhập email" tại ô Email và "Vui lòng nhập mật khẩu" tại ô Password |
| 3 | Nhập email `user@example.com`, để trống password | Ô Email hiển thị giá trị |
| 4 | Click nút "Đăng nhập" | Hiển thị message "Vui lòng nhập mật khẩu" tại ô Password |
| 5 | Xóa email, nhập password `Pass1234` | Ô Email trống, ô Password hiển thị ký tự ẩn |
| 6 | Click nút "Đăng nhập" | Hiển thị message "Vui lòng nhập email" tại ô Email |

## Ghi chú
- Kiểm tra cả trường hợp nhập toàn khoảng trắng (spaces) — hệ thống có trim() không?
- Message lỗi nên rõ ràng cho từng field, không gộp chung.