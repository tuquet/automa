---
tags:
  - api/endpoint
  - api/Browsers
path: "/api/v1/browsers/{id}/cookies"
method: "GET"
---
# Export cookies for a browser profile

> [!info] 
> **Method**: `GET`
> **Path**: `/api/v1/browsers/{id}/cookies`

Extracts and decrypts all network cookies stored in the browser profile's Chromium SQLite cookie database.

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `id` | path | ✅ | string | Unique browser profile identifier |

## Responses

### 200
Decrypted array of cookies

- **Content-Type**: `application/json`
- **Schema**: Array<[[Cookie]]>

### 404
Browser profile not found

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

### 500
Failed to access or decrypt cookie store

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

