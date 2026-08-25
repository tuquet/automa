---
tags:
  - api/endpoint
  - api/Events
path: "/api/v1/events"
method: "GET"
---
# Subscribe to global telemetry and logs SSE stream

> [!info] 
> **Method**: `GET`
> **Path**: `/api/v1/events`

Establishes a real-time Server-Sent Events stream for task progression, job lifecycle changes, logs, and matrix events.

## Responses

### 200
Server-Sent Events stream for task logs and progress

- **Content-Type**: `text/event-stream`
- **Schema**: any

