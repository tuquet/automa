---
tags:
  - api/endpoint
  - api/Storage
path: "/api/v1/storage/variables"
method: "GET"
---
# List all storage variables

> [!info] 
> **Method**: `GET`
> **Path**: `/api/v1/storage/variables`

Retrieves all global and local variables persisted in Automa SQLite storage.

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `limit` | query |  | integer,null | Maximum number of variables to return |
| `offset` | query |  | integer,null | Number of items to skip for pagination (default 0) |
| `search` | query |  | string,null | Optional search query to filter variables by name, key or ID |

## Responses

### 200
List of variables

- **Content-Type**: `application/json`
- **Schema**: Array<[[StorageVariable]]>

### 500
Database read error

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

