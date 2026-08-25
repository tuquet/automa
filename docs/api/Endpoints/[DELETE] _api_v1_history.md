---
tags:
  - api/endpoint
  - api/History
path: "/api/v1/history"
method: "DELETE"
---
# Clear entire job execution history

> [!info] 
> **Method**: `DELETE`
> **Path**: `/api/v1/history`

Permanently truncates the job execution history and purge all logs from the database.

## Responses

### 200
All job history cleared successfully

- **Content-Type**: `application/json`
- **Schema**: [[HistoryActionResponse]]

### 500
Database purge failure

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

