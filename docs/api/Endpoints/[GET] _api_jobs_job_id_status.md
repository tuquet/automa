---
tags:
  - api/endpoint
  - api/Jobs
path: "/api/jobs/{job_id}/status"
method: "GET"
---
# GET /api/jobs/{job_id}/status

> [!info] 
> **Method**: `GET`
> **Path**: `/api/jobs/{job_id}/status`

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `job_id` | path | ✅ | string | Job ID |

## Responses

### 200
Job status

- **Content-Type**: `application/json`
- **Schema**: [[JobStatusResponse]]

