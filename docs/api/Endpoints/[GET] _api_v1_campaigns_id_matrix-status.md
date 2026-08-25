---
tags:
  - api/endpoint
  - api/Campaigns
path: "/api/v1/campaigns/{id}/matrix-status"
method: "GET"
---
# Get campaign grid matrix execution status

> [!info] 
> **Method**: `GET`
> **Path**: `/api/v1/campaigns/{id}/matrix-status`

Retrieves real-time slot layout and execution status for a multi-instance grid campaign.

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `id` | path | ✅ | string | Unique campaign identifier |

## Responses

### 200
Matrix status and slot allocation

- **Content-Type**: `application/json`
- **Schema**: [[MatrixStatusResponse]]

### 404
Campaign not found

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

