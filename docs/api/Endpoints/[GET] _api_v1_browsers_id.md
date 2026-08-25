---
tags:
  - api/endpoint
  - api/Browsers
path: "/api/v1/browsers/{id}"
method: "GET"
---
# Get browser profile details

> [!info] 
> **Method**: `GET`
> **Path**: `/api/v1/browsers/{id}`

Retrieves full configuration details and live online status for a specific browser profile.

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `id` | path | ✅ | string | Unique browser profile identifier |

## Responses

### 200
Browser profile details

- **Content-Type**: `application/json`
- **Schema**: [[BrowserResponse]]

### 400
Invalid browser ID

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

### 404
Browser profile not found

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

### 500
Database query error

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

