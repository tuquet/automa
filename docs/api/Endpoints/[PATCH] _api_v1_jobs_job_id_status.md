---
tags:
  - api/endpoint
  - api/Jobs
path: "/api/v1/jobs/{job_id}/status"
method: "PATCH"
---
# Mark a job as completed

> [!info] 
> **Method**: `PATCH`
> **Path**: `/api/v1/jobs/{job_id}/status`

Signals the completion of a workflow execution job, records the final status in SQLite, releases active tokens, and notifies subscribers.

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `job_id` | path | ✅ | string | Unique job identifier |

## Responses

### 200
Job marked as completed successfully

### 404
Job not found or already finished

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

