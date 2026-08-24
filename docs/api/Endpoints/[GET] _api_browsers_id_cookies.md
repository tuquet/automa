---
tags:
  - api/endpoint
  - api/Browsers
path: "/api/browsers/{id}/cookies"
method: "GET"
---
# GET /api/browsers/{id}/cookies

> [!info] 
> **Method**: `GET`
> **Path**: `/api/browsers/{id}/cookies`

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `id` | path | ✅ | string | Browser ID |

## Responses

### 200
Exported cookies

- **Content-Type**: `application/json`
- **Schema**: Array<[[Cookie]]>

### 500
Failed to export cookies

