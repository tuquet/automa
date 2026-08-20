---
tags:
  - api/endpoint
  - api/History
path: "/api/history"
method: "GET"
---
# GET /api/history

> [!info] 
> **Method**: `GET`
> **Path**: `/api/history`

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `limit` | query |  | integer,null |  |

## Responses

### 200
Get job history

- **Content-Type**: `application/json`
- **Schema**: Array<[[JobHistoryItem]]>

