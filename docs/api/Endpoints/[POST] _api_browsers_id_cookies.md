---
tags:
  - api/endpoint
  - api/Browsers
path: "/api/browsers/{id}/cookies"
method: "POST"
---
# POST /api/browsers/{id}/cookies

> [!info] 
> **Method**: `POST`
> **Path**: `/api/browsers/{id}/cookies`

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `id` | path | ✅ | string | Browser ID |

## Request Body

- **Content-Type**: `application/json`
- **Schema**: Array<[[Cookie]]>

## Responses

### 200
Cookies imported successfully

### 500
Failed to import cookies

