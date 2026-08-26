---
tags:
  - api/endpoint
  - api/Storage
path: "/api/v1/storage/workflows/{id}"
method: "PUT"
---
# Update a workflow in storage database

> [!info] 
> **Method**: `PUT`
> **Path**: `/api/v1/storage/workflows/{id}`

Modifies the metadata or graph AST of an existing workflow in SQLite database.

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `id` | path | ✅ | string | Unique workflow identifier |

## Request Body

- **Content-Type**: `application/json`
- **Schema**: [[UpdateWorkflowStorageRequest]]

## Responses

### 200
Workflow updated successfully

- **Content-Type**: `application/json`
- **Schema**: [[WorkflowStorageItem]]

### 400
Invalid update payload

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

### 404
Workflow not found

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

### 500
Database write error

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

