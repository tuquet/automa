---
tags:
  - api/endpoint
  - api/Jobs
path: "/api/v1/jobs/{job_id}/logs"
method: "POST"
---
# Append execution log entry for a job

> [!info] 
> **Method**: `POST`
> **Path**: `/api/v1/jobs/{job_id}/logs`

Receives runtime log entries and block execution telemetry from the browser worker, persisting them to the database and broadcasting via SSE.

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `job_id` | path | ✅ | string | Unique job identifier |

## Request Body

- **Content-Type**: `application/json`
- **Schema**: [[JobLogPayload]]

## Responses

### 200
Log entry received and persisted successfully

### 400
Invalid payload or job not found

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

