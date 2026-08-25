---
tags:
  - api/endpoint
  - api/Jobs
path: "/api/v1/internal/worker/events"
method: "GET"
---
# Subscribe to worker event stream (SSE)

> [!info] 
> **Method**: `GET`
> **Path**: `/api/v1/internal/worker/events`

Establishes a long-lived Server-Sent Events (SSE) connection used by browser workers to receive workflow job dispatches and cancellation commands.

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `browserId` | query |  | string | Target browser instance identifier (defaults to 'daemon_worker') |

## Responses

### 200
SSE Stream for Worker jobs

- **Content-Type**: `text/event-stream`
- **Schema**: any

