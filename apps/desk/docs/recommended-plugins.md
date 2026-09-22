# Recommended Tauri Plugins

> **Note:** `tauri-plugin-log` is already included in this template. See `src-tauri/src/lib.rs` for configuration.

These plugins are not included by default to keep the template lean, but are recommended for production apps.

## tauri-plugin-window-state — Window Persistence

Saves and restores window position and size across restarts.

```bash
make add-window-state
```

The recipe adds the dependency and registers the plugin; no frontend code is needed. See
[Tauri Window State Plugin](https://v2.tauri.app/plugin/window-state/).

## tauri-plugin-updater — Auto-Updates

Checks for and installs app updates from GitHub Releases.

```bash
make add-updater
```

The plugin registers updater permissions in `tauri.conf.json`. See
[Tauri Updater Plugin](https://v2.tauri.app/plugin/updater/) for configuring keypairs,
CI secrets, and calling `check()` from the frontend.

See [Tauri Plugins Documentation](https://v2.tauri.app/plugin/) for more details.
