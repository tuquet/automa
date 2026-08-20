---
tags:
  - api/endpoint
  - api/Browsers
path: "/api/browsers/{id}"
method: "GET"
---
# GET /api/browsers/{id}

> [!info] 
> **Method**: `GET`
> **Path**: `/api/browsers/{id}`

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `id` | path | ✅ | string | Browser ID |

## Responses

### 200
Browser details

- **Content-Type**: `application/json`
- **Schema**: [[BrowserResponse]]

### 404
Browser not found

- **Content-Type**: `application/json`
- **Schema**: any

