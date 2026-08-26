---
tags:
  - api/endpoint
  - api/Storage
path: "/api/v1/storage/workflow"
method: "PUT"
---
# Save or update workflow JSON file

> [!info] 
> **Method**: `PUT`
> **Path**: `/api/v1/storage/workflow`

Serializes and writes the workflow content securely to the specified path on disk, creating parent directories automatically if needed.

## Request Body

- **Content-Type**: `application/json`
- **Schema**: [[SaveWorkflowPayload]]

## Responses

### 200
Workflow JSON file saved successfully

- **Content-Type**: `application/json`
- **Schema**: [[SaveWorkflowResponse]]

### 400
Invalid payload or unwriteable path

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

