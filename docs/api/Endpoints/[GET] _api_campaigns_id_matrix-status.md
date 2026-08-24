---
tags:
  - api/endpoint
  - api/Campaigns
path: "/api/campaigns/{id}/matrix-status"
method: "GET"
---
# GET /api/campaigns/{id}/matrix-status

> [!info] 
> **Method**: `GET`
> **Path**: `/api/campaigns/{id}/matrix-status`

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `id` | path | ✅ | string | Campaign ID |

## Responses

### 200
Matrix status retrieved

- **Content-Type**: `application/json`
- **Schema**: [[MatrixStatusResponse]]

### 404
Campaign not found

