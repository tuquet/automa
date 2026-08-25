---
tags:
  - api/endpoint
  - api/Browsers
path: "/api/v1/browsers/{id}/session"
method: "DELETE"
---
# Terminate an active browser session

> [!info] 
> **Method**: `DELETE`
> **Path**: `/api/v1/browsers/{id}/session`

Gracefully closes the running browser process associated with the profile ID, cleans up temporary locks, and streams teardown progress via SSE.

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `id` | path | ✅ | string | Unique browser profile identifier |

## Responses

### 200
Browser teardown progress stream

- **Content-Type**: `text/event-stream`
- **Schema**: any

