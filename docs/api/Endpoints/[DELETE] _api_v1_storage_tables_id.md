---
tags:
  - api/endpoint
  - api/Storage
path: "/api/v1/storage/tables/{id}"
method: "DELETE"
---
# Delete a storage table

> [!info] 
> **Method**: `DELETE`
> **Path**: `/api/v1/storage/tables/{id}`

Drops the specified data table and purges all of its associated rows from SQLite.

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `id` | path | ✅ | string | Unique table identifier |

## Responses

### 200
Table and rows deleted successfully

### 404
Table not found

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

### 500
Database deletion error

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

