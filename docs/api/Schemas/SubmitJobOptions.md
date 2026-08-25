---
tags: [api/schema]
---
# SubmitJobOptions

Advanced runtime execution options for a workflow job

**Type**: `object`

## Properties

| Name | Type | Description |
|---|---|---|
| `browserId` | string,null | Target browser instance ID (defaults to "daemon_worker") |
| `closeBrowserOnFinish` | boolean,null | Automatically close browser session when workflow execution finishes |
| `debug` | boolean,null | Enable verbose debugging and DevTools inspection |
| `defaultBrowser` | string,null | Browser executable type ("chromium", "chrome", "edge", "firefox") |
| `headless` | boolean,null | Run browser in headless mode (no visible window) |
| `variables` | object,null | Dynamic variables to inject into the workflow execution scope |
