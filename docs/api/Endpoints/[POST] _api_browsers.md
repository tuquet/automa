---
tags:
  - api/endpoint
  - api/Browsers
path: "/api/browsers"
method: "POST"
---
# POST /api/browsers

> [!info] 
> **Method**: `POST`
> **Path**: `/api/browsers`

## Request Body

- **Content-Type**: `application/json`
- **Schema**: [[CreateBrowserRequest]]

## Responses

### 200
Browser created successfully

### 500
Failed to create browser

- **Content-Type**: `application/json`
- **Schema**: any

