---
tags:
  - api/endpoint
  - api/History
path: "/api/history/{job_id}"
method: "DELETE"
---
# DELETE /api/history/{job_id}

> [!info] 
> **Method**: `DELETE`
> **Path**: `/api/history/{job_id}`

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `job_id` | path | ✅ | string | Job ID to delete |

## Responses

### 200
Job history deleted successfully

### 500
Database or thread pool failure

