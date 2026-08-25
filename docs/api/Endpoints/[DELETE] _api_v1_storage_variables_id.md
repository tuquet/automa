---
tags:
  - api/endpoint
  - api/Storage
path: "/api/v1/storage/variables/{id}"
method: "DELETE"
---
# Delete a storage variable

> [!info] 
> **Method**: `DELETE`
> **Path**: `/api/v1/storage/variables/{id}`

Permanently removes a variable from storage by ID or key.

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `id` | path | ✅ | string | Variable ID or unique key |

## Responses

### 200
Variable deleted successfully

### 404
Variable not found

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

### 500
Database deletion error

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

