---
tags:
  - api/endpoint
  - api/Browsers
path: "/api/v1/browsers/sessions"
method: "DELETE"
---
# Terminate all running browser processes

> [!info] 
> **Method**: `DELETE`
> **Path**: `/api/v1/browsers/sessions`

Forcefully shuts down all managed browser processes, child workers, and zombie processes across all profiles.

## Responses

### 200
All managed browser processes terminated

- **Content-Type**: `application/json`
- **Schema**: [[SystemResponse]]

