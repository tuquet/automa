---
tags:
  - api/endpoint
  - api/Browsers
path: "/api/browsers/{id}"
method: "DELETE"
---
# DELETE /api/browsers/{id}

> [!info] 
> **Method**: `DELETE`
> **Path**: `/api/browsers/{id}`

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `id` | path | ✅ | string | Browser ID |

## Responses

### 200
Browser deleted successfully

### 400
Invalid browser ID

### 404
Browser not found

### 500
Failed to delete browser

