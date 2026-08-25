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

## Responses

### 200
List of credentials

- **Content-Type**: `application/json`
- **Schema**: Array<[[StorageCredential]]>

### 500
Database read error

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

