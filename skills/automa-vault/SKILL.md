---
name: automa-vault
description: Hướng dẫn cấu trúc thư mục, file cấu hình Campaigns và đặc tả Workflow & Browser Profile Mapping cho automa-vault.
---

# Automa Vault Campaigns & Profile Mapping Convention

Tài liệu này quy định quy chuẩn cấu trúc thư mục Campaigns trong `automa-vault` và đặc tả kiến trúc **Workflow & Browser Profile Mapping** trong Campaign Editor.

---

## 1. Cấu trúc thư mục Campaigns

Tất cả các tệp liên quan đến cấu hình của campaigns phải được đặt trong thư mục `campaigns/` nằm bên trong từng project cụ thể.
Ví dụ: `automa-vault/{project}/campaigns/`

### File cấu hình mẫu (`demo.campaigns.json`)
Mỗi dự án cần đi kèm một file mẫu `demo.campaigns.json` để minh họa cấu trúc của một campaign.

```json
{
  "name": "Demo Campaign",
  "version": "1.0.0",
  "description": "Cấu trúc mẫu cho một Automa Campaign",
  "workflows": [
    {
      "id": "wf-1",
      "name": "Sample Workflow"
    }
  ]
}
```

---

## 2. Campaign Workflow & Browser Profile Mapping Specification

Campaign Visual Editor hỗ trợ ánh xạ (mapping) và gán trực tiếp các Workflow local và Browser Profile cho Campaign Members và Tasks.

### 2.1 Backend (VS Code Extension Provider - `CampaignPreviewEditorProvider.ts`)
- **Profile & Workflow Scanning**: Tự động quét workspace tìm các file `**/*.profile.json`, `**/*.profile.json` và `**/*.automa.json`.
- **Dictionary Generation**: Trích xuất `id` và `name` độc bản (fallback về tên file nếu thiếu `name`).
- **Data Injection**: Truyền hai dictionary `workflows` và `profiles` vào Webview qua thông điệp `postMessage({ type: 'update', text, workflows, profiles })`.

### 2.2 Frontend (Webview UI - Vue 3)
- **Profile Dropdown**: Tại Member header, hiển thị `<select>` dropdown chứa danh sách `profiles`. Khi thay đổi, tự động cập nhật `member.browser_id` và đánh dấu document đã sửa.
- **Workflow Dropdown**: Tại Task card, hiển thị `<select>` dropdown chứa danh sách `workflows`. Khi thay đổi, cập nhật `task.workflow_id`.
- **Fallback Handling**: Nếu Campaign JSON chứa ID không còn tồn tại trong workspace local (ví dụ: file đã bị xóa), dropdown tự động hiển thị tiền tố `[Missing]` hoặc `[Unknown]` để cảnh báo người dùng mà không làm mất dữ liệu gốc.

### 2.3 Demo Profile Targets (`automa-vault/profiles/`)
Tệp profile mẫu được lưu trữ tại `automa-vault/profiles/`:
- `marketing-profile-01.profile.json`
- `accounting-profile-02.profile.json`

Format chuẩn của a `.profile.json`:
```json
{
  "id": "accounting-profile-02",
  "name": "Accounting Profile",
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
  "timezone": "Asia/Ho_Chi_Minh"
}
```

- Cửa sổ điều khiển và dropdown sử dụng biến màu chuẩn VS Code (như `var(--vscode-dropdown-background)`).
- Mọi thao tác thay đổi lập tức kích hoạt nút "Save Campaign".

---

## 3. Global Vault (Variables, Credentials, Tables)

Global Vault sử dụng kiến trúc phi tập trung (Decentralized Vault) trên toàn bộ Workspace, cho phép người dùng tổ chức dữ liệu một cách linh hoạt (ví dụ: đặt file `leads.table.json` nằm ngay cùng thư mục với `marketing.automa.json`).

VS Code Extension (`VaultTreeDataProvider`) và Automa CLI sử dụng cơ chế quét đệ quy (Decentralized Scanning) thông qua `vscode.workspace.findFiles` hoặc `findWorkflowRecursive()` (chấp nhận mọi file `*.json` hoặc `*.automa.json` với CLI thường). 
Tuy nhiên, đối với Daemon nạp tổng thể Global Vault (`loadAll()`), bắt buộc phải tuân thủ chuẩn quy tắc đuôi mở rộng (suffix) sau để nhận diện thành phần:
- **Workflow:** Tất cả các file `**/*.workflow.json` (Hệ thống tự nhận diện không cần nhét cứng vào thư mục root `workflows/`)
- **Packages:** Tất cả các file `**/*.package.json`
- **Biến (Variables):** Tất cả các file `**/*.variables.json` hoặc `**/*.variable.json`
- **Thông tin xác thực (Credentials):** Tất cả các file `**/*.credential.json`
- **Bảng dữ liệu (Tables):** Tất cả các file `**/*.table.json`

### 3.1 Cấu trúc file `*.table.json`
Đặc tả schema JSON bắt buộc cho một Table để đảm bảo tính tương thích giữa `automa-vscode` (khởi tạo) và `automa-cli` (thực thi) cũng như Automa Extension.

```json
[
  {
    "id": "table_1234abcd",
    "name": "My Table",
    "columns": [],
    "items": [],
    "columnsIndex": {},
    "createdAt": 1691234567890,
    "modifiedAt": 1691234567890
  }
]
```

**Chi tiết trường dữ liệu:**
- `id`: Định danh duy nhất (có thể là chuỗi string UUID/random hoặc số nguyên).
- `name`: Tên bảng hiển thị.
- `columns`: (Mảng) Định nghĩa các cột.
- `items`: (Mảng) Chứa các hàng dữ liệu (rows).
- `columnsIndex`: (Object) Tra cứu ID cột.
- `createdAt` / `modifiedAt`: (Timestamp) Thời gian khởi tạo/cập nhật.

