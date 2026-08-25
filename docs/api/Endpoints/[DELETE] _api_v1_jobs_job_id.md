---
tags:
  - api/endpoint
  - api/Jobs
path: "/api/v1/jobs/{job_id}"
method: "DELETE"
---
# Abort a running job

> [!info] 
> **Method**: `DELETE`
> **Path**: `/api/v1/jobs/{job_id}`

Immediately triggers the cancellation token for the specified job, sends a stop signal to the browser worker, and updates job state.

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `job_id` | path | ✅ | string | Unique job identifier |

## Responses

### 200
Job aborted successfully

### 404
Job not found or not active

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

