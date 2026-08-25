---
tags:
  - api/endpoint
  - api/History
path: "/api/v1/history/{job_id}/logs"
method: "GET"
---
# Get execution details and logs for a job

> [!info] 
> **Method**: `GET`
> **Path**: `/api/v1/history/{job_id}/logs`

Retrieves full execution audit trail, timing breakdown, and detailed step logs for a specific job.

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `job_id` | path | ✅ | string | Unique job identifier |

## Responses

### 200
Detailed job execution record and logs

- **Content-Type**: `application/json`
- **Schema**: [[JobDetails]]

### 404
Job not found

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

### 500
Database query failure

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

