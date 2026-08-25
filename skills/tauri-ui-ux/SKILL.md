---
name: tauri-ui-ux
description: Quy chuan kien truc, thiet ke cong thai hoc (Desktop Ergonomics) va xay dung Prototype Desktop App tren nen tang Tauri v2, Vue 3.5 va shadcn-vue cho Automa Ecosystem (automa-desk).
---

# Tauri v2 Desktop UI/UX & Architecture Skill (`automa-desk`)

Ky nang nay quy chuan toan bo nguyen ly thiet ke giao dien, cong thai hoc Desktop va kien truc Clean Architecture cho ung dung Desktop Native (**`automa-desk`**) trong he sinh thai Automa.

---

## 1. Kien Truc Cot Loi (Core Architecture Principles)

Ung dung Desktop **`automa-desk`** tuan thu mo hinh **Clean Architecture 3 Tang**:

```text
+-------------------------------------------------------------+
| 1. Presentation Layer (Vue 3.5 + shadcn-vue + Radix)        |
|    - Frameless Window Shell (AppTitleBar, AppSidebar)       |
|    - Command Palette (Ctrl+K / Cmd+K Quick Navigation)      |
|    - Pinia Stores (app, engine, browser) + Vue Router       |
+------------------------------+------------------------------+
                               | Type-Safe IPC Bridge (invoke / listen)
+------------------------------v------------------------------+
| 2. Controller & Command Layer (Rust Tauri v2)                |
|    - #[tauri::command] Handlers (thin controllers)          |
|    - Error Serialization (AppError: thiserror + serde)       |
|    - Thread-safe State (Arc<RwLock<AppState>>)              |
+------------------------------+------------------------------+
                               | Domain Coordination
+------------------------------v------------------------------+
| 3. Domain & Service Layer (Rust Native & Core Daemon)        |
|    - CoreCoordinator (Dieu phoi automa-core daemon :8765)   |
|    - TrayManager (Menu System Tray, Background Minimize)    |
|    - Storage & Browser Manager Adapter                      |
+-------------------------------------------------------------+
```

---

## 2. Nguyen Ly Cong Thai Hoc Desktop (Desktop Ergonomics)

1. **Custom Frameless Titlebar**:
   - Khai bao `"decorations": false` trong `tauri.conf.json`.
   - Vung thanh tieu de **BAT BUOC** co thuoc tinh `data-tauri-drag-region` de nguoi dung co the keo di chuyen cua so.
   - Cac nut bam tuong tac (Minimize, Maximize/Restore, Close, Theme Toggle) **BAT BUOC** co class `no-drag` hoac nam ngoai drag region de khong bi chan click.
   - Ho tro Double Click tren Titlebar de Maximize/Restore cua so (`appWindow.toggleMaximize()`).

2. **Command Palette (`Ctrl+K` / `Cmd+K`)**:
   - Cung cap phim tat toan cuc `Ctrl+K` (Windows/Linux) va `Cmd+K` (macOS) de kich hoat Command Modal tuc thi.
   - Tim kiem nhanh workflows, mo cai dat, bat/tat engine, hoac chuyen doi giao dien sang/toi.

3. **System Tray & Window Lifecycle**:
   - Ho tro thu nho xuong khay he thong (Minimize to Tray) khi nguoi dung dong cua so neu tuy chon chay ngam duoc bat.
   - Ngan chan mo trung lap instance thong qua `tauri-plugin-single-instance`.
   - Luu tru kich thuoc va vi tri cua so qua `tauri-plugin-window-state`.

4. **Phim Tat Native (Keyboard Shortcuts)**:
   - `Ctrl+R` / `F5`: Lam moi du lieu bang dieu khien (khong reload toan bo trang webview).
   - `Escape`: Dong modal, command palette, hoac dropdown dang mo.
   - `Ctrl+,`: Mo nhanh Settings View.

---

## 3. Quy Chuan `shadcn-vue` & Design System

1. **Thu Vien Chuan**:
   - Su dung **`radix-vue`** (Headless Accessible UI Primitives).
   - Quan ly class style linh hoat voi `clsx` va `tailwind-merge` thong qua helper `cn(...)` tai `@/lib/utils`.
   - Bieu tuong dong nhat: **`lucide-vue-next`**.
   - Thong bao Toast: **`vue-sonner`** (in-app toasts) ket hop **`tauri-plugin-notification`** (native OS alerts).

2. **Dark / Light Theme Sync**:
   - Ho tro 3 che do: `light`, `dark`, va `system` (tu dong doi mau theo he dieu hanh).
   - Quan ly CSS Variables theo chuan Tailwind HSL tokens (`--background`, `--foreground`, `--primary`, `--border`, `--sidebar-background`).

---

## 4. Quy Chuan Rust Backend (Tauri v2)

1. **Tach Biet Handler & Command Logic**:
   - Moi ham `#[tauri::command]` chi lam nhiem vu parse tham so, log va goi sang ham domain.
   - Domain logic viet doc lap de co the chay Unit Test `cargo test` 100% khong phu thuoc Webview.

2. **Xu Ly Loi Tap Trung**:
   - Su dung `AppError` enum voi `thiserror::Error` va implement `serde::Serialize` chuan `{ code, message }`.
   - Khong duoc `unwrap()` hoac `expect()` gay sap app tren production.
