---
name: automa-desk
description: Architecture, Desktop Ergonomics, Tauri v2 IPC, Vue 3.5 presentation, and shadcn-vue integration for the Automa Desktop Application (automa-desk). Activate when working on Tauri commands, frameless window titlebars, command palettes (Ctrl+K), system tray, or native desktop features.
---

# Automa Desktop Application (`automa-desk`)

Architecture and desktop ergonomics guide for the `automa-desk` submodule (Tauri v2 + Vue 3.5 + shadcn-vue).

---

## 1. 🎯 Scope & 3-Layer Clean Architecture

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
|    - CoreCoordinator (Coordinates automa-core daemon :8765) |
|    - TrayManager (System Tray Menu, Background Minimize)    |
|    - Storage & Browser Manager Adapter                      |
+-------------------------------------------------------------+
```

---

## 2. 🛡️ Desktop Ergonomics & Invariants

1. **Custom Frameless Titlebar**:
   - `"decorations": false` in `tauri.conf.json`.
   - Titlebar container MUST have `data-tauri-drag-region`.
   - Interactive buttons (Minimize, Maximize/Restore, Close, Theme Toggle) MUST have class `no-drag` to preserve click events.
   - Support Double-Click on Titlebar to toggle maximize (`appWindow.toggleMaximize()`).
2. **Command Palette (`Ctrl+K` / `Cmd+K`)**:
   - Global shortcut opens command search dialog to navigate workflows, toggle dark/light theme, or launch browsers.
3. **System Tray & Window Lifecycle**:
   - Minimize-to-tray on close if background daemon mode is enabled.
   - Prevent duplicate instances via `tauri-plugin-single-instance`.
   - Persist window position/size via `tauri-plugin-window-state`.

---

## 3. 💻 Production Code Templates

### Tauri Command Handler
```rust
use tauri::State;
use crate::error::AppResult;
use crate::state::AppState;

#[tauri::command]
pub async fn get_daemon_status(
    state: State<'_, AppState>,
) -> AppResult<bool> {
    let is_running = state.core_coordinator.is_healthy().await;
    Ok(is_running)
}
```

---

## 4. 🔧 Verification

- **Dev Mode**: `pnpm -F automa-desk run tauri dev`
- **Build Desktop Binary**: `pnpm -F automa-desk run tauri build`
