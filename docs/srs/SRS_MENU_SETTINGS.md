# ⚙️ ĐẶC TẢ NGHIỆP VỤ SRS: MENU SETTINGS (SYSTEM & CORE CONFIGURATION)

---

## 🎯 1. MỤC TIÊU & PHẠM VI (SCOPE & OBJECTIVES)

Menu **Settings** quản lý cấu hình toàn cục của hệ điều hành và thông số kết nối với Rust Daemon (`automa-core`) cho toàn bộ Automa Ecosystem:
- **`apps/desk`**: Cung cấp giao diện cấu hình hệ thống (`SettingsView.vue`), quản lý địa chỉ cổng Daemon `:8765`, tự động khởi chạy Daemon cùng ứng dụng (Auto-start), thiết lập Master Passphrase, và quản lý Theme (Dark/Light/System).
- **`apps/vsce`**: Đồng bộ cấu hình qua VS Code Settings (`automa.daemonPort`, `automa.storagePath`).
- **`apps/core`**: Cung cấp endpoint cấu hình `/api/v1/settings` và kiểm tra sức khỏe `/api/v1/system/health`.

---

## 🌳 2. BỐ CỤC GIAO DIỆN & COMPONENT TREE (UI/UX LAYOUT)

```text
SettingsView.vue
├── SECTION 1: DAEMON CONNECTION & STATUS
│   ├── Daemon Status Badge (Green: Connected / Red: Disconnected)
│   ├── Daemon Host & Port Input (Mặc định: http://127.0.0.1:8765)
│   ├── Auto-Start Daemon with App (Toggle Switch)
│   ├── btn.settings.daemon.check (Kiểm tra kết nối)
│   └── btn.settings.daemon.restart (Khởi động lại Daemon)
├── SECTION 2: VAULT & SECURITY
│   ├── Master Passphrase Input (vscode.SecretStorage hoặc RAM runtime)
│   ├── btn.settings.passphrase.save (Lưu mật mã chủ)
│   └── btn.settings.passphrase.clear (Xóa mật mã khỏi bộ nhớ)
├── SECTION 3: APPEARANCE & THEME
│   └── select.settings.theme (Dark / Light / System)
├── SECTION 4: STORAGE & WORKSPACE PATHS
│   ├── Storage Workspace Directory Path
│   ├── btn.settings.path.browse (Mở native file dialog chọn thư mục)
│   └── btn.settings.save (Lưu toàn bộ cấu hình)
└── System Diagnostics & Version Info
```

---

## ⚡ 3. DANH MỤC NÚT BẤM (BUTTON CATALOG) TRONG MENU SETTINGS

| Button ID | Tên Nút / Nhãn UI | Icon | Trạng Thái FSM Hỗ Trợ | Target Action & Endpoint | `data-testid` |
|---|---|---|---|---|---|
| `btn.settings.save` | Save Settings | `Save` | `IDLE` | Lưu cấu hình `updateSettings()` | `btn-save-settings` |
| `btn.settings.daemon.check` | Test Connection | `Activity`| `IDLE`, `VALIDATING` | Gọi `/api/v1/system/health` kiểm tra | `btn-check-daemon-health` |
| `btn.settings.daemon.restart`| Restart Daemon | `RotateCw` | `IDLE` | Gửi lệnh khởi động lại tiến trình Daemon | `btn-restart-daemon` |
| `btn.settings.passphrase.save`| Save Passphrase | `Key` | `IDLE` | Lưu Passphrase vào SecretStorage | `btn-save-master-passphrase` |
| `btn.settings.path.browse` | Browse Folder | `Folder` | `IDLE` | Mở hộp thoại chọn thư mục Native | `btn-browse-storage-path` |

---

## 📜 4. DANH MỤC SELECT / DROPDOWN TRONG MENU SETTINGS

| Select ID | Tên Dropdown | Nguồn Dữ Liệu Remote | Virtualization & Debounce | Side-effect Phản Xạ Khi Chọn | `data-testid` |
|---|---|---|---|---|---|
| `select.settings.theme` | Color Theme | Static Union (`dark`, `light`, `system`) | Không cần ảo hóa | Cập nhật class `dark` trên `<html>` và lưu `theme` | `select-settings-theme` |
| `select.settings.language` | Display Language | Static Union (`en`, `vi`) | Không cần ảo hóa | Chuyển đổi ngôn ngữ i18n toàn ứng dụng | `select-settings-language` |

---

## 🍍 5. QUẢN LÝ TRẠNG THÁI PINIA STORE LIÊN QUAN (`useSettingsStore`)

Store [`useSettingsStore`](../../packages/automa-ui/src/stores/useSettingsStore.ts) quản lý cấu hình hệ thống:
- `settings`: Object cấu hình hệ thống (`AppSettings`).
- `isDaemonHealthy`: Cờ boolean đánh dấu trạng thái sống/chết của Core Daemon.
- `theme`: Trạng thái theme hiện tại (`'dark' | 'light' | 'system'`).
- `setDaemonHealthy(status)`: Cập nhật badge trên thanh tiêu đề `AppTitleBar.vue`.

---

## 🌐 6. DANH MỤC API ENDPOINTS & HEALTH CHECK

| Giao Thức | Endpoint | Phương Thức | SDK Function Gọi Chuẩn | Mô Tả Nghiệp Vụ |
|---|---|:---:|---|---|
| **REST** | `/api/v1/system/health` | `GET` | `getSystemHealth()` | Kiểm tra trạng thái Daemon & SQLite DB |
| **REST** | `/api/v1/settings` | `GET` / `PUT` | `getSettings()` / `updateSettings()` | Đọc hoặc cập nhật cấu hình hệ thống |

---

## 🛡️ 7. TIÊU CHUẨN KIỂM ĐỊNH CHẤT LƯỢNG (AGENT CROSS-CHECK)

1. [ ] Thay đổi Theme trong Settings phải phản xạ tức thì trên toàn bộ các View và thanh Titlebar mà không cần reload.
2. [ ] Khi Daemon bị tắt hoặc gặp sự cố, indicator trên Titlebar phải đổi sang màu đỏ (`Offline`) ngay lập tức nhờ Heartbeat Check.
3. [ ] Master Passphrase được bảo mật nghiêm ngặt, không bao giờ hiển thị dạng plaintext trong localStorage hoặc file log.
