---
tags:
  - api/endpoint
  - api/Browsers
path: "/api/v1/browsers/{id}/extensions"
method: "POST"
---
# Sideload unpacked extension into browser profile

> [!info] 
> **Method**: `POST`
> **Path**: `/api/v1/browsers/{id}/extensions`

Copies and configures an external unpacked extension into the specified browser profile's data directory.

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `id` | path | ✅ | string | Unique browser profile identifier |

## Request Body

- **Content-Type**: `application/json`
- **Schema**: [[SideloadExtensionPayload]]

## Responses

### 200
Extension sideloaded successfully

- **Content-Type**: `application/json`
- **Schema**: [[SideloadExtensionResponse]]

### 400
Invalid extension path or manifest

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

### 404
Browser profile not found

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

