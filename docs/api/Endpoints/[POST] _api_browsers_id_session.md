---
tags:
  - api/endpoint
  - api/Browsers
path: "/api/browsers/{id}/session"
method: "POST"
---
# POST /api/browsers/{id}/session

> [!info] 
> **Method**: `POST`
> **Path**: `/api/browsers/{id}/session`

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `id` | path | ✅ | string | Browser ID |

## Responses

### 200
Browser session started

- **Content-Type**: `application/json`
- **Schema**: any

### 404
Browser not found

- **Content-Type**: `application/json`
- **Schema**: [[ErrorResponse]]

