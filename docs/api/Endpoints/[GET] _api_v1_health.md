---
tags:
  - api/endpoint
  - api/System
path: "/api/v1/health"
method: "GET"
---
# Check daemon health status

> [!info] 
> **Method**: `GET`
> **Path**: `/api/v1/health`

Returns active operational health status, daemon version, and server readiness for clients.

## Responses

### 200
Daemon is healthy and accepting requests

- **Content-Type**: `application/json`
- **Schema**: [[HealthResponse]]

