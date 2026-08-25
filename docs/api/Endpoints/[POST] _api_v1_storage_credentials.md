---
tags:
  - api/endpoint
  - api/Storage
path: "/api/v1/storage/credentials"
method: "POST"
---
# Add or update a stored credential

> [!info] 
> **Method**: `POST`
> **Path**: `/api/v1/storage/credentials`

Persists a new credential or updates an existing credential in storage.

## Request Body

- **Content-Type**: `application/json`
- **Schema**: [[StorageCredential]]

## Responses

### 200
Credential saved successfully

- **Content-Type**: `application/json`
- **Schema**: [[StorageCredential]]

### 400
Invalid credential payload

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

### 500
Database write error

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

