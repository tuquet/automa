---
"vscode-automa": minor
---

- **Event-Driven TaskRunner**: Replaced 500ms busy-polling loop with a Promise event-driven completion listener.
- **Defensive Error Handling**: Isolated JSON syntax parsing in Linter command from Daemon network errors, and wrapped file operations with user-facing error dialogs.
- **Daemon Lifecycle**: Extracted reusable `waitUntilHealthy` polling method in `DaemonService`.
- **Webview Resource Loading**: Ensured safe local URI resolution via `asWebviewUri` for panels.
