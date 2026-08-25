---
tags:
  - api/endpoint
  - api/Browsers
path: "/api/v1/browsers/{id}"
method: "DELETE"
---
# Delete a browser profile

> [!info] 
> **Method**: `DELETE`
> **Path**: `/api/v1/browsers/{id}`

Permanently removes a browser profile from SQLite storage and cleans up associated session data.

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `id` | path | ✅ | string | Unique browser profile identifier |

## Responses

### 200
Browser profile deleted successfully

- **Content-Type**: `application/json`
- **Schema**: any

### 400
Invalid browser ID

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

### 404
Browser profile not found

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

### 500
Database deletion error

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

