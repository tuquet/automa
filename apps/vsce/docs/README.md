# 📚 Tài Liệu Hướng Dẫn Automa VS Code Extension

> [!IMPORTANT]
> ### 🔗 Automa Core Daemon API Reference (`http://127.0.0.1:8765`)
> Tài liệu OpenAPI trực tiếp có thể truy cập tại: [`http://127.0.0.1:8765/api-docs/openapi.json`](http://127.0.0.1:8765/api-docs/openapi.json) hoặc giao diện Swagger UI tại [`http://127.0.0.1:8765/swagger-ui`](http://127.0.0.1:8765/swagger-ui).
> Mỗi tài liệu chi tiết dưới đây đều có khối **Core Daemon API Endpoints** ở đầu trang để bạn dễ dàng đối chiếu.

---

## 🧭 1. Các Panel Thanh Bên (Sidebar Panels)

Các Panel xuất hiện tại thanh Activity Bar (thanh bên chính của VS Code):

| Panel | Tài Liệu Hướng Dẫn | Endpoints Chính | Thành Phần Kỹ Thuật (Provider & Panel) |
| :--- | :--- | :--- | :--- |
| **Panel `BROWSERS`** | [🌐 Quản lý Trình duyệt & Proxy](panels/01-browsers-panel.md) | `GET/POST /api/browsers`<br>`POST/DELETE /api/browsers/{id}/session` | [`BrowsersTreeDataProvider.ts`](../src/providers/BrowsersTreeDataProvider.ts)<br>[`BrowserEditorProvider.ts`](../src/providers/BrowserEditorProvider.ts) |
| **Panel `WORKSPACE`** | [📁 Quản lý Cây Thư Mục & Vault](panels/02-workspace-panel.md) | `GET/POST /api/storage/variables`<br>`GET/POST /api/storage/credentials` | [`WorkspaceTreeDataProvider.ts`](../src/providers/WorkspaceTreeDataProvider.ts)<br>[`StorageTreeDataProvider.ts`](../src/providers/StorageTreeDataProvider.ts) |
| **Panel `HISTORY`** | [📊 Bảng Dashboard & Lịch Sử Chạy](panels/03-history-dashboard-panel.md) | `GET /api/jobs`<br>`GET /api/history`<br>`GET /api/events` (SSE) | [`WorkspaceTreeDataProvider.ts`](../src/providers/WorkspaceTreeDataProvider.ts)<br>[`LiveLogPanel.ts`](../src/panels/LiveLogPanel.ts) |

---

## 🎨 2. Trình Soạn Thảo Trực Quan (Custom Editor Webviews)

Các giao diện mở trên tab chính của VS Code khi bạn mở tệp cấu hình:

| Custom Editor | Tệp Áp Dụng | Tài Liệu Hướng Dẫn | Endpoints Chính | Thành Phần Kỹ Thuật |
| :--- | :--- | :--- | :--- | :--- |
| **Workflow Editor** | `*.workflow.json`<br>`*.package.json` | [🎨 Trình xem Workflow](editors/01-workflow-preview.md) | `POST /api/jobs`<br>`POST /api/system/studio/session` | [`WorkflowEditorProvider.ts`](../src/providers/WorkflowEditorProvider.ts)<br>[`WebviewHtmlResolver.ts`](../src/core/webview/WebviewHtmlResolver.ts) |
| **Campaign Matrix** | `*.campaigns.json` | [🚀 Trình quản lý Campaign Matrix](editors/02-campaign-matrix.md) | `POST /api/jobs`<br>`GET /api/browsers` | [`CampaignEditorProvider.ts`](../src/providers/CampaignEditorProvider.ts) |
| **Browser Profile** | `*.browser.json` | [🌐 Trình chỉnh sửa Browser Profile](editors/03-browser-profile-editor.md) | `PUT /api/browsers/{id}`<br>`POST /api/browsers/{id}/session` | [`BrowserEditorProvider.ts`](../src/providers/BrowserEditorProvider.ts) |
| **Live Log Viewer** | `*automa-log.json`<br>(SSE Stream) | [📜 Trình xem Log Thời gian thực](editors/04-live-log-viewer.md) | `GET /api/events` (SSE)<br>`GET /api/history/{id}/logs` | [`LogEditorProvider.ts`](../src/providers/LogEditorProvider.ts)<br>[`LiveLogPanel.ts`](../src/panels/LiveLogPanel.ts) |

---

## ⚙️ 3. Dịch Vụ Nền Tảng (Core Services & Engine)

| Tính Năng | Tài Liệu Hướng Dẫn | Endpoints Chính |
| :--- | :--- | :--- |
| **Linter Diagnostics** | [🩺 Linter Schema & Auto-Sanitize](features/06-linter-diagnostics.md) | `POST /api/lint` |
| **Global Vault** | [🔐 Quản lý Bí mật & SQLite Storage](features/05-global-vault.md) | `POST /api/secrets/encryption`<br>`GET/POST/DELETE /api/storage/*` |
| **Workflow Engine** | [⚡ Cơ chế Thực thi Kịch bản](features/02-workflow-execution.md) | `POST /api/jobs`<br>`PATCH /api/jobs/{id}/status`<br>`DELETE /api/jobs/{id}` |

---

## 🧪 4. Kiểm Thử & Ma Trận Đảm Bảo Chất Lượng (Test Matrix & QA)

| Tài Liệu | Nội Dung Chi Tiết | Số Lượng Tests | Runner |
| :--- | :--- | :--- | :---: |
| [📊 **Ma Trận Kiểm Thử automa-vsce**](TEST_MATRIX.md) | Chi tiết 23 test suites, 107 test cases, 6 tầng kiến trúc, mocking strategy và hướng dẫn gỡ lỗi. | **107/107 Tests** | Vitest + Playwright |
| [🌐 **Ma Trận Hệ Sinh Thái Chung**](../../../docs/TEST_MATRIX.md) | Tổng quan kiểm thử toàn hệ sinh thái (Rust Core, VS Code, Web Studio, Root E2E). | **Toàn diện** | Multi-runner |

