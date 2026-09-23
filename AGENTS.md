# Project Agent Behavioral Rules: tuquet-automa

## 1. Network Constraints & Self-Healing Proxy Guardrails
- **Restricted Network Environment:** This workstation has strict firewall rules that block outbound connections on non-standard ports (e.g., direct SSH port `22`, direct Git push traffic).
- **Windows Startup Automation (`lotte_services.vbs`):**
  - Both Cloudflare Bridge (`127.0.0.1:2222`) and SSH SOCKS5 Proxy (`127.0.0.1:1080` with auto-reconnect) are started on Windows boot via `lotte_services.vbs`.
- **Self-Healing Fallback Guardrails:**
  - If ports ever get closed or you want to execute a command with proxy, run: `.\scripts\network\ensure_proxy.ps1 <command>` (e.g. `.\scripts\network\ensure_proxy.ps1 git push`).

## 2. Git Operations & Push Rules
- Direct `git push` will fail without proxy due to network port blocking.
- Always ensure Git is configured to route through the local SOCKS5 proxy for this repository:
  - For HTTPS remotes:
    ```powershell
    git config --local http.proxy socks5://127.0.0.1:1080
    git config --local https.proxy socks5://127.0.0.1:1080
    ```
  - For SSH remotes (`git@github.com:...`):
    ```powershell
    git config --local core.sshCommand "ssh -o 'ProxyCommand=connect -S 127.0.0.1:1080 %h %p'"
    ```
- Run `scripts/network/configure_git_proxy.ps1` to automatically configure repository-level Git proxy settings.

## 3. Scripting & Execution Standards
- **Strict ASCII Invariance:** All PowerShell and batch scripts in this repository MUST be strictly ASCII-encoded (no Vietnamese diacritics in code, comments, or output strings) to avoid Windows PowerShell 5.1 ANSI parsing issues.
- **Reserved Characters:** Always quote strings containing reserved shell characters (such as `&`, `|`, `<`, `>`).
- **Native Command Stderr Safety:** Always handle native CLI stderr streams safely when checking tool statuses.

## 4. Web Studio Architecture & Monorepo Layout
- **`apps/webe` Dual Role:** `apps/webe` is NOT just a Web Extension. It contains the complete **Automa Web Studio SPA & Reusable Web Component Ecosystem** in `apps/webe/src/studio`.
- **Standalone Web SPA:** `pnpm --filter @automa/webe build:studio` builds `apps/webe/dist/studio`, which is deployable standalone to Web hosting (Vercel) via `pnpm deploy:studio`.
- **Cross-Platform Mount Target:** The Web Studio flow canvas is embedded directly inside `@automa/desk` (Desktop OS app shell) and `vscode-automa` (VS Code webview pane via Host Bridge postMessage IPC).

## 5. Monorepo Package Directory Architecture & Build Invariants
- **Canonical Package Layout:**
  - `packages/types`: OpenAPI specifications (`openapi.json`) and auto-generated TypeScript SDK client (`@automa/types`).
  - `packages/ui`: 19 Atomic Shadcn-Vue primitives and 6 Pinia domain stores (`@automa/ui`).
  - `packages/webextension-polyfill`: Cross-browser extension API polyfills.
  - *Note:* Always use `packages/types` and `packages/ui` for directory paths, while keeping `@automa/types` and `@automa/ui` as the npm package names.
- **Turborepo Dependency Invariant (`^build`):**
  - Sub-build tasks (such as `build:runner` and `build:studio` in `@automa/webe`) that import from workspace packages exporting compiled `dist/` artifacts MUST declare `"dependsOn": ["^build"]` in `turbo.json`.
- **Windows File Handle Lock Guardrail:**
  - When renaming or moving monorepo package directories on Windows, background Turborepo daemons may lock `.turbo` handles. Always stop active tasks and remove `.turbo` caches before directory restructuring.

## 6. Skills Management: Workspace Isolation Rule
- **Strictly Local Skills:** All skills for this project MUST reside in `C:\Users\ndtu6\Repository\tuquet-automa\skills\`.
- **Zero Global Skills:** NEVER declare, generate, or move project-specific skills to the machine global directory (`~/.gemini/config/skills`).
