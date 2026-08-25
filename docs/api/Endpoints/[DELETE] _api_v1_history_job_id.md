---
tags:
  - api/endpoint
  - api/History
path: "/api/v1/history/{job_id}"
method: "DELETE"
---
# Delete a single job history item

> [!info] 
> **Method**: `DELETE`
> **Path**: `/api/v1/history/{job_id}`

Removes a specific job run and its associated logs from the SQLite history store.

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `job_id` | path | ✅ | string | Unique job identifier to delete |

## Responses

### 200
Job history entry deleted successfully

- **Content-Type**: `application/json`
- **Schema**: [[HistoryActionResponse]]

### 404
Job not found

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

### 500
Database deletion failure

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

