---
title: Security & Cryptography
date: 2026-08-05
tags:
  - security
  - encryption
  - credentials
  - aes
  - hmac
  - globals
---

# Bảo mật & Mã hóa (Security & Cryptography)

> [!info]
> Hệ thống quản lý dữ liệu nhạy cảm (Credentials, Tokens, Passwords) trong Automa Ecosystem được thiết kế để không bao giờ lưu trữ dạng Text rõ ràng (Plain Text) trên ổ cứng của Vault.

## Cơ chế Mã hóa (Encryption Logic)

Automa Extension gốc sử dụng chuẩn mã hóa **AES-256-GCM** (Hoặc AES + HMAC-SHA256 kết hợp) để bảo vệ dữ liệu trong IndexedDB. Automa CLI kế thừa và tương thích 100% với luồng thuật toán này thông qua thư viện `crypto-js`.

1. **Sinh Cipher Text**: `AES.encrypt(plaintext, passphrase)`
2. **Sinh HMAC**: `HmacSHA256(encryptedValue, SHA256(passphrase))`
3. **Đóng gói**: Ghép chuỗi `hmac + encryptedValue`. Khối 64 ký tự đầu tiên luôn luôn là chữ ký HMAC để xác thực tính toàn vẹn (Integrity).

### Quản lý Passphrase
- Passphrase là chìa khóa duy nhất để giải mã.
- CLI sẽ KHÔNG lưu Passphrase vào ổ cứng. Người dùng phải thiết lập qua biến môi trường `AUTOMA_PASSPHRASE`, truyền qua cờ `--passphrase`, hoặc nhập tay dạng mật khẩu ẩn trong Terminal khi chạy lệnh.

## Lệnh thao tác bí mật
Sử dụng lệnh sau để mã hóa một cách an toàn (yêu cầu nhập từ Stdin hoặc prompt ẩn):
```bash
cargo run --bin automa-core encrypt-secret --name "GithubToken" --stdin
```
Kết quả thu được sẽ được tự động ghi vào Globals Vault (thư mục `globals/credentials.json`) bên trong Vault. File này có thể được chia sẻ, đẩy lên Git (nếu muốn), vì bên trong nó chỉ chứa các chuỗi hash không thể dịch ngược.

## Cơ chế Giải mã (Decryption) ở Runtime
Automa Core (**Rust Daemon**) **KHÔNG** tự giải mã bí mật. 
Thay vào đó, nó tận dụng cơ chế **Globals Vault Injection** của `ExecutionManager`:
- Khi chạy Workflow, `ExecutionManager` đọc file `credentials.json` (toàn là chuỗi mã hóa).
- Truyền nguyên cục mã hóa này vào Background Script của Extension qua API hoặc qua thao tác chèn thẳng vào Web Storage.
- Khi Workflow chạy, Extension sẽ trích xuất Passphrase nội tại của nó (hoặc do người dùng đã config) để giải mã ngay trên RAM của trình duyệt. 
- Lợi ích: Tiến trình chạy bên ngoài (Rust Daemon) không bao giờ chạm tay vào bản rõ của mật khẩu.
