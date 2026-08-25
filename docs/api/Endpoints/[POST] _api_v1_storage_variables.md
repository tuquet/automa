---
tags:
  - api/endpoint
  - api/Storage
path: "/api/v1/storage/variables"
method: "POST"
---
# Add or update a storage variable

> [!info] 
> **Method**: `POST`
> **Path**: `/api/v1/storage/variables`

Creates a new variable or updates an existing variable by ID/key in storage.

## Request Body

- **Content-Type**: `application/json`
- **Schema**: [[StorageVariable]]

## Responses

### 200
Variable saved successfully

- **Content-Type**: `application/json`
- **Schema**: [[StorageVariable]]

### 400
Invalid variable payload

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

### 500
Database write error

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

