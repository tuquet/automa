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

- **StorageArea Polyfill Bug (Chrome 129+)**: The extension uses an older `webextension-polyfill` that crashes with `TypeError: Illegal invocation: Function must be called on an object of type StorageArea` on modern Chrome versions. 
  - **Rule**: NEVER modify `automa-source` to fix this. Instead, ensure any Puppeteer/CLI launcher (`automa-cli`) forces the use of a stable, older Chromium executable (e.g., Puppeteer's bundled Chrome 126) rather than dynamically fetching the latest system Chrome.
- **MessageListener Routing Prefix**: The `MessageListener` utility in `automa-source` automatically intercepts messages based on the execution context prefix (e.g., `background--`, `offscreen--`). 
  - **Rule**: When invoking extension events from external scripts (like `dummyTab` in the CLI) using direct `chrome.runtime.sendMessage`, you MUST manually prepend the correct prefix (e.g., `background--workflow:execute`). Otherwise, the `MessageListener` will not match the event name.

