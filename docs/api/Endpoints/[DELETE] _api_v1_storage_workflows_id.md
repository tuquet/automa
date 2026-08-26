---
tags:
  - api/endpoint
  - api/Storage
path: "/api/v1/storage/workflows/{id}"
method: "DELETE"
---
# Delete a workflow from storage database

> [!info] 
> **Method**: `DELETE`
> **Path**: `/api/v1/storage/workflows/{id}`

Removes a workflow record from the central SQLite database by ID.

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `id` | path | ✅ | string | Unique workflow identifier |

## Responses

### 200
Workflow deleted successfully

- **Content-Type**: `application/json`
- **Schema**: [[DeleteWorkflowResponse]]

### 404
Workflow not found

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

### 500
Database deletion error

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

