---
tags:
  - api/endpoint
  - api/Storage
path: "/api/v1/storage/tables/{id}/rows"
method: "GET"
---
# Get rows from a storage table

> [!info] 
> **Method**: `GET`
> **Path**: `/api/v1/storage/tables/{id}/rows`

Queries paginated row documents belonging to the specified data table.

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `id` | path | ✅ | string | Unique table identifier |
| `limit` | query |  | integer,null | Maximum number of rows to return (default 50) |
| `offset` | query |  | integer,null | Number of items to skip for pagination (default 0) |
| `search` | query |  | string,null | Optional search query to filter rows by data content |

## Responses

### 200
Array of table row objects

- **Content-Type**: `application/json`
- **Schema**: Array<[[TableRow]]>

### 404
Table not found

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

### 500
Database query error

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

