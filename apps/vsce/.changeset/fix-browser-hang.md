---
"automa-vscode": patch
---

Fix infinite UI hang in TaskRunner:
- Implemented `abortController.abort()` to escape the infinite `reader.read()` loop when `statusPoller` times out after 5 minutes.
- Updated `DaemonService` to capture and stream `stderr` logs from the Rust daemon into the Output Channel to surface launch errors.
