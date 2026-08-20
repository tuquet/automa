---
tags:
  - api/endpoint
  - api/History
path: "/api/history/{job_id}/logs"
method: "GET"
---
# GET /api/history/{job_id}/logs

> [!info] 
> **Method**: `GET`
> **Path**: `/api/history/{job_id}/logs`

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `job_id` | path | ✅ | string | Job ID to fetch logs for |

## Responses

### 200
Get job logs

- **Content-Type**: `application/json`
- **Schema**: null | [[JobDetails]]

