---
tags:
  - api/endpoint
  - api/Storage
path: "/api/storage/tables/{id}/rows"
method: "GET"
---
# GET /api/storage/tables/{id}/rows

> [!info] 
> **Method**: `GET`
> **Path**: `/api/storage/tables/{id}/rows`

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `id` | path | ✅ | string | Table ID |

## Responses

### 200
List table rows

- **Content-Type**: `application/json`
- **Schema**: Array<[[TableRow]]>

### 500
Database error

