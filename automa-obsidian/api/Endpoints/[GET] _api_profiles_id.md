---
tags:
  - api/endpoint
  - api/Profiles
path: "/api/profiles/{id}"
method: "GET"
---
# GET /api/profiles/{id}

> [!info] 
> **Method**: `GET`
> **Path**: `/api/profiles/{id}`

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `id` | path | ✅ | string | Profile ID |

## Responses

### 200
Profile details

- **Content-Type**: `application/json`
- **Schema**: [[ProfileResponse]]

### 404
Profile not found

- **Content-Type**: `application/json`
- **Schema**: any

