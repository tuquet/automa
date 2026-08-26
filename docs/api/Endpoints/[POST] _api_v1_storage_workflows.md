---
tags:
  - api/endpoint
  - api/Storage
path: "/api/v1/storage/workflows"
method: "POST"
---
# Create or persist a workflow in database

> [!info] 
> **Method**: `POST`
> **Path**: `/api/v1/storage/workflows`

Creates a new workflow record or updates an existing record in the SQLite database.

## Request Body

- **Content-Type**: `application/json`
- **Schema**: [[CreateWorkflowStorageRequest]]

## Responses

### 200
Workflow created successfully

- **Content-Type**: `application/json`
- **Schema**: [[WorkflowStorageItem]]

### 400
Invalid workflow payload

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

### 500
Database write error

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

