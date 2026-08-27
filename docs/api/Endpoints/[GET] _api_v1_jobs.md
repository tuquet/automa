---
tags:
  - api/endpoint
  - api/Jobs
path: "/api/v1/jobs"
method: "GET"
---
# List all active running jobs

> [!info] 
> **Method**: `GET`
> **Path**: `/api/v1/jobs`

Returns an array of identifiers for all workflow execution jobs currently running in the daemon.

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `limit` | query |  | integer,null | Maximum number of active jobs to return |
| `offset` | query |  | integer,null | Number of items to skip for pagination (default 0) |
| `search` | query |  | string,null | Optional search query to filter active jobs by job ID |

## Responses

### 200
List of active running jobs

- **Content-Type**: `application/json`
- **Schema**: Array<[[ActiveJobResponse]]>

