---
tags:
  - api/endpoint
  - api/System
path: "/api/v1/system/studio/session"
method: "POST"
---
# Open Web Studio in default system browser

> [!info] 
> **Method**: `POST`
> **Path**: `/api/v1/system/studio/session`

Spawns the default OS web browser and navigates to the locally served Automa Web Studio canvas editor.

## Responses

### 200
Web Studio opened successfully in system browser

- **Content-Type**: `application/json`
- **Schema**: [[SystemResponse]]

