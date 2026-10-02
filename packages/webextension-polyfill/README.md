<div align="center">
  <h1>WebExtension Polyfill (Dummy/Alias Package)</h1>
  <p><strong>Dependency Resolution Package for Zero-Polyfill Strategy</strong></p>
</div>

---

> [!WARNING]
> This is **NOT** Mozilla's original `webextension-polyfill` library. This is a targeted dummy alias package designed specifically for the Automa ecosystem.

## 🚨 Upstream Problem
In upstream repositories (`AutomaApp/automa`), `webextension-polyfill` was used to wrap browser APIs. However, this architecture caused **widespread crashes on Chrome v129+** due to internal context binding errors on the Storage API (`Illegal invocation`).

## 🛠 Our Solution (Zero-Polyfill)
To resolve this without rewriting thousands of lines of legacy code during upstream syncs, Automa employs **Build-time Aliasing**.

This package exists to:
1. **Instruct Bundlers (Webpack/Vite):** Whenever legacy code executes `import browser from "webextension-polyfill"`, the build system aliases the import to this lightweight package.
2. **Provide Safe Direct Bindings:** Exports an intermediary object delegating directly to native `chrome.*` (MV3 Native API) or native `browser.*` on Firefox, completely bypassing Mozilla's polyfill wrappers.

## 🚀 Key Benefits
- Significantly smaller bundle footprint.
- Eliminates 100% of Chrome v129+ storage binding crashes.
- Preserves clean Git rebasing from upstream without merge conflicts.
