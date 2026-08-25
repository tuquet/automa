---
tags:
  - api/endpoint
  - api/Browsers
path: "/api/v1/browsers/{id}/session"
method: "POST"
---
# Launch an active browser session

> [!info] 
> **Method**: `POST`
> **Path**: `/api/v1/browsers/{id}/session`

Launches an actual browser process (Chromium/Chrome) assigned to the specified profile, loads the Automa extension runner, and positions the window according to the active grid matrix.

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `id` | path | ✅ | string | Unique browser profile identifier |

## Responses

### 200
Browser process launched and active

- **Content-Type**: `application/json`
- **Schema**: any

### 400
Invalid browser ID

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

### 500
Failed to spawn browser process

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

