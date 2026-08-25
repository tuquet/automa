---
tags:
  - api/endpoint
  - api/Storage
path: "/api/v1/storage/variables"
method: "GET"
---
# List all storage variables

> [!info] 
> **Method**: `GET`
> **Path**: `/api/v1/storage/variables`

Retrieves all global and local variables persisted in Automa SQLite storage.

## Responses

### 200
List of variables

- **Content-Type**: `application/json`
- **Schema**: Array<[[StorageVariable]]>

### 500
Database read error

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

