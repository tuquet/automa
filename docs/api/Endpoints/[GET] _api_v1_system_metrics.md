---
tags:
  - api/endpoint
  - api/System
path: "/api/v1/system/metrics"
method: "GET"
---
# Get host system performance metrics

> [!info] 
> **Method**: `GET`
> **Path**: `/api/v1/system/metrics`

Samples current CPU load, memory utilization, and active browser runner counts.

## Responses

### 200
System performance metrics sampled successfully

- **Content-Type**: `application/json`
- **Schema**: [[SystemMetricsResponse]]

