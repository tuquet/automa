---
tags:
  - api/endpoint
  - api/Browsers
path: "/api/v1/browsers/{id}"
method: "PUT"
---
# Update a browser profile

> [!info] 
> **Method**: `PUT`
> **Path**: `/api/v1/browsers/{id}`

Updates the configuration and metadata of an existing browser profile by ID.

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `id` | path | ✅ | string | Unique browser profile identifier |

## Request Body

- **Content-Type**: `application/json`
- **Schema**: [[UpdateBrowserRequest]]

## Responses

### 200
Browser profile updated successfully

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
Database update error

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

