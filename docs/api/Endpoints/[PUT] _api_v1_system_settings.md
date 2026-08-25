---
tags:
  - api/endpoint
  - api/Settings
path: "/api/v1/system/settings"
method: "PUT"
---
# Overwrite application and grid settings

> [!info] 
> **Method**: `PUT`
> **Path**: `/api/v1/system/settings`

Replaces the entire application configuration and persists new grid, browser, and runner settings.

## Request Body

- **Content-Type**: `application/json`
- **Schema**: [[AppSettings]]

## Responses

### 200
Application settings replaced successfully

- **Content-Type**: `application/json`
- **Schema**: [[AppSettings]]

### 400
Invalid settings payload

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

### 500
Database write error

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

