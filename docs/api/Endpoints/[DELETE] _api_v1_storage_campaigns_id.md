---
tags:
  - api/endpoint
  - api/Storage
path: "/api/v1/storage/campaigns/{id}"
method: "DELETE"
---
# Delete a campaign from storage database

> [!info] 
> **Method**: `DELETE`
> **Path**: `/api/v1/storage/campaigns/{id}`

Removes a campaign record from SQLite database by ID.

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `id` | path | ✅ | string | Unique campaign identifier |

## Responses

### 200
Campaign deleted successfully

- **Content-Type**: `application/json`
- **Schema**: [[DeleteCampaignResponse]]

### 404
Campaign not found

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

### 500
Database deletion error

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

