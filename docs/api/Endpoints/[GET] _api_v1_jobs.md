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

## Responses

### 200
List of active running jobs

- **Content-Type**: `application/json`
- **Schema**: Array<[[ActiveJobResponse]]>

