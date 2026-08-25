---
tags:
  - api/endpoint
  - api/System
path: "/api/v1/system/browser-binaries"
method: "POST"
---
# Download and install Chromium binary

> [!info] 
> **Method**: `POST`
> **Path**: `/api/v1/system/browser-binaries`

Downloads and extracts the latest compatible Chromium build into the local cache via `@puppeteer/browsers`.

## Responses

### 200
Chromium binary downloaded and installed successfully

- **Content-Type**: `application/json`
- **Schema**: [[SystemResponse]]

### 500
Failed to download browser binary

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

