---
tags:
  - api/endpoint
  - api/Storage
path: "/api/v1/storage/credentials"
method: "GET"
---
# List all stored credentials

> [!info] 
> **Method**: `GET`
> **Path**: `/api/v1/storage/credentials`

Retrieves all saved authentication credentials from storage.

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `limit` | query |  | integer,null | Maximum number of credentials to return |
| `offset` | query |  | integer,null | Number of items to skip for pagination (default 0) |
| `search` | query |  | string,null | Optional search query to filter credentials by name, key or ID |

## Responses

### 200
List of credentials

- **Content-Type**: `application/json`
- **Schema**: Array<[[StorageCredential]]>

### 500
Database read error

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

