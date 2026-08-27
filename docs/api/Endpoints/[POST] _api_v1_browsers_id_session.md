---
tags:
  - api/endpoint
  - api/Browsers
path: "/api/v1/browsers/{id}/session"
method: "POST"
---
# Launch isolated browser profile instance

> [!info] 
> **Method**: `POST`
> **Path**: `/api/v1/browsers/{id}/session`

Spawns a new Chromium browser process attached to the specific profile directory with anti-detect flags and extensions loaded.

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `id` | path | ✅ | string | Unique browser profile identifier |

## Responses

### 200
Browser session started

- **Content-Type**: `application/json`
- **Schema**: any

### 400
Invalid browser ID or configuration error

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

### 500
Process spawn failure

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

