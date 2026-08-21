---
tags:
  - api/endpoint
  - api/Jobs
path: "/api/jobs/{job_id}"
method: "DELETE"
---
# DELETE /api/jobs/{job_id}

> [!info] 
> **Method**: `DELETE`
> **Path**: `/api/jobs/{job_id}`

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `job_id` | path | ✅ | string | Job ID |

## Responses

### 200
Job killed successfully

### 404
Job not found or not active

