---
tags:
  - api/endpoint
  - api/Settings
path: "/api/v1/system/settings"
method: "PATCH"
---
# Partially update application settings

> [!info] 
> **Method**: `PATCH`
> **Path**: `/api/v1/system/settings`

Selectively updates specific sections of settings (e.g. grid matrix rows/columns or browser default type) without overwriting other properties.

## Request Body

- **Content-Type**: `application/json`
- **Schema**: [[UpdateAppSettingsRequest]]

## Responses

### 200
Application settings patched successfully

- **Content-Type**: `application/json`
- **Schema**: [[AppSettings]]

### 400
Invalid patch payload

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

### 500
Database update error

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

