# ⚙️ SRS Domain Specification: Menu Settings (System & Core Configuration)

---

## 🎯 1. Scope & Objectives

The **Settings** menu manages global operating parameters and connection settings for the Rust Daemon (`automa-core`) across the Automa Ecosystem:
- **`apps/desk`**: Provides a system configuration view (`SettingsView.vue`), manages daemon port `:8765`, controls auto-start toggles, configures Master Passphrase for secrets, and toggles Appearance themes (Dark/Light/System).
- **`apps/vsce`**: Synchronizes settings via VS Code configuration (`automa.daemonPort`, `automa.storagePath`).
- **`apps/core`**: Exposes `/api/v1/settings` and health telemetry `/api/v1/system/health`.

---

## 🌳 2. UI/UX Layout & Component Tree

```text
SettingsView.vue
├── SECTION 1: DAEMON CONNECTION & STATUS
│   ├── Daemon Status Badge (Green: Connected / Red: Disconnected)
│   ├── Daemon Host & Port Input (Default: http://127.0.0.1:8765)
│   ├── Auto-Start Daemon with App (Toggle Switch)
│   ├── btn.settings.daemon.check (Verify connection)
│   └── btn.settings.daemon.restart (Restart Daemon process)
├── SECTION 2: VAULT & SECURITY
│   ├── Master Passphrase Input (SecretStorage or RAM runtime)
│   ├── btn.settings.passphrase.save (Save master passphrase)
│   └── btn.settings.passphrase.clear (Purge passphrase from memory)
├── SECTION 3: APPEARANCE & THEME
│   └── select.settings.theme (Dark / Light / System)
├── SECTION 4: STORAGE & WORKSPACE PATHS
│   ├── Storage Workspace Directory Path
│   ├── btn.settings.path.browse (Open native folder picker)
│   └── btn.settings.save (Save entire configuration)
└── System Diagnostics & Version Info
```

---

## ⚡ 3. Button Catalog in Settings Menu

| Button ID | UI Label | Icon | Supported FSM States | Target Action & Endpoint | `data-testid` |
|---|---|---|---|---|---|
| `btn.settings.save` | Save Settings | `Save` | `IDLE` | Persists configuration `updateSettings()` | `btn-save-settings` |
| `btn.settings.daemon.check` | Test Connection | `Activity`| `IDLE`, `VALIDATING` | Queries `/api/v1/system/health` | `btn-check-daemon-health` |
| `btn.settings.daemon.restart`| Restart Daemon | `RotateCw` | `IDLE` | Triggers daemon restart cycle | `btn-restart-daemon` |
| `btn.settings.passphrase.save`| Save Passphrase | `Key` | `IDLE` | Stores passphrase in SecretStorage | `btn-save-master-passphrase` |
| `btn.settings.path.browse` | Browse Folder | `Folder` | `IDLE` | Opens native file explorer dialog | `btn-browse-storage-path` |

---

## 📜 4. Select Dropdowns in Settings Menu

| Select ID | Dropdown Label | Remote Data Source | Virtualization & Debounce | Reactive Selection Side-Effect | `data-testid` |
|---|---|---|---|---|---|
| `select.settings.theme` | Color Theme | Static Union (`dark`, `light`, `system`) | No virtualization | Toggles `dark` class on `<html>` and persists `theme` | `select-settings-theme` |
| `select.settings.language` | Display Language | Static Union (`en`, `vi`) | No virtualization | Updates i18n locale across application | `select-settings-language` |

---

## 🍍 5. Associated Pinia State Management (`useSettingsStore`)

The [`useSettingsStore`](../../packages/ui/src/stores/useSettingsStore.ts) store coordinates system settings:
- `settings`: System configuration object (`AppSettings`).
- `isDaemonHealthy`: Boolean tracking daemon heartbeat liveness.
- `theme`: Active UI theme (`'dark' | 'light' | 'system'`).
- `setDaemonHealthy(status)`: Updates status badge in `AppTitleBar.vue`.

---

## 🌐 6. API Endpoints & Health Check Catalog

| Protocol | Endpoint | Method | SDK Function | Business Description |
|---|---|:---:|---|---|
| **REST** | `/api/v1/system/health` | `GET` | `getSystemHealth()` | Inspects daemon and SQLite database health |
| **REST** | `/api/v1/settings` | `GET` / `PUT` | `getSettings()` / `updateSettings()` | Reads or patches system configuration |

---

## 🛡️ 7. Quality Assurance & Agent Cross-Checklist

1. [ ] Theme changes in Settings must immediately reflect across all Views and Titlebar without requiring application reload.
2. [ ] If the daemon stops or errors, the indicator on Titlebar must turn red (`Offline`) via background Heartbeat Check.
3. [ ] Master Passphrase is never stored in plaintext within localStorage, configuration files, or logs.
