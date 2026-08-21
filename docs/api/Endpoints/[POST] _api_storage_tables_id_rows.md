---
tags:
  - api/endpoint
  - api/Storage
path: "/api/storage/tables/{id}/rows"
method: "POST"
---
# POST /api/storage/tables/{id}/rows

> [!info] 
> **Method**: `POST`
> **Path**: `/api/storage/tables/{id}/rows`

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `id` | path | ✅ | string | Table ID |

## Request Body

- **Content-Type**: `application/json`
- **Schema**: [[AddTableRowPayload]]

## Responses

### 200
Add table row

- **Content-Type**: `application/json`
- **Schema**: [[AddTableRowResponse]]

### 500
Database error

