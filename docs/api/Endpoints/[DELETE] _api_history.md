---
tags:
  - api/endpoint
  - api/History
path: "/api/history"
method: "DELETE"
---
# DELETE /api/history

> [!info] 
> **Method**: `DELETE`
> **Path**: `/api/history`

## Responses

### 200
All job history cleared successfully

- **Content-Type**: `application/json`
- **Schema**: [[HistoryActionResponse]]

### 500
Database or thread pool failure

