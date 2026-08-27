---
tags:
  - api/endpoint
  - api/Storage
path: "/api/v1/storage/tables"
method: "GET"
---
# List all storage tables

> [!info] 
> **Method**: `GET`
> **Path**: `/api/v1/storage/tables`

Retrieves schemas for all user data tables stored in SQLite.

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `limit` | query |  | integer,null | Maximum number of tables to return |
| `offset` | query |  | integer,null | Number of items to skip for pagination (default 0) |
| `search` | query |  | string,null | Optional search query to filter tables by name or ID |

## Responses

### 200
List of data tables

- **Content-Type**: `application/json`
- **Schema**: Array<[[StorageTable]]>

### 500
Database read error

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

