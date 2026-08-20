---
tags:
  - api/endpoint
  - api/Browsers
path: "/api/browsers/{id}"
method: "PUT"
---
# PUT /api/browsers/{id}

> [!info] 
> **Method**: `PUT`
> **Path**: `/api/browsers/{id}`

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `id` | path | ✅ | string | Browser ID |

## Request Body

- **Content-Type**: `application/json`
- **Schema**: [[UpdateBrowserRequest]]

## Responses

### 200
Browser updated successfully

### 500
Failed to update browser

- **Content-Type**: `application/json`
- **Schema**: any

