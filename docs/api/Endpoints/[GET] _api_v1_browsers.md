---
tags:
  - api/endpoint
  - api/Browsers
path: "/api/v1/browsers"
method: "GET"
---
# List all browser profiles

> [!info] 
> **Method**: `GET`
> **Path**: `/api/v1/browsers`

Retrieves an array of all persisted browser profiles, including their active online/offline connection state.

## Responses

### 200
List of all browser profiles

- **Content-Type**: `application/json`
- **Schema**: Array<[[BrowserResponse]]>

### 500
Database read error

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

