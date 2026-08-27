---
tags:
  - api/endpoint
  - api/Browsers
path: "/api/v1/browsers"
method: "GET"
---
# List all browser profiles

> [!info] 
> **Method**: `GET`
> **Path**: `/api/v1/browsers`

Retrieves an array of all persisted browser profiles, including their active online/offline connection state.

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `limit` | query |  | integer,null | Maximum number of browser profiles to return |
| `offset` | query |  | integer,null | Number of items to skip for pagination (default 0) |
| `search` | query |  | string,null | Optional search query to filter browsers by name or ID |

## Responses

### 200
List of all browser profiles

- **Content-Type**: `application/json`
- **Schema**: Array<[[BrowserResponse]]>

### 500
Database read error

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

