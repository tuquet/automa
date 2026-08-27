---
tags:
  - api/endpoint
  - api/History
path: "/api/v1/history"
method: "GET"
---
# Get paginated job execution history

> [!info] 
> **Method**: `GET`
> **Path**: `/api/v1/history`

Queries previous workflow execution runs and audit logs persisted in the SQLite database.

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `limit` | query |  | integer,null | Maximum number of history entries to return (default 50) |
| `offset` | query |  | integer,null | Number of items to skip for pagination (default 0) |
| `search` | query |  | string,null | Optional search query to filter history by workflow name or job ID |
| `status` | query |  | string,null | Optional status filter (e.g. "completed", "failed", "running") |

## Responses

### 200
List of past job execution summaries

- **Content-Type**: `application/json`
- **Schema**: Array<[[JobHistoryItem]]>

### 500
Database or thread pool failure

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

