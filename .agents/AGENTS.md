# Git Repository Rules

- **NEVER** use `git commit` or `git push` on your own accord.
- Pushing code to remote is an important, sensitive action. **ONLY the USER** is allowed to push code and use `git push`.
- Unless explicitly asked by the USER, leave all completed changes in the Staging Area or Working Directory for the USER to review and commit manually.

# Automa Ecosystem Validation & Data Flow

- **Permissive Studio / Strict Runner**: Community workflows exported from old extensions often have loose JSON structures (e.g., node IDs like `n1`, missing `type` fields, missing root `version`). 
- **Auto-Sanitization on Load**: Because Automa Studio (VueFlow canvas) strictly requires properties like valid nanoids to render correctly, you MUST NOT reject these files with harsh errors. Instead, the VS Code Extension or import logic MUST **auto-inject** and sanitize the data (e.g., replacing `n1` with a nanoid, updating edge handles accordingly, defaulting `type` to `BlockBasic`) *before* loading the Studio.
- **Linter UX**: The CLI Linter (`automa lint`) should treat structural schema deviations in the Editor context as `Warnings` rather than `Errors` to maintain a relaxed and consistent user experience. Strict validation is reserved for the Runner.

# Automa Blocks JSON Recognition

- **Trigger**: Whenever the user sends a JSON snippet with `"name": "automa-blocks"` (which contains nodes, dimensions, and block data exported from the Automa Editor).
- **Behavior**: You MUST recognize this as an Automa Node/Block configuration. 
- **Action**: Immediately leverage your Automa ecosystem skills (e.g., `automa-cli`, `automa-ex-architecture`) to analyze the node's `type`, `label`, and `data` parameters. Provide tailored technical advice, debugging, or optimization tips specific to the Automa ecosystem.

# File Organization Rules
- **Scratch Files**: Any temporary, test, one-off, or scratch scripts created during the session MUST be saved inside a \scratch/\ folder relative to the active submodule/sub-project (e.g., \utoma-cli/scratch/\ or \utoma-vault/scratch/\). Do NOT pollute the project root directory with these files.

# Automa Extension Architecture & Constraints

- **Repository**: `automa-ext` is now an independent fork at `tuquet/automa-ext` (forked from `AutomaApp/automa`). Direct modifications are allowed.
  - **Upstream tracking**: `upstream` remote points to `AutomaApp/automa.git` for cherry-picking upstream fixes when needed.
- **Daemon Architecture (VS Code / CLI)**:
  - **Primary Engine**: VS Code Extension (`automa-vscode`) MUST use the local Node Daemon (`automa-cli serve`) via REST/SSE APIs (e.g. `fetch`) for ALL resource-heavy tasks (`run`, `lint`, `install-browser`, `encrypt-secret`, history).
  - **NO Raw CLI**: Do NOT use `child_process.exec` or `spawn` to run raw CLI commands (`automa-cli run ...`) as fallbacks inside VS Code unless absolutely necessary (e.g., daemon crash). Raw CLI commands spawn new V8 contexts, consume excessive RAM, and are prone to JSON parsing errors from stdout.
  - **NO Dynamic Imports in API Handlers**: Inside the Daemon Server (`automa-cli/src/core/server`), NEVER use `await import(...)` inside hot Route Handlers. Use Static Imports at the top of the file to prevent latency and detect missing modules on startup.
  - **DRY Async Handlers**: Always wrap Express Async Routes with an `asyncHandler` to automatically catch and return 500 errors. Do not duplicate `try/catch` blocks.
  - **Zombie Process Prevention**: When writing child process managers (like `BrowserManager`), you MUST implement a *Registry Pattern* (store `instances` in a static `Set`) and cleanly tear them down in a `destroyAll()` method upon graceful shutdown signals.
- **No `webextension-polyfill`**: The extension uses native `chrome.*` API (MV3) and `browser.*` API (Firefox) via a minimal wrapper at `src/lib/browser-compat.js`.
  - **Build-time Aliasing Rule**: To maintain zero conflicts with the upstream `automa` repository, DO NOT manually replace `import browser from "webextension-polyfill"` in the source files. Instead, keep the upstream source unchanged and use Webpack `resolve.alias` (in `webpack.config.js`) to redirect `webextension-polyfill` imports to `src/lib/browser-compat.js` during the build process.
