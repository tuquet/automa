---
tags:
  - api/endpoint
  - api/Storage
path: "/api/v1/storage/tables/{id}/rows"
method: "POST"
---
# Insert a row into a storage table

> [!info] 
> **Method**: `POST`
> **Path**: `/api/v1/storage/tables/{id}/rows`

Appends a new document row into the specified data table.

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `id` | path | ✅ | string | Unique table identifier |

## Request Body

- **Content-Type**: `application/json`
- **Schema**: [[AddTableRowPayload]]

## Responses

### 200
Row inserted successfully

- **Content-Type**: `application/json`
- **Schema**: [[AddTableRowResponse]]

### 400
Malformed row data

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

### 404
Table not found

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

### 500
Database insertion error

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

