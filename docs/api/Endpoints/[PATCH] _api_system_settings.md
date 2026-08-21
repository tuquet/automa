---
tags:
  - api/endpoint
  - api/Settings
path: "/api/system/settings"
method: "PATCH"
---
# PATCH /api/system/settings

> [!info] 
> **Method**: `PATCH`
> **Path**: `/api/system/settings`

## Request Body

- **Content-Type**: `application/json`
- **Schema**: [[UpdateAppSettingsRequest]]

## Responses

### 200
Partially update application settings

- **Content-Type**: `application/json`
- **Schema**: [[AppSettings]]

