---
tags:
  - api/endpoint
  - api/Storage
path: "/api/v1/storage/workflow"
method: "GET"
---
# Read workflow JSON file from filesystem

> [!info] 
> **Method**: `GET`
> **Path**: `/api/v1/storage/workflow`

Reads and parses an automation workflow file (.workflow.json) from the given filesystem path.

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `path` | query | ✅ | string | Full filesystem path to the target .workflow.json file |

## Responses

### 200
Workflow JSON file read successfully

### 400
Invalid path or unreadable workflow JSON

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

### 404
Workflow file not found on disk

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

