---
tags:
  - api/endpoint
  - api/Browsers
path: "/api/v1/browsers/auto-detect"
method: "POST"
---
# Auto-detect and register host browser profiles

> [!info] 
> **Method**: `POST`
> **Path**: `/api/v1/browsers/auto-detect`

Scans host system for installed Chromium browsers (Chrome, Edge, Brave), creates profiles in SQLite if not existing, and configures default browser.

## Responses

### 200
List of all registered browser profiles after detection

- **Content-Type**: `application/json`
- **Schema**: Array<[[BrowserResponse]]>

### 500
Database error during auto-detection

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

