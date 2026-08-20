---
tags:
  - api/endpoint
  - api/Jobs
path: "/api/jobs/{job_id}/logs"
method: "POST"
---
# POST /api/jobs/{job_id}/logs

> [!info] 
> **Method**: `POST`
> **Path**: `/api/jobs/{job_id}/logs`

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `job_id` | path | ✅ | string |  |

## Request Body

- **Content-Type**: `application/json`
- **Schema**: [[JobLogPayload]]

## Responses

### 200
Log received

