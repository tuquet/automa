---
name: automa-vault
description: Hướng dẫn cấu trúc thư mục Storage Workspace, file cấu hình Campaigns và đặc tả Workflow & Browser Mapping cho automa-vault.
---

# Automa Storage Workspace (automa-vault) & Campaign Mapping Convention

> [!NOTE]
> **Phân Định Ngữ Nghĩa**:
> - **Storage Workspace (`automa-vault`)**: Thư mục chứa các tệp kịch bản (`workflows/`), ma trận chiến dịch (`campaigns/`), và cấu hình trình duyệt (`browsers/`).
> - **Global Storage**: Cơ sở dữ liệu nghiệp vụ của Automa (Tables, Variables, Credentials) lưu trong SQLite.

---

## 1. Cấu trúc thư mục Campaigns

* **BẮT BUỘC** đặt tất cả tệp cấu hình campaigns trong thư mục `campaigns/` của project tương ứng (ví dụ: `automa-vault/{project}/campaigns/`).
* **BẮT BUỘC** tạo file mẫu `demo.campaigns.json` cho mỗi dự án.

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

## 2. Campaign Workflow & Browser Mapping Specification

Campaign Visual Editor ánh xạ Workflow local và Browser cho Campaign Tasks.

### 2.1 Backend (VS Code Extension Provider - `CampaignPreviewEditorProvider.ts`)
* **BẮT BUỘC** tự động quét workspace tìm `**/*.browser.json` và `**/*.workflow.json`.
* **BẮT BUỘC** trích xuất `id` và `name` độc bản.
* **BẮT BUỘC** truyền dictionary vào Webview qua `postMessage({ type: 'update', text, workflows, browsers })`.

### 2.2 Frontend (Webview UI - Thin Client)
* **TUYỆT ĐỐI KHÔNG** sử dụng Vue/React hay Webpack cho Webview UI trong VS Code.
* **BẮT BUỘC** dùng HTML/JS tĩnh thuần túy (Vanilla JS) để nhận dữ liệu từ Backend.
* **BẮT BUỘC** hiển thị `<select>` dropdown chứa `browsers` tại Browser header và tự động cập nhật `browser.browser_id`.
* **BẮT BUỘC** hiển thị `<select>` dropdown chứa `workflows` tại Task card và cập nhật `task.workflow_id`.
* **BẮT BUỘC** cảnh báo ID thiếu bằng tiền tố `[Missing]` hoặc `[Unknown]` trong dropdown.

### 2.3 Demo Browsers (`automa-vault/browsers/`)
Tệp browser mẫu được lưu trữ tại `automa-vault/browsers/`:
- `marketing-browser-01.browser.json`
- `accounting-browser-02.browser.json`

Format chuẩn của một `.browser.json`:
```json
{
  "id": "accounting-browser-02",
  "name": "Accounting Browser",
  "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)...",
  "timezone": "Asia/Ho_Chi_Minh"
}
```

* **BẮT BUỘC** sử dụng biến màu chuẩn VS Code (`var(--vscode-dropdown-background)`).
* **BẮT BUỘC** kích hoạt nút "Save Campaign" khi có thay đổi.

---

## 3. Global Storage (Variables, Credentials, Tables)

Global Storage sử dụng kiến trúc phi tập trung (Decentralized Vault).
Daemon nạp tổng thể (`loadAll()`) **BẮT BUỘC** tuân thủ quy tắc đuôi mở rộng:
- **Workflow:** `**/*.workflow.json`
- **Packages:** `**/*.package.json`
- **Biến (Variables):** `**/*.variables.json` hoặc `**/*.variable.json`
- **Thông tin xác thực (Credentials):** `**/*.credential.json`
- **Bảng dữ liệu (Tables):** `**/*.table.json`

### 3.1 Cấu trúc file `*.table.json`
**BẮT BUỘC** tuân thủ schema JSON sau cho Table:

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