- **Chromium Version**: CLI (`automa-cli`) uses `latest` Chromium build. No version pinning required.
- **MessageListener Routing Prefix**: The `MessageListener` utility in `automa-ext` automatically intercepts messages based on the execution context prefix (e.g., `background--`, `offscreen--`). 
  - **Rule**: When invoking extension events from external scripts (like `dummyTab` in the CLI) using direct `chrome.runtime.sendMessage`, you MUST manually prepend the correct prefix (e.g., `background--workflow:execute`). Otherwise, the `MessageListener` will not match the event name.

# Knowledge Base & Documentation

- **Primary Source of Truth**: All project documentation is centralized in an Obsidian Vault located at the `documents/` folder.
- **Agent Initialization**: When tasked with understanding the ecosystem architecture, features, or CLI/VSCode commands, you MUST ALWAYS read `documents/Home.md` and `documents/_meta/All_Documents.base` first. 
- **Documentation Updates**: Whenever you implement a major feature or architectural change, you must update the corresponding Markdown files in the `documents/` Vault.
- **Mandatory Skills**: When working with the Vault, you MUST load and apply the following local skills:
  1. `obsidian-markdown`: For formatting notes, using wikilinks, callouts, and frontmatter.
  2. `obsidian-bases`: For creating or updating `.base` files to query and summarize vault data dynamically.
  3. `obsidian-cli`: For interacting with, searching, or automating the vault if the Obsidian desktop app is running.

# Monorepo Architecture & Reusability Rules

- **Prioritize Existing WIPs (Work-in-Progress)**: Before inventing or proposing complex architectural integrations, polyfills, or cross-package bridges (e.g., embedding the Vue app into a VS Code Webview), you MUST exhaustively search the monorepo for existing WIP solutions.
  - **Action**: Always check `package.json` scripts, `webpack.*.config.js` variants, and `packages/` workspaces to see if a specific build target or adapter (like `vscode-compat.js`) has already been partially implemented by the user. Do not build from scratch if a foundation exists.
- **VSCE Packaging**: In a Monorepo setup, if `npx vsce package` fails due to strict `package.json` dependency validation (e.g., missing dependencies in the root), PREFER using the `--no-dependencies` flag rather than modifying the workspace structure and breaking the original monorepo design.

# Vue i18n & Webpack 5 Dynamic Imports Rule

- **JSON Dynamic Imports**: When dynamically importing JSON files (e.g., locale messages for ue-i18n) via wait import(...), **ALWAYS** handle the resolution of the default export safely. Webpack 5's JSON module resolution differs between dev and production builds.
- **Implementation**: You must use a fallback const content = messages.default || messages; before injecting it into the state (e.g., i18n.global.mergeLocaleMessage(locale, content)). Never strictly rely on messages.default.

# VS Code Webview Build & Asset Loading Workflow

- **Webview UI Build Target**: The standard `pnpm run build` command in the root folder DOES NOT build the VS Code Webview UI. It only builds the standard browser extension (`automa-ext/build`). 
  - **Rule**: Whenever you make UI changes intended for the VS Code Extension, you MUST navigate to the `automa-ext/` folder and run `pnpm run build:vscode`. This ensures `webpack.vscode.config.js` is executed and outputs assets directly to `automa-vscode/webview-ui/dist`.
- **Webpack Public Path (Chunk Loading)**: VS Code Webviews serve assets over a restricted `vscode-resource:` protocol. Webpack`s default `publicPath` (`/` or `auto`) will fail to resolve dynamic chunks (like Vue i18n locale `.js` chunks), resulting in `ChunkLoadError` and fetch JSON parsing errors.
  - **Rule**: You MUST ensure that the Webview entry point (`automa-ext/src/newtab/index.js`) explicitly sets `__webpack_public_path__ = window.ASSETS_BASE_URL;` at the absolute top of the file before any dynamic imports are evaluated. `window.ASSETS_BASE_URL` must be injected securely by the Webview Provider.


- **Native Debugger UI Reuse**: The Vue app already contains a robust Debugger and Variables Inspector (`EditorDebugging.vue`). When working on Debugger features for VS Code, DO NOT reinvent the UI. The Webview handles all rendering and state inspection intrinsically.
- **Message Bridging via Webpack Override**: The Webview UI sends debug commands (`workflow:resume`, `workflow:stop`, `workflow:breakpoint`) via `sendMessage()`. Because of `webpack.vscode.config.js` and the `browser-compat.js` wrapper, these are translated into `vscode.postMessage()`. The VS Code Extension Backend (`StudioWebviewPanel.ts`) MUST intercept these messages and proxy them to the appropriate Execution Engine or Daemon API.

