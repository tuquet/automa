---
tags:
  - api/endpoint
  - api/Profiles
path: "/api/profiles/{id}"
method: "PUT"
---
# PUT /api/profiles/{id}

> [!info] 
> **Method**: `PUT`
> **Path**: `/api/profiles/{id}`

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `id` | path | ✅ | string | Profile ID |

## Request Body

- **Content-Type**: `application/json`
- **Schema**: [[UpdateProfileRequest]]

## Responses

### 200
Profile updated successfully

### 500
Failed to update profile

- **Content-Type**: `application/json`
- **Schema**: any

