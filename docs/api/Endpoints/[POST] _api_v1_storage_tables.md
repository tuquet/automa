---
tags:
  - api/endpoint
  - api/Storage
path: "/api/v1/storage/tables"
method: "POST"
---
# Create or update a storage table schema

> [!info] 
> **Method**: `POST`
> **Path**: `/api/v1/storage/tables`

Defines a new data table schema or modifies column definitions for an existing table.

## Request Body

- **Content-Type**: `application/json`
- **Schema**: [[StorageTable]]

## Responses

### 200
Table schema created or updated

- **Content-Type**: `application/json`
- **Schema**: [[StorageTable]]

### 400
Invalid table schema

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

### 500
Database write error

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

