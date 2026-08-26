---
tags:
  - api/endpoint
  - api/Storage
path: "/api/v1/storage/workflows/{id}"
method: "GET"
---
# Get a workflow by ID from storage database

> [!info] 
> **Method**: `GET`
> **Path**: `/api/v1/storage/workflows/{id}`

Retrieves the full AST and metadata of a workflow by its unique ID from SQLite database.

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `id` | path | ✅ | string | Unique workflow identifier |

## Responses

### 200
Workflow details

- **Content-Type**: `application/json`
- **Schema**: [[WorkflowStorageItem]]

### 404
Workflow not found

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

### 500
Database read error

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

