---
tags:
  - api/endpoint
  - api/Browsers
path: "/api/browsers/{id}/extensions"
method: "POST"
---
# POST /api/browsers/{id}/extensions

> [!info] 
> **Method**: `POST`
> **Path**: `/api/browsers/{id}/extensions`

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `id` | path | ✅ | string |  |

## Request Body

- **Content-Type**: `application/json`
- **Schema**: [[SideloadExtensionPayload]]

## Responses

### 200
Sideloaded

- **Content-Type**: `application/json`
- **Schema**: [[SideloadExtensionResponse]]

