---
tags:
  - api/endpoint
  - api/Profiles
path: "/api/profiles/{id}"
method: "DELETE"
---
# DELETE /api/profiles/{id}

> [!info] 
> **Method**: `DELETE`
> **Path**: `/api/profiles/{id}`

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `id` | path | ✅ | string | Profile ID |

## Responses

### 200
Profile deleted successfully

### 500
Failed to delete profile

- **Content-Type**: `application/json`
- **Schema**: any

