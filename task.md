# Browser Lifecycle Refactoring

- [x] Phase 1: Configuration & Defaults
  - `automa-core/src/config/mod.rs` data_dir points to `%LOCALAPPDATA%/.automa/core` on Windows and `~/.automa/core` on Unix.
  - `setting.json` stores settings inside `data_dir`.
  - Default `browsersBasePath` set to `../browsers`.
- [x] Phase 2: Browser Manager & API Handlers
  - `vault.rs` uses `State(state)` for `data_dir`.
  - `BrowserManager::launch` uses `{browsersBasePath}/{browser_id}`.
  - `delete_browser_handler` deletes physical folder.
  - `GET /api/browsers/{id}/export` handler added skipping cache folders.
- [ ] Phase 3: Testing & Polish
- [x] Phase 4: Nâng cấp DTO và Database
- [x] Phase 5: Xử lý Proxy & Sideload Extensions
  - [x] Thao tác Cookies (SQLite Engine)
