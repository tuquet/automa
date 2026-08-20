---
tags:
  - api/endpoint
  - api/Profiles
path: "/api/profiles"
method: "POST"
---
# POST /api/profiles

> [!info] 
> **Method**: `POST`
> **Path**: `/api/profiles`

## Request Body

- **Content-Type**: `application/json`
- **Schema**: [[CreateProfileRequest]]

## Responses

### 200
Profile created successfully

### 500
Failed to create profile

- **Content-Type**: `application/json`
- **Schema**: any

