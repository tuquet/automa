---
tags:
  - api/endpoint
  - api/Storage
path: "/api/v1/storage/credentials/{id}"
method: "DELETE"
---
# Delete a stored credential

> [!info] 
> **Method**: `DELETE`
> **Path**: `/api/v1/storage/credentials/{id}`

Permanently removes a credential from storage by ID or key.

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `id` | path | ✅ | string | Credential ID or unique key |

## Responses

### 200
Credential deleted successfully

### 404
Credential not found

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

### 500
Database deletion error

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

