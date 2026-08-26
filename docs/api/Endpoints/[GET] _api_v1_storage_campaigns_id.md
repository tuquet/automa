---
tags:
  - api/endpoint
  - api/Storage
path: "/api/v1/storage/campaigns/{id}"
method: "GET"
---
# Get a campaign by ID from storage database

> [!info] 
> **Method**: `GET`
> **Path**: `/api/v1/storage/campaigns/{id}`

Retrieves the full configuration and metadata of a campaign from SQLite database.

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `id` | path | ✅ | string | Unique campaign identifier |

## Responses

### 200
Campaign details

- **Content-Type**: `application/json`
- **Schema**: [[CampaignStorageItem]]

### 404
Campaign not found

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

### 500
Database read error

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

