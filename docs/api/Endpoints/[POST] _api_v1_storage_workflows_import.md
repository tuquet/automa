---
tags:
  - api/endpoint
  - api/Storage
path: "/api/v1/storage/workflows/import"
method: "POST"
---
# Import a workflow JSON into storage database

> [!info] 
> **Method**: `POST`
> **Path**: `/api/v1/storage/workflows/import`

Parses and imports a workflow JSON object (from file or client) into SQLite database.

## Request Body

- **Content-Type**: `application/json`
- **Schema**: [[ImportWorkflowStorageRequest]]

## Responses

### 200
Workflow imported successfully

- **Content-Type**: `application/json`
- **Schema**: [[WorkflowStorageItem]]

### 400
Invalid workflow JSON

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

### 500
Database write error

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

