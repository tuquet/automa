---
tags:
  - api/endpoint
  - api/Storage
path: "/api/v1/storage/workflows"
method: "GET"
---
# List all workflows from storage database

> [!info] 
> **Method**: `GET`
> **Path**: `/api/v1/storage/workflows`

Retrieves all workflow items persisted in the central SQLite database.

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `limit` | query |  | integer,null | Maximum number of workflows to return |
| `offset` | query |  | integer,null | Number of items to skip for pagination (default 0) |
| `search` | query |  | string,null | Optional search query to filter workflows by name, ID or description |

## Responses

### 200
List of workflows

- **Content-Type**: `application/json`
- **Schema**: Array<[[WorkflowStorageItem]]>

### 500
Database read error

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

