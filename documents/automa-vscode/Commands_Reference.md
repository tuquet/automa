---
title: Automa VS Code Extension - Commands Reference
date: 2026-08-05
tags:
  - vscode
  - commands
  - reference
---

# Automa CLI Toolkit — Commands Reference

Tài liệu này tổng hợp toàn bộ các lệnh (commands) được cung cấp bởi **Automa CLI Toolkit** (`automa-vscode`). Các lệnh này giúp bạn tương tác với các workflow, fleet, log và quản lý tiến trình thực thi trực tiếp từ VS Code.

---

## 1. Commands thực thi (Execution)

### 1.1 Automa: Run Workflow (`automa.runWorkflow`)
- **Icon**: ▶
- **Vị trí**: Explorer Context Menu (click chuột phải vào file `.automa.json`), Editor Title Run.
- **Mô tả**: Thực thi ngay một file workflow từ VS Code.
- **Hành vi**:
  - Tự động lấy các thiết lập từ VS Code Settings (như `--headless`, `--debug`, v.v.).
  - Nếu workflow có tham số (và setting `useDefaultParameters` tắt), VS Code sẽ hiện hộp thoại Prompt để nhập từng tham số.
  - Khi chạy, một tiến trình ngầm sẽ hiển thị trên Status Bar (`⟳`) và trong View `Runners`.
  - Hỗ trợ fallback: Tự động dùng CLI cục bộ (nếu có) hoặc tải qua npx nếu không tìm thấy.

### 1.2 Automa: Run Fleet (`automa.runFleet`)
- **Icon**: ▶
- **Vị trí**: Explorer Context Menu (click chuột phải vào file `.fleets.json`), Editor Title Run.
- **Mô tả**: Khởi chạy toàn bộ Fleet — thực thi song song hoặc theo hàng đợi.
- **Hành vi**:
  - Mở một QuickPick với 2 tuỳ chọn:
    - **▶ Run Now**: Chạy fleet ngay lập tức (bỏ qua cron schedule).
    - **🕐 Start Daemon**: Chạy fleet dưới dạng daemon, chờ các task chạy theo lịch trình.
  - Trạng thái thực thi được truyền (stream) thời gian thực về giao diện Fleet Preview qua luồng telemetry.

### 1.3 Kill / Stop Runner (`automa.killRunner`)
- **Icon**: 🛑
- **Vị trí**: Inline trong view **Runners** (Activity Bar).
- **Mô tả**: Dừng (kill) tiến trình runner đang chạy.
- **Hành vi**: Gửi tín hiệu để kết thúc an toàn tiến trình đang thực thi workflow hoặc fleet.

---

## 2. Commands tiện ích & Công cụ (Utilities)

### 2.1 Automa: Auto-Fix Workflow ID (`automa.fixWorkflowId`)
- **Icon**: 🔧
- **Vị trí**: Explorer Context Menu (cho các file JSON).
- **Mô tả**: Tự động sửa/cấp mới NanoID 21 ký tự cho các file workflow có ID (của file hoặc node) không hợp lệ. Rất hữu ích khi import workflow từ các phiên bản Automa cũ.

### 2.2 Automa: Lint Check Workflow (`automa.lintCheck`)
- **Icon**: ☑️
- **Vị trí**: Explorer Context Menu.
- **Mô tả**: Chạy linter kiểm tra tính hợp lệ của workflow theo quy chuẩn Automa.
- **Hành vi**: 
  - Lỗi hoặc cảnh báo được xuất thẳng ra panel **Problems** của VS Code (`Ctrl+Shift+M`).
  - Phân loại lỗi (Ví dụ: sai NanoID là Error, biến chưa khai báo là Warning).

### 2.3 Open in Studio (`automa.openInStudio`)
- **Icon**: 🔗
- **Vị trí**: Workflow Preview Toolbar.
- **Mô tả**: Mở workflow hiện tại trên giao diện kéo thả Automa Extension Studio ngay trong trình duyệt.

### 2.4 Automa: Encrypt Secret (`automa.vault.encryptSecret`)
- **Vị trí**: Command Palette (`Ctrl+Shift+P`).
- **Mô tả**: Mã hoá thông tin nhạy cảm trước khi lưu vào Automa Vault.

---

## 3. Commands giao diện Editor (UI & Previews)

Các lệnh này chủ yếu dùng để chuyển đổi (toggle) giữa chế độ xem trực quan (Preview) và chế độ xem mã nguồn JSON.

| Command ID | Tiêu đề hiển thị | Icon | Ngữ cảnh sử dụng |
| :--- | :--- | :--- | :--- |
| `automa.showWorkflowPreview` | Preview Workflow | 👁 | Xem trực quan file `*.automa.json` |
| `automa.showWorkflowSource` | Show Workflow Source | `</>` | Quay lại mã nguồn khi đang ở Workflow Preview |
| `automa.showFleetPreview` | Preview Fleet | 👁 | Xem trực quan file `*.fleets.json` |
| `automa.showFleetSource` | Show Fleet Source | `</>` | Quay lại mã nguồn khi đang ở Fleet Preview |
| `automa.showLogPreview` | Open Preview | 👁 | Mở Log Viewer qua Virtual URI (`automa-log://`) hoặc file `*.automa-log.json` |
| `automa.showLogSource` | Show Source | `</>` | Xem nội dung thô khi đang ở Log Viewer |

---

## 4. Commands cho Views trong Activity Bar

Các lệnh này nằm ở thanh tiêu đề (View Title) của các tab bên trong Activity Bar.

- **`automa.refreshRunners`**: (🔄) Cập nhật lại danh sách các runners đang hoạt động.
- **`automa.refreshHistory`**: (🔄) Cập nhật lại danh sách lịch sử thực thi.
- **`automa.searchProfiles`** / **`automa.clearSearchProfiles`**: (🔍 / 🧹) Tìm kiếm và xóa bộ lọc trong view **Profiles**.
- **`automa.searchWorkflows`** / **`automa.clearSearchWorkflows`**: (🔍 / 🧹) Tìm kiếm và xóa bộ lọc trong view **Workflows**.
- **`automa.searchPackages`** / **`automa.clearSearchPackages`**: (🔍 / 🧹) Tìm kiếm và xóa bộ lọc trong view **Packages**.
- **`automa.searchFleets`** / **`automa.clearSearchFleets`**: (🔍 / 🧹) Tìm kiếm và xóa bộ lọc trong view **Fleets**.
- **`automa.filterHistoryByTaskId`** / **`automa.clearHistoryFilter`**: (🔍 / 🧹) Lọc và xóa bộ lọc theo Task ID trong view **History**.
- **`automa.deleteHistoryItem`**: (🗑️) Xóa một mục lịch sử thực thi cụ thể.
- **`automa.clearHistory`**: (🗑️) Xóa toàn bộ lịch sử thực thi.

> [!TIP]
> Bạn không cần phải Refresh các view hiển thị file, do extension sử dụng `FileSystemWatcher` để tự động làm mới danh sách khi file có sự thay đổi.
