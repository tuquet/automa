---
tags:
  - api/endpoint
  - api/Browsers
path: "/api/browsers/{id}/session"
method: "DELETE"
---
# DELETE /api/browsers/{id}/session

> [!info] 
> **Method**: `DELETE`
> **Path**: `/api/browsers/{id}/session`

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `id` | path | ✅ | string | Browser ID |

## Responses

### 200
Browser session terminated

- **Content-Type**: `text/event-stream`
- **Schema**: any

