---
tags:
  - api/endpoint
  - api/Storage
path: "/api/v1/storage/tables"
method: "GET"
---
# List all storage tables

> [!info] 
> **Method**: `GET`
> **Path**: `/api/v1/storage/tables`

Retrieves schemas for all user data tables stored in SQLite.

## Responses

### 200
List of data tables

- **Content-Type**: `application/json`
- **Schema**: Array<[[StorageTable]]>

### 500
Database read error

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

