---
name: automa-release
description: Upload automa to Supabase Storage and push DB migrations to Supabase Cloud for production release.
---

# Automa Release Protocol

Whenever the user asks you to "release to production", "upload extension", or "push to cloud", you must strictly follow this protocol.

## Step 1: Cập nhật Version (Version Bump)
Trước khi release, bạn **phải** tăng version cho Extension để tránh trùng lặp và giúp hệ thống cập nhật hoạt động đúng.
Thực hiện tăng version bằng lệnh `npm version` (chọn patch, minor hoặc major tùy tình hình) ở thư mục `automa`:
```bash
cd automa
npm version patch
```

## Step 2: Run the automated release script
A script has been provided to automatically build the extension, zip it, and upload it to Supabase Storage.
You must run it using the `run_command` tool.

**Command:**
```bash
node docs/skills/automa-release/scripts/release.js
```
*Note: Make sure to run this command from the workspace root. The script uses the native Supabase CLI and relative paths to avoid Windows path issues.*

## Step 2: Push Supabase Database & Edge Functions (Cloud)
To push backend changes to the production Supabase cloud:
1. Ensure the CLI is linked to the production project ID. If the user hasn't specified it, ask for the Project ID.
   ```bash
   cd automa-be
   supabase link --project-ref <PROJECT_ID>
   ```
2. Cập nhật Database & Edge Functions. Có 2 trường hợp:
   - **Trường hợp thông thường**: Chỉ push migrations và deploy functions
     ```bash
     supabase db push
     supabase functions deploy
     ```
   - **Trường hợp thay đổi Database lớn (như thêm mã hóa Credentials, đổi kiểu ID) và người dùng yêu cầu Xóa/Reset**:
     Tiến hành reset trắng DB trên Cloud bằng cờ `--linked` và `--yes`:
     ```bash
     supabase db reset --linked --yes
     supabase functions deploy
     ```
     *Lưu ý: Nếu gặp lỗi "relation supabase_functions.hooks_id_seq does not exist", hãy mở file `automa-be/supabase/seed.sql` và loại bỏ các dòng chèn dữ liệu vào schema `supabase_functions` và `auth` trước khi chạy lệnh reset.*

## Step 3: Verify the Release
After the upload and push are successful:
- Confirm with the user that the extension was uploaded.
- Remind the user that `download-extension` Edge Function will now correctly serve the latest `.zip` file from the `release` storage bucket.
