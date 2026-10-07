# @automa/runner

> Tuquet Automa Headless CLI Runner Extension (Ultra-Lightweight Manifest V3)

`@automa/runner` is an ultra-lightweight, purely headless Chrome Manifest V3 extension designed specifically for the Rust-based CLI runner (`runner` / `tuquet runner`).

## Key Characteristics

- **Zero UI Overhead**: Completely stripped of Vue 3 runtime, Pinia, Tailwind CSS, and UI components.
- **Micro Bundle**:
  - `contentScript.bundle.js`: ~53 KB (pure DOM automation & element interaction)
  - `background.bundle.js`: ~110 KB (service worker event coordination & bridge)
  - Build time: < 350 ms via Vite.
- **Shared Execution Engine**: Powered by `@automa/engine`, sharing a single source of truth for workflow block handlers, templating, and runtime execution.
- **Sideload Target**: Automatically resolved and sideloaded by `runner` (`tuquet runner`) during workflow execution.

## Commands

```bash
# Build the headless runner extension
pnpm run build

# Watch mode during development
pnpm run dev
```

## Structure

```
apps/runner/
├── src/
│   ├── background/        # MV3 Service Worker & Runner bridge listeners
│   ├── content/           # Headless DOM interaction scripts
│   ├── offscreen/         # Offscreen host for sandboxed evaluations
│   ├── sandbox/           # Secure JS eval sandbox
│   ├── service/           # Browser API services & handlers
│   ├── utils/             # Helper utilities
│   └── manifest.chrome.json
├── business/              # Browser compatibility layer & mocks
└── vite.config.mjs        # Pure JS headless bundler
```
