---
tags:
  - api/endpoint
  - api/Settings
path: "/api/v1/system/settings"
method: "GET"
---
# Get current application and grid settings

> [!info] 
> **Method**: `GET`
> **Path**: `/api/v1/system/settings`

Retrieves current daemon configuration including Grid Matrix layout, default browser preferences, and Runner concurrency settings.

## Responses

### 200
Current application and grid settings

- **Content-Type**: `application/json`
- **Schema**: [[AppSettings]]

### 500
Database query error

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

