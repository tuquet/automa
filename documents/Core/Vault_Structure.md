---
title: Automa Vault Structure
date: 2026-08-05
tags:
  - architecture
  - vault
  - storage
  - globals
  - Campaigns
  - profiles
  - workflows
---

# Cấu trúc Automa Vault

Automa Vault là một thư mục được cấu trúc chặt chẽ, đóng vai trò như một kho lưu trữ tập trung (Single Source of Truth) cho toàn bộ cấu hình, kịch bản, và dữ liệu của Automa Ecosystem.

## 📂 Tổ chức thư mục chuẩn

Một Automa Vault tiêu chuẩn sẽ bao gồm các thư mục chính sau:

```tree
automa-vault/
├── workflows/         # Chứa kịch bản tự động hóa (.automa.json, .workflow.json)
├── profiles/          # Chứa cấu hình trình duyệt (.profile.json)
├── Campaigns/            # Chứa kịch bản điều phối song song (.Campaigns.json)
├── globals/           # [NEW] Chứa dữ liệu dùng chung toàn cục
│   ├── variables.json
│   ├── credentials.json
│   └── tables.json
```

## 1. Workflows (`workflows/`)
- Mở rộng tệp: `.automa.json` (Định dạng cũ xuất từ Automa Studio) hoặc `.workflow.json` (Định dạng chuẩn hóa).
- **Quy tắc Linter**: 
  - Phải chứa ID, Name, Icon.
  - Các node phải có ID (`nanoid`) và loại hợp lệ (ví dụ: `BlockBasic`, `execute-workflow`).
  - Linter sẽ đệ quy vào các thư mục con để tìm kiếm khi phân giải Dependency (ví dụ: node `execute-workflow`).

## 2. Browser Profiles (`profiles/`)
- Mở rộng tệp: `.profile.json`
- Quản lý metadata và cấu hình riêng biệt cho từng hồ sơ trình duyệt.
- Dữ liệu duyệt web (Cookies, LocalStorage) sẽ được lưu tương ứng trong `~/.automa-cli/profiles/<profile_id>`.

## 3. Campaign Configurations (`Campaigns/`)
- Mở rộng tệp: `.Campaigns.json`
- Cho phép định nghĩa một "Hạm đội" (Campaign) các trình duyệt chạy song song.
- Trong Campaign, mỗi `task_id` đóng vai trò là một định danh tĩnh (Static ID) để quản lý luồng thực thi và sự phụ thuộc (`depends_on`).

## 4. Globals (`globals/`)
Đây là khu vực chia sẻ dữ liệu toàn cục cho toàn bộ Campaign và Workflows. `ExecutionManager` sẽ tự động tiêm (inject) dữ liệu từ đây vào Runtime trước khi chạy.

- **`variables.json`**: Các biến cấu hình dùng chung (ví dụ: `API_URL`, `TIMEOUT`).
- **`credentials.json`**: Chứa các bí mật (Secrets, Tokens) **đã được mã hóa** bằng lệnh `automa encrypt-secret`. Nội dung mã hóa (AES-256-GCM + HMAC-SHA256) sẽ được nạp thẳng vào IndexedDB (`dbStorage.credentials`) của Extension, giúp các node như HTTP Request hay Form Authentication hoạt động trong suốt mà không lộ mật khẩu.
- **`tables.json`**: (Dự kiến) Lưu trữ dữ liệu dạng bảng chia sẻ.

## 🔗 Liên kết liên quan
- [[Linter_Engine]] - Cơ chế kiểm tra chéo sự tồn tại của file trong Vault.
- [[Security_Cryptography]] - Cơ chế mã hóa file `credentials.json`.
