---
tags:
  - api/endpoint
  - api/Browsers
path: "/api/v1/browsers"
method: "POST"
---
# Create a new browser profile

> [!info] 
> **Method**: `POST`
> **Path**: `/api/v1/browsers`

Persists a new isolated browser profile with custom fingerprint settings (User-Agent, Timezone) in SQLite.

## Request Body

- **Content-Type**: `application/json`
- **Schema**: [[CreateBrowserRequest]]

## Responses

### 200
Browser profile created successfully

- **Content-Type**: `application/json`
- **Schema**: any

### 400
Invalid browser ID or missing name

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

### 500
Failed to create browser profile in database

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

