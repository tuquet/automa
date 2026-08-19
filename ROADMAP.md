# Automa Ecosystem - Frontend UI Roadmap

Tài liệu này ghi chú định hướng phát triển các màn hình giao diện (Frontend) chủ lực cho VS Code Extension (utoma-vscode), nhằm biến VS Code thành một IDE/Ecosystem hoàn chỉnh cho Automa.

## 🔴 Giai đoạn 1: Quản lý & Vận hành (Priority)

### 1. Profile Manager UI (Quản lý thiết bị/Trình duyệt)
- **Vị trí:** VS Code Tree View (Sidebar) hoặc Webview.
- **Tính năng:** Liệt kê toàn bộ Profiles.
- **Real-time SSE:** Đăng ký nhận sự kiện profile_status_changed từ GlobalSseListener để cập nhật trạng thái Online (🟢) / Offline (🔴) theo thời gian thực mà không cần Polling.
- **Tương tác:** Nút thao tác nhanh Launch Browser, Force Kill, Clear Cache, Edit Profile.

### 2. Campaign & Cronjob Dashboard
- **Vị trí:** VS Code Webview (Cửa sổ rộng).
- **Tính năng:**
  - Lập lịch chạy tự động (Cronjobs) cho các kịch bản.
  - Hiển thị biểu đồ tỷ lệ Success/Error của các chiến dịch.
  - Quản lý chiến lược xoay vòng Proxy (Proxy Rotation) áp dụng cho Profile.

## 🟡 Giai đoạn 2: Lõi chỉnh sửa (Core Editing)

### 3. Visual Workflow Studio (Canvas Kéo thả)
- **Vị trí:** VS Code Custom Webview Editor.
- **Tính năng:** Nhúng toàn bộ Vue Flow (từ Automa gốc) vào Webview để kéo thả Block, nối dây ngay trong VS Code mà không cần mở Extension Chrome.
- **Real-time SSE:** Nghe sự kiện lock_started qua kênh TaskRunner.telemetryEmitter để Highlight (viền vàng) Block đang chạy ngay trên Canvas, tạo cảm giác Debug trực quan.

### 4. Debugger & Variables Inspector
- **Vị trí:** VS Code Tree View (Panel bên trái hoặc dưới cùng).
- **Tính năng:** Giả lập trải nghiệm Debugger của VS Code.
- **Tương tác:** 
  - Đặt Breakpoints.
  - Hiển thị Variables, Table, Global Data ngay khi luồng tạm dừng.
  - Hỗ trợ các nút điều khiển: Step Over, Resume, Stop thông qua gọi REST API (ví dụ: POST /api/jobs/{id}/debugger/step).
