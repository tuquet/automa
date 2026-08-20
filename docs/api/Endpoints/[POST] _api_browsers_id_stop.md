---
tags:
  - api/endpoint
  - api/Browsers
path: "/api/browsers/{id}/stop"
method: "POST"
---
# POST /api/browsers/{id}/stop

> [!info] 
> **Method**: `POST`
> **Path**: `/api/browsers/{id}/stop`

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `id` | path | ✅ | string | Browser ID |

## Responses

### 200
Browser stopped

- **Content-Type**: `application/json`
- **Schema**: any

### 404
Browser not found

- **Content-Type**: `application/json`
- **Schema**: [[ErrorResponse]]

