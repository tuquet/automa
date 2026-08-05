---
title: Sidebar Views
date: 2026-08-05
tags:
  - vscode
  - feature
  - activity-bar
  - tree-view
---

# Sidebar Views

## Tổng quan
Extension đăng ký một Activity Bar với các Panel View nằm ở Sidebar bên trái, cung cấp trung tâm điều khiển (Control Center) cho toàn bộ hệ sinh thái Automa. Các View bao gồm: Runners, Profiles, Workflows, Packages, và Fleets.

## Kiến trúc Implementation
File nguồn chính:
- [[AutomaFilesProvider.ts]] (`src/providers/AutomaFilesProvider.ts`)
- [[RunnersTreeDataProvider.ts]] (`src/providers/RunnersTreeDataProvider.ts`)
- [[HistoryTreeDataProvider.ts]] (`src/providers/HistoryTreeDataProvider.ts`)

Cả hai lớp này đều implements interface `vscode.TreeDataProvider`.

### 1. File Browsing Views (AutomaFilesProvider)
Class `AutomaFilesProvider` được khởi tạo nhiều lần cho các View khác nhau (Workflows, Packages, Profiles, Fleets), mỗi instance sử dụng một `globPattern` riêng biệt.

- **Workspace Scanning:** Sử dụng `vscode.workspace.findFiles` theo pattern (vd: `**/*.automa.json`) để liệt kê tài nguyên.
- **Lọc (Filtering):**
  - Vì Workflow và Package đều dùng chung phần mở rộng `.automa.json`, Provider đọc nội dung JSON (file-system readSync) để kiểm tra thuộc tính `settings.asBlock === true` hoặc tồn tại `inputs/outputs`.
  - Từ đó tách biệt danh sách cho View "Workflows" (loại trừ package) và View "Packages" (chỉ lấy package).
- **Tìm kiếm (Search):**
  - Cung cấp hàm `setSearchQuery` được gọi từ nút Search trên View Header.
  - Lọc kết quả cây ngay trong hàm `getChildren()` và sử dụng `vscode.commands.executeCommand('setContext', ...)` để hiển thị hoặc ẩn nút "Clear Search".
- **TreeItem Config:**
  - `command`: Trỏ về lệnh mặc định `vscode.open` để khi click item, VS Code sẽ mở file và kích hoạt Custom Visual Editor tương ứng.
  - `description`: Hiển thị đường dẫn thư mục cha để dễ nhận biết nếu có nhiều file trùng tên.

### 2. Runners View (RunnersTreeDataProvider)
Class `RunnersTreeDataProvider` theo dõi và điều khiển các tác vụ thực thi ngầm (Tasks).

- **Task Monitoring:**
  - Lắng nghe `vscode.tasks.onDidStartTask` và `vscode.tasks.onDidEndTask`.
  - Quét `vscode.tasks.taskExecutions` để chỉ lấy các task có `.source` bắt đầu bằng "Automa".
- **Badge Cập nhật tự động:**
  - Gắn badge (hiển thị số lượng) vào tiêu đề View, cho người dùng biết có bao nhiêu runner đang hoạt động.
- **TreeItem Action:**
  - Icon dạng `sync~spin` để biểu thị tiến trình đang chạy.
  - Kèm inline action command (`automa.killRunner`) và click action (`automa.showRunnerLog`).

### 3. Execution History View (HistoryTreeDataProvider)
Class `HistoryTreeDataProvider` cung cấp danh sách các luồng thực thi trước đây.

- **Dữ liệu Tập trung:** Gọi lệnh ngầm `automa history --json` từ CLI để lấy dữ liệu từ cơ sở dữ liệu SQLite cục bộ (thay vì quét file JSON vật lý trong Vault).
- **Lọc theo Task ID (Task Filter):**
  - Hỗ trợ công cụ lọc thông minh qua nút "Filter by Task ID" trên thanh tiêu đề của View.
  - Người dùng có thể nhập mã tĩnh của một Task (được định nghĩa trong Fleet) để CLI tự động truy xuất vào chuỗi JSON bằng hàm `json_extract(options, '$.fleetContext.task_id')` trong SQLite.
- **Virtual URI Log Rendering:**
  - Khi click vào một Job, VS Code bắn command `automa.showLogPreview` truyền kèm URI ảo dạng `automa-log://<jobId>`.
  - [[LogCustomEditorProvider.ts]] sẽ chặn URI này và render ra màn hình Webview, sử dụng thông tin chi tiết qua lệnh `automa log <jobId> --json`.

> [!INFO]
> File Explorer Sidebar cung cấp cái nhìn tổng quan về thư mục, trong khi Automa Sidebar Views mang đến tính phân loại logic (Semantic View) tách biệt rõ ràng theo từng loại Entity, giúp quản lý chuyên nghiệp hơn.
