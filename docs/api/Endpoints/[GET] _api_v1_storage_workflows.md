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

## Responses

### 200
List of workflows

- **Content-Type**: `application/json`
- **Schema**: Array<[[WorkflowStorageItem]]>

### 500
Database read error

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

