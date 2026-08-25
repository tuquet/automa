---
tags:
  - api/endpoint
  - api/Campaigns
path: "/api/v1/campaigns/{id}"
method: "DELETE"
---
# Abort a running multi-instance campaign

> [!info] 
> **Method**: `DELETE`
> **Path**: `/api/v1/campaigns/{id}`

Immediately halts all sub-jobs associated with the campaign, stops all browser processes in the grid matrix, and emits a matrix_finished SSE event.

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `id` | path | ✅ | string | Unique campaign identifier |

## Responses

### 200
Campaign aborted successfully

### 404
Campaign not found

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

