---
tags:
  - api/endpoint
  - api/Storage
path: "/api/v1/storage/campaigns/{id}"
method: "PUT"
---
# Update a campaign in storage database

> [!info] 
> **Method**: `PUT`
> **Path**: `/api/v1/storage/campaigns/{id}`

Modifies an existing campaign record in SQLite database.

## Parameters

| Name | In | Required | Type | Description |
|---|---|---|---|---|
| `id` | path | ✅ | string | Unique campaign identifier |

## Request Body

- **Content-Type**: `application/json`
- **Schema**: [[UpdateCampaignStorageRequest]]

## Responses

### 200
Campaign updated successfully

- **Content-Type**: `application/json`
- **Schema**: [[CampaignStorageItem]]

### 400
Invalid update payload

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

### 404
Campaign not found

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

### 500
Database write error

- **Content-Type**: `application/json`
- **Schema**: [[ApiErrorResponse]]

