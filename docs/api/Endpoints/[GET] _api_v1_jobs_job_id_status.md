---
tags:
  - api/endpoint
  - api/Jobs
path: "/api/v1/jobs/{job_id}/status"
method: "GET"
---
# Get current status of a job

> [!info] 
> **Method**: `GET`
> **Path**: `/api/v1/jobs/{job_id}/status`

Queries the runtime lifecycle status of a specific job by its unique identifier.

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `job_id` | path | ✅ | string | Unique job identifier |

## Responses

### 200
Current job execution status

- **Content-Type**: `application/json`
- **Schema**: [[JobStatusResponse]]

### 404
Job not found

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

