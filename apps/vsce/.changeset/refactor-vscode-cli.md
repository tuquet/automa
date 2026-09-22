---
"vscode-automa": minor
---

Refactor VS Code Extension to use @automa/sdk instead of child_process.exec for CLI commands. Removed raw CLI process spawning to prevent zombie processes and reduce RAM usage.
