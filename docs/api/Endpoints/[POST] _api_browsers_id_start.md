---
tags:
  - api/endpoint
  - api/Browsers
path: "/api/browsers/{id}/start"
method: "POST"
---
# POST /api/browsers/{id}/start

> [!info] 
> **Method**: `POST`
> **Path**: `/api/browsers/{id}/start`

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `id` | path | ✅ | string | Browser ID |

## Responses

### 200
Browser started

- **Content-Type**: `application/json`
- **Schema**: any

### 404
Browser not found

- **Content-Type**: `application/json`
- **Schema**: [[ErrorResponse]]

